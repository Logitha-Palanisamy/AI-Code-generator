from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class ProjectCreate(BaseModel):
    requirement_text: str = Field(..., min_length=10, description="Description of the codebase requirements")
    target_language: str = Field("Python", max_length=50, description="Target programming language")

class ProjectArtifactCreate(BaseModel):
    filename: str = Field(..., description="Filename of the project artifact")
    content: str = Field(..., description="File contents")

class PipelineRunResponse(BaseModel):
    id: int
    project_id: int
    stage: str
    status: str
    error: Optional[str] = None
    attempt_number: int
    started_at: datetime
    finished_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ProjectResponse(BaseModel):
    id: int
    user_id: int
    status: str
    requirement_text: str
    target_language: str
    complexity: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    pipeline_runs: List[PipelineRunResponse] = []

    model_config = ConfigDict(from_attributes=True)
