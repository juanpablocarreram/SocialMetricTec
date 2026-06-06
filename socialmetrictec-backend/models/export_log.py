from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from db.database import Base


class ExportLog(Base):
    __tablename__ = "export_log"
    export_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    exported_by = Column(String(100), nullable=False)
    project_id = Column(Integer, nullable=True)
    date_from = Column(String(10), nullable=True)
    date_to = Column(String(10), nullable=True)
    row_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())
