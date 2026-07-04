import json
import time
from datetime import datetime, timezone
from pathlib import Path
import redis
from backend.core.config import settings
from backend.db.session import SessionLocal
from backend.models.project import Project
from backend.models.pipeline import PipelineRun
from backend.jobs.celery_app import celery_app
from backend.core.logger import logger


def generate_project_artifacts(project_id: int, requirement_text: str, target_language: str, workspace_root: Path | None = None) -> list[str]:
    """Generate a small language-specific project scaffold from the given requirement text."""
    root = workspace_root or Path(__file__).resolve().parent.parent.parent
    project_dir = root / "generated_projects" / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)

    if target_language.lower() == "typescript":
        entrypoint = project_dir / "main.ts"
        entrypoint.write_text(
            "// Generated from requirements\n"
            f"export function main() {{\n"
            f"  console.log('Generated TypeScript for: {requirement_text}')\n"
            f"}}\n",
            encoding="utf-8",
        )
    elif target_language.lower() == "go":
        entrypoint = project_dir / "main.go"
        entrypoint.write_text(
            "package main\n\n"
            f"import \"fmt\"\n\n"
            f"func main() {{\n"
            f"  fmt.Println(\"Generated Go for: {requirement_text}\")\n"
            f"}}\n",
            encoding="utf-8",
        )
    else:
        entrypoint = project_dir / "main.py"
        entrypoint.write_text(
            "# Generated from requirements\n"
            f"def main():\n"
            f"    print('Generated Python for: {requirement_text}')\n\n"
            f"if __name__ == '__main__':\n"
            f"    main()\n",
            encoding="utf-8",
        )

    readme = project_dir / "README.md"
    readme.write_text(
        f"# Generated project for {target_language}\n\n"
        f"Requirements: {requirement_text}\n",
        encoding="utf-8",
    )

    return [str(entrypoint.relative_to(root)), str(readme.relative_to(root))]

# Synchronous redis client for Celery worker pub/sub broadcasts
redis_client = redis.from_url(settings.REDIS_URL)

def publish_pipeline_event(project_id: int, status: str, stage: str, message: str, attempt: int = 1, error: str = None):
    """Publishes a JSON state update over Redis pub/sub to notify active WebSockets, with a local memory fallback."""
    payload = {
        "project_id": project_id,
        "status": status,
        "stage": stage,
        "message": message,
        "attempt_number": attempt,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    redis_success = False
    try:
        redis_client.publish("project_updates", json.dumps(payload))
        redis_success = True
    except Exception as exc:
        logger.warning("Failed to publish pubsub event to Redis, relying on local memory broadcast fallback", error=str(exc))

    # Trigger local memory broadcast fallback in the active event loop
    try:
        import asyncio
        from backend.websocket.manager import manager
        try:
            loop = asyncio.get_running_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(manager.broadcast_to_project(project_id, payload), loop)
        except RuntimeError:
            # If no event loop is running in this thread, we are in a pure Celery worker or sub-thread without a loop.
            pass
    except Exception as local_exc:
        logger.error("Failed to broadcast locally in orchestrator fallback", error=str(local_exc))


@celery_app.task(name="run_pipeline")
def run_pipeline(project_id: int):
    """
    Asynchronous task driving the 10-stage project pipeline.
    Applies incremental mock processing, database logs, and live status broadcasts.
    """
    logger.info("Starting pipeline execution", project_id=project_id)
    db = SessionLocal()
    
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.error("Project not found, aborting pipeline", project_id=project_id)
            return False
            
        # 1. State: CREATED
        project.status = "CREATED"
        db.commit()
        publish_pipeline_event(project_id, "CREATED", "INIT", "Initializing workflow pipeline")
        time.sleep(0.5)

        # Helper to execute a standard pipeline stage
        def run_stage(stage_name: str, start_msg: str, success_msg: str, duration: float) -> bool:
            project.status = stage_name
            db.commit()
            
            # Record start of stage
            run_log = PipelineRun(
                project_id=project_id,
                stage=stage_name,
                status="RUNNING",
                started_at=datetime.now(timezone.utc)
            )
            db.add(run_log)
            db.commit()
            
            publish_pipeline_event(project_id, stage_name, stage_name, start_msg)
            time.sleep(duration) # Simulate processing
            
            # Record success of stage
            run_log.status = "SUCCESS"
            run_log.finished_at = datetime.now(timezone.utc)
            db.commit()
            return True

        # 2. Stage: ANALYZING
        run_stage("ANALYZING", "Analyzing requirement prompt text...", "Requirements deconstruction complete", 1.0)
        project.status = "ANALYZED"
        db.commit()
        
        # 3. Stage: GENERATING_CODE
        generated_files = generate_project_artifacts(
            project_id=project_id,
            requirement_text=project.requirement_text,
            target_language=project.target_language,
        )
        publish_pipeline_event(
            project_id,
            "GENERATING_CODE",
            "GENERATING_CODE",
            f"Generated {project.target_language} scaffold with {len(generated_files)} files",
        )
        project.status = "CODE_GENERATED"
        db.commit()

        # 4. Stage: REVIEWING
        run_stage("REVIEWING", "Analyzing code quality and security checks...", "Static audit code review complete", 1.0)
        project.status = "REVIEWED"
        db.commit()

        # 5. Stage: GENERATING_TESTS
        run_stage("GENERATING_TESTS", "Writing unit test suites...", "Test generation complete", 1.0)
        project.status = "TESTS_GENERATED"
        db.commit()

        # 6. EXECUTING_TESTS / AUTO_FIXING self-healing loop
        max_attempts = 3
        test_success = False
        
        for attempt in range(1, max_attempts + 1):
            project.status = "EXECUTING_TESTS"
            db.commit()
            
            run_log = PipelineRun(
                project_id=project_id,
                stage="EXECUTING_TESTS",
                status="RUNNING",
                attempt_number=attempt,
                started_at=datetime.now(timezone.utc)
            )
            db.add(run_log)
            db.commit()
            
            publish_pipeline_event(
                project_id, 
                "EXECUTING_TESTS", 
                "EXECUTING_TESTS", 
                f"Executing test cases inside sandbox (attempt {attempt}/{max_attempts})",
                attempt=attempt
            )
            time.sleep(1.0)
            
            # Simulate a failure on the first attempt to trigger self-healing
            if attempt == 1:
                run_log.status = "FAILED"
                run_log.error = "AssertionError: test_calculate_total failed. Expected 100, got 0."
                run_log.finished_at = datetime.now(timezone.utc)
                db.commit()
                
                # Transition to AUTO_FIXING
                project.status = "AUTO_FIXING"
                db.commit()
                
                fix_log = PipelineRun(
                    project_id=project_id,
                    stage="AUTO_FIXING",
                    status="RUNNING",
                    attempt_number=attempt,
                    started_at=datetime.now(timezone.utc)
                )
                db.add(fix_log)
                db.commit()
                
                publish_pipeline_event(
                    project_id, 
                    "AUTO_FIXING", 
                    "AUTO_FIXING", 
                    "Tests failed. Prompting self-healing loop...",
                    attempt=attempt,
                    error=run_log.error
                )
                time.sleep(1.5)
                
                fix_log.status = "SUCCESS"
                fix_log.finished_at = datetime.now(timezone.utc)
                db.commit()
            else:
                # Tests pass on attempt 2
                run_log.status = "SUCCESS"
                run_log.finished_at = datetime.now(timezone.utc)
                db.commit()
                test_success = True
                break
                
        if not test_success:
            project.status = "FIX_EXHAUSTED"
            db.commit()
            publish_pipeline_event(project_id, "FIX_EXHAUSTED", "TESTS", "Self-healing loops exhausted without success")
            return False

        # 7. Stage: COMPLETED
        project.status = "COMPLETED"
        db.commit()
        
        # Log final pipeline run
        final_run = PipelineRun(
            project_id=project_id,
            stage="COMPLETED",
            status="SUCCESS",
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc)
        )
        db.add(final_run)
        db.commit()
        
        publish_pipeline_event(project_id, "COMPLETED", "COMPLETED", "Project generation completed successfully")
        logger.info("Pipeline completed successfully", project_id=project_id)
        return True
        
    except Exception as exc:
        logger.exception("Pipeline crashed due to internal error", project_id=project_id, error=str(exc))
        try:
            project.status = "FAILED"
            db.commit()
            publish_pipeline_event(project_id, "FAILED", "CRASHED", f"Pipeline crashed: {str(exc)}")
        except Exception:
            pass
        return False
    finally:
        db.close()
