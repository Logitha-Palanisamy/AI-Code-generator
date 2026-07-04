from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from backend.db.base import Base

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. ANALYZING, GENERATING_CODE, EXECUTING_TESTS
    status: Mapped[str] = mapped_column(String(50), default="RUNNING", nullable=False) # RUNNING, SUCCESS, FAILED
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    started_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
