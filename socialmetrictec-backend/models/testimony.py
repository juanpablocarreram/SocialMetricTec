from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base


class Testimony(Base):
    __tablename__ = "testimony"
    testimony_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("project.project_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    author_username = Column(String(100), ForeignKey("user.username", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    display_name = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    tags = relationship("TestimonyTag", back_populates="testimony", cascade="all, delete-orphan")


class TestimonyTag(Base):
    __tablename__ = "testimony_tag"
    testimony_id = Column(Integer, ForeignKey("testimony.testimony_id", ondelete="CASCADE", onupdate="CASCADE"), primary_key=True)
    tag_name = Column(String(30), primary_key=True)
    testimony = relationship("Testimony", back_populates="tags")
