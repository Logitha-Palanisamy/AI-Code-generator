from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class SettingUpdate(BaseModel):
    theme: str = Field("dark", max_length=20, description="Visual theme (light, dark, system)")
    preferred_model: str = Field("claude-3-5-sonnet", max_length=100, description="Preferred AI model")
    timeout_seconds: int = Field(60, ge=5, le=300, description="Sandbox timeout limit in seconds")
    personal_api_key: Optional[str] = Field(None, max_length=255, description="Optional override Anthropic API Key")

class SettingResponse(BaseModel):
    id: int
    user_id: int
    theme: str
    preferred_model: str
    timeout_seconds: int
    personal_api_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
