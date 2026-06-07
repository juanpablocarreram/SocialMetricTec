from pydantic import BaseModel, ConfigDict
from typing import Optional


class SubMetricCreate(BaseModel):
    sub_metric_title: str
    sub_metric_value: Optional[str] = None


class SubMetricUpdate(BaseModel):
    sub_metric_title: str
    sub_metric_value: Optional[str] = None


class SubMetricOut(BaseModel):
    sub_metric_id: int
    sub_metric_title: str
    sub_metric_value: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class MetricCreate(BaseModel):
    metric_title: str
    sub_metrics: list[SubMetricCreate] = []


class MetricUpdate(BaseModel):
    metric_title: str


class MetricOut(BaseModel):
    metric_id: int
    metric_title: str
    project_id: int
    sub_metrics: list[SubMetricOut] = []
    model_config = ConfigDict(from_attributes=True)
