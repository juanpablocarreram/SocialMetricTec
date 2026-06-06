from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None


class MilestoneOut(BaseModel):
    milestone_id: int
    project_id: int
    title: str
    description: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
