from sqlalchemy.orm import Session
from models.metric import Metric, SubMetric
from models.project import Manages
from schemas.metric import MetricCreate, MetricUpdate, SubMetricCreate, SubMetricUpdate
from schemas.user import UserOut as UserOutSchema
from services.crud.change_log import log_event


def _is_authorized(db: Session, project_id: int, user: UserOutSchema) -> bool:
    if user.is_admin:
        return True
    return db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username
    ).first() is not None


def get_metrics_for_project(db: Session, project_id: int) -> list[Metric]:
    return db.query(Metric).filter(Metric.project_id == project_id).all()


def create_metric(db: Session, project_id: int, data: MetricCreate, user: UserOutSchema) -> Metric | str:
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    metric = Metric(metric_title=data.metric_title, project_id=project_id)
    db.add(metric)
    db.flush()

    for sm in data.sub_metrics:
        db.add(SubMetric(
            sub_metric_title=sm.sub_metric_title,
            sub_metric_value=sm.sub_metric_value,
            metric_id=metric.metric_id
        ))

    log_event(db, project_id, "metric_created", data.metric_title)
    db.commit()
    db.refresh(metric)
    return metric


def update_metric(db: Session, metric_id: int, data: MetricUpdate, user: UserOutSchema) -> Metric | str:
    metric = db.query(Metric).filter(Metric.metric_id == metric_id).first()
    if not metric:
        return "no_encontrado"
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    metric.metric_title = data.metric_title
    log_event(db, metric.project_id, "metric_updated", data.metric_title)
    db.commit()
    db.refresh(metric)
    return metric


def delete_metric(db: Session, metric_id: int, user: UserOutSchema) -> str:
    metric = db.query(Metric).filter(Metric.metric_id == metric_id).first()
    if not metric:
        return "no_encontrado"
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    project_id = metric.project_id
    title = metric.metric_title
    log_event(db, project_id, "metric_deleted", title)
    db.delete(metric)
    db.commit()
    return "exito"


def create_sub_metric(db: Session, metric_id: int, data: SubMetricCreate, user: UserOutSchema) -> SubMetric | str:
    metric = db.query(Metric).filter(Metric.metric_id == metric_id).first()
    if not metric:
        return "no_encontrado"
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    sub_metric = SubMetric(
        sub_metric_title=data.sub_metric_title,
        sub_metric_value=data.sub_metric_value,
        metric_id=metric_id
    )
    db.add(sub_metric)
    db.commit()
    db.refresh(sub_metric)
    return sub_metric


def update_sub_metric(db: Session, sub_metric_id: int, data: SubMetricUpdate, user: UserOutSchema) -> SubMetric | str:
    sub_metric = db.query(SubMetric).filter(SubMetric.sub_metric_id == sub_metric_id).first()
    if not sub_metric:
        return "no_encontrado"

    metric = db.query(Metric).filter(Metric.metric_id == sub_metric.metric_id).first()
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    sub_metric.sub_metric_title = data.sub_metric_title
    sub_metric.sub_metric_value = data.sub_metric_value
    db.commit()
    db.refresh(sub_metric)
    return sub_metric


def delete_sub_metric(db: Session, sub_metric_id: int, user: UserOutSchema) -> str:
    sub_metric = db.query(SubMetric).filter(SubMetric.sub_metric_id == sub_metric_id).first()
    if not sub_metric:
        return "no_encontrado"

    metric = db.query(Metric).filter(Metric.metric_id == sub_metric.metric_id).first()
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    db.delete(sub_metric)
    db.commit()
    return "exito"
