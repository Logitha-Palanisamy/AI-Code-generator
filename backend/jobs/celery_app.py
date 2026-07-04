from celery import Celery
from backend.core.config import settings

# Instantiate Celery application linked to Redis broker
celery_app = Celery(
    "code_agent_jobs",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Discover task modules inside backend/jobs/ folder
celery_app.autodiscover_tasks(["backend.jobs"], force=True)
