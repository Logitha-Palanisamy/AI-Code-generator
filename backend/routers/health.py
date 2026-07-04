from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.core.dependencies import get_db
from datetime import datetime, timezone
from backend.core.logger import logger

router = APIRouter(prefix="/health", tags=["System Health"])

@router.get("")
def health_check(db: Session = Depends(get_db)):
    """Verifies that the server is up and the database connection works."""
    try:
        # Run a simple SELECT 1 to verify connectivity in a SQLAlchemy 2.0 compliant way
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as exc:
        logger.error("Health check failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )
