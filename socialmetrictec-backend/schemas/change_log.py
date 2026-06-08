from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ChangeLogOut(BaseModel):
    log_id: int
    project_id: int
    event_type: str
    entity_name: Optional[str] = None
    occurred_at: datetime
    model_config = ConfigDict(from_attributes=True)
