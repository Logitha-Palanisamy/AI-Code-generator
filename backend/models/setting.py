from sqlalchemy import String, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from backend.db.base import Base

class Setting(Base):
    __tablename__ = "settings"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    theme: Mapped[str] = mapped_column(String(20), default="dark", nullable=False)
    preferred_model: Mapped[str] = mapped_column(String(100), default="claude-3-5-sonnet", nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    personal_api_key: Mapped[str] = mapped_column(String(255), nullable=True) # Optional user-provided Anthropic Key
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
