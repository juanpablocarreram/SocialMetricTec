from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas.milestone import MilestoneCreate, MilestoneUpdate, MilestoneOut
from schemas.user import UserOut
from services.crud.milestone import (
    create_milestone,
    update_milestone,
    delete_milestone,
    get_milestones_for_project,
)
from routes.deps import get_current_user_from_token
from db.database import get_db

router = APIRouter(prefix="/project/{project_id}/milestones", tags=["milestones"])


def _raise_for_error(result) -> None:
    if result == "no_encontrado":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hito no encontrado.")
    if result == "acceso_denegado":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para gestionar los hitos de este proyecto.")


@router.get("", response_model=list[MilestoneOut])
def list_milestones(project_id: int, db: Session = Depends(get_db)):
    return get_milestones_for_project(db, project_id)


@router.post("", response_model=MilestoneOut, status_code=status.HTTP_201_CREATED)
def create_milestone_route(
    project_id: int,
    data: MilestoneCreate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = create_milestone(db, project_id, data, user)
    _raise_for_error(result)
    return result


@router.patch("/{milestone_id}", response_model=MilestoneOut)
def update_milestone_route(
    project_id: int,
    milestone_id: int,
    data: MilestoneUpdate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = update_milestone(db, project_id, milestone_id, data, user)
    _raise_for_error(result)
    return result


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone_route(
    project_id: int,
    milestone_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = delete_milestone(db, project_id, milestone_id, user)
    _raise_for_error(result)
