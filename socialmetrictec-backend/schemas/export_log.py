from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ExportLogOut(BaseModel):
    export_id: int
    exported_by: str
    project_id: Optional[int] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    row_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
