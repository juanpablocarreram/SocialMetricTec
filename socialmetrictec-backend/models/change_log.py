from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from db.database import Base


class ProjectChangeLog(Base):
    __tablename__ = "project_change_log"
    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, nullable=False)
    event_type = Column(String(60), nullable=False)
    entity_name = Column(String(255), nullable=True)
    occurred_at = Column(DateTime, server_default=func.now())
