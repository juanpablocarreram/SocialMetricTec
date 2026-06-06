from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.metric import MetricCreate, MetricOut, MetricUpdate, SubMetricCreate, SubMetricOut, SubMetricUpdate
from schemas.user import UserOut
from services.crud.metric import (
    create_metric,
    create_sub_metric,
    delete_metric,
    delete_sub_metric,
    get_metrics_for_project,
    update_metric,
    update_sub_metric,
)
from routes.deps import get_current_user_from_token
from db.database import get_db

router = APIRouter(prefix="/project/{project_id}/metrics", tags=["metrics"])


def _raise_for_service_error(result) -> None:
    if result == "no_encontrado":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Métrica no encontrada.")
    if result == "acceso_denegado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para gestionar las métricas de este proyecto.",
        )


@router.get("", response_model=list[MetricOut])
def list_metrics(project_id: int, db: Session = Depends(get_db)):
    return get_metrics_for_project(db, project_id)


@router.post("", response_model=MetricOut, status_code=status.HTTP_201_CREATED)
def create_metric_route(
    project_id: int,
    data: MetricCreate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = create_metric(db, project_id, data, user)
    _raise_for_service_error(result)
    return result


@router.put("/{metric_id}", response_model=MetricOut)
def update_metric_route(
    project_id: int,
    metric_id: int,
    data: MetricUpdate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = update_metric(db, metric_id, data, user)
    _raise_for_service_error(result)
    return result


@router.delete("/{metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metric_route(
    project_id: int,
    metric_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = delete_metric(db, metric_id, user)
    _raise_for_service_error(result)


@router.post("/{metric_id}/sub-metrics", response_model=SubMetricOut, status_code=status.HTTP_201_CREATED)
def create_sub_metric_route(
    project_id: int,
    metric_id: int,
    data: SubMetricCreate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = create_sub_metric(db, metric_id, data, user)
    _raise_for_service_error(result)
    return result


@router.put("/{metric_id}/sub-metrics/{sub_metric_id}", response_model=SubMetricOut)
def update_sub_metric_route(
    project_id: int,
    metric_id: int,
    sub_metric_id: int,
    data: SubMetricUpdate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = update_sub_metric(db, sub_metric_id, data, user)
    _raise_for_service_error(result)
    return result


@router.delete("/{metric_id}/sub-metrics/{sub_metric_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sub_metric_route(
    project_id: int,
    metric_id: int,
    sub_metric_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = delete_sub_metric(db, sub_metric_id, user)
    _raise_for_service_error(result)
