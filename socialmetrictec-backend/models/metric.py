from sqlalchemy import Column, Integer, String, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from db.database import Base


class Metric(Base):
    __tablename__ = "metric"
    metric_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    metric_title = Column(String(255), nullable=False)
    project_id = Column(Integer, ForeignKey("project.project_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    sub_metrics = relationship("SubMetric", back_populates="metric", cascade="all, delete-orphan")


class SubMetric(Base):
    __tablename__ = "sub_metric"
    sub_metric_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sub_metric_title = Column(String(255), nullable=False)
    sub_metric_value = Column(DECIMAL(18, 4), nullable=True)
    metric_id = Column(Integer, ForeignKey("metric.metric_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    metric = relationship("Metric", back_populates="sub_metrics")
