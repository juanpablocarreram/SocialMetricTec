from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class PhotoOut(BaseModel):
    photo_id: int
    project_id: int
    url: str
    caption: Optional[str]
    uploaded_by: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
