from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AIUsageLogResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int] = None
    provider: str
    model: str
    stage: str
    input_tokens: int
    output_tokens: int
    estimated_cost: float
    latency_ms: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
