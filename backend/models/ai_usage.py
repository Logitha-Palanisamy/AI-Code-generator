from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from backend.db.base import Base

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. anthropic
    model: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. claude-3-5-sonnet
    stage: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. GENERATE_CODE
    input_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
