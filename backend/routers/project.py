from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from backend.core.dependencies import get_db, get_current_user
from backend.models.user import User
from backend.models.project import Project
from backend.models.pipeline import PipelineRun
from backend.schemas.project import ProjectCreate, ProjectResponse
from backend.core.logger import logger
from pathlib import Path
import json

router = APIRouter(prefix="/projects", tags=["Projects"])


def _dispatch_pipeline(project_id: int, background_tasks: BackgroundTasks) -> None:
    """Dispatch the pipeline using Celery when workers are available; otherwise use local background execution."""
    from backend.jobs.orchestrator import run_pipeline

    try:
        from backend.jobs.celery_app import celery_app

        inspect = celery_app.control.inspect(timeout=1.0)
        workers = inspect.ping()
        if workers:
            run_pipeline.delay(project_id)
            logger.info("Pipeline task dispatched to Celery worker", project_id=project_id)
            return
    except Exception as exc:
        logger.warning(
            "Celery worker inspection failed; falling back to local background execution",
            project_id=project_id,
            error=str(exc),
        )

    background_tasks.add_task(run_pipeline, project_id)
    logger.info("Pipeline task dispatched to local BackgroundTasks", project_id=project_id)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_project(
    payload: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new project requirement record.
    Attempts to trigger a Celery task if Redis is available,
    otherwise runs the pipeline in a local background thread.
    """
    project = Project(
        user_id=current_user.id,
        requirement_text=payload.requirement_text,
        target_language=payload.target_language,
        status="CREATED"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    logger.info("Project created", project_id=project.id, user_id=current_user.id)
    
    _dispatch_pipeline(project.id, background_tasks)
    return project

@router.get("", response_model=List[ProjectResponse], include_in_schema=False)
@router.get("/", response_model=List[ProjectResponse], include_in_schema=False)
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all projects for the authenticated user, or all projects if admin."""
    if current_user.role == "admin":
        projects = db.query(Project).all()
    else:
        projects = db.query(Project).filter(Project.user_id == current_user.id).all()
        
    # Eagerly load pipeline runs for each project
    for project in projects:
        project.pipeline_runs = db.query(PipelineRun).filter(PipelineRun.project_id == project.id).order_by(PipelineRun.started_at.asc()).all()
        
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves metadata and runs for a specific project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    project.pipeline_runs = db.query(PipelineRun).filter(PipelineRun.project_id == project.id).order_by(PipelineRun.started_at.asc()).all()
    return project

@router.delete("/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a project and its associated pipeline runs."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    db.delete(project)
    db.commit()
    logger.info("Project deleted successfully", project_id=project_id, user_id=current_user.id)
    return {"detail": "Project deleted successfully"}

@router.post("/{project_id}/rebuild", response_model=ProjectResponse)
def rebuild_project(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clears all logs/runs for the specified project,
    resets status to CREATED, and reruns the pipeline.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Remove existing pipeline runs
    db.query(PipelineRun).filter(PipelineRun.project_id == project_id).delete()
    
    project.status = "CREATED"
    db.commit()
    db.refresh(project)
    
    logger.info("Project rebuild initiated", project_id=project_id, user_id=current_user.id)
    
    _dispatch_pipeline(project.id, background_tasks)
    project.pipeline_runs = []
    return project


@router.post("/{project_id}/artifacts", status_code=status.HTTP_201_CREATED)
def save_project_artifact(
    project_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a generated artifact file for the requested project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    project_dir = Path(__file__).resolve().parent.parent.parent / "generated_projects" / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)

    filename = payload.get("filename")
    content = payload.get("content", "")
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

    file_path = project_dir / filename
    file_path.write_text(content, encoding="utf-8")

    return {"success": True, "filename": filename}


@router.get("/{project_id}/artifacts")
def get_project_artifacts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns generated artifact files for the requested project if the caller is authorized."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Locate generated project directory
    root = Path(__file__).resolve().parent.parent.parent
    project_dir = root / "generated_projects" / str(project_id)
    if not project_dir.exists() or not project_dir.is_dir():
        return {"files": []}

    artifacts = []
    for p in sorted(project_dir.iterdir()):
        if p.is_file():
            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                content = ""
            artifacts.append({"filename": p.name, "content": content})

    return {"files": artifacts}
