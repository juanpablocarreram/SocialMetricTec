from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from db.database import Base


class ProjectPhoto(Base):
    __tablename__ = "project_photo"
    photo_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("project.project_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    url = Column(String(2048), nullable=False)
    caption = Column(String(255), nullable=True)
    uploaded_by = Column(String(100), ForeignKey("user.username", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
