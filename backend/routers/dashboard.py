from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.dependencies import get_current_user, get_db
from backend.models.project import Project
from backend.models.ai_usage import AIUsageLog
from backend.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns aggregate dashboard metrics for the authenticated user."""
    if current_user.role == "admin":
        projects = db.query(Project).all()
    else:
        projects = db.query(Project).filter(Project.user_id == current_user.id).all()

    completed = sum(1 for project in projects if project.status == "COMPLETED")
    failed = sum(1 for project in projects if project.status in {"FAILED", "FIX_EXHAUSTED"})
    active = sum(1 for project in projects if project.status not in {"COMPLETED", "FAILED", "FIX_EXHAUSTED"})
    total_cost = (
        db.query(AIUsageLog)
        .filter(AIUsageLog.user_id == current_user.id)
        .with_entities(AIUsageLog.estimated_cost)
        .all()
    )

    return {
        "total_projects": len(projects),
        "completed_projects": completed,
        "failed_projects": failed,
        "active_projects": active,
        "success_rate": round((completed / len(projects) * 100) if projects else 0, 1),
        "estimated_cost": round(sum(cost[0] for cost in total_cost), 4),
        "recent_projects": [
            {
                "id": project.id,
                "requirement_text": project.requirement_text,
                "status": project.status,
                "target_language": project.target_language,
                "created_at": project.created_at.isoformat(),
            }
            for project in sorted(projects, key=lambda item: item.created_at, reverse=True)[:6]
        ],
    }
