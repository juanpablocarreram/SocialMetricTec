from datetime import datetime
from sqlalchemy.orm import Session
from models.milestone import Milestone
from models.project import Manages
from schemas.milestone import MilestoneCreate, MilestoneUpdate
from schemas.user import UserOut as UserOutSchema
from services.crud.change_log import log_event


def _is_authorized(db: Session, project_id: int, user: UserOutSchema) -> bool:
    if user.is_admin:
        return True
    return db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username,
    ).first() is not None


def get_milestones_for_project(db: Session, project_id: int) -> list[Milestone]:
    return (
        db.query(Milestone)
        .filter(Milestone.project_id == project_id)
        .order_by(Milestone.created_at.asc())
        .all()
    )


def create_milestone(db: Session, project_id: int, data: MilestoneCreate, user: UserOutSchema):
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    milestone = Milestone(
        project_id=project_id,
        title=data.title,
        description=data.description,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


def update_milestone(db: Session, project_id: int, milestone_id: int, data: MilestoneUpdate, user: UserOutSchema):
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    milestone = db.query(Milestone).filter(
        Milestone.milestone_id == milestone_id,
        Milestone.project_id == project_id,
    ).first()
    if not milestone:
        return "no_encontrado"

    editing_text = data.title is not None or data.description is not None

    if data.title is not None:
        milestone.title = data.title
    if data.description is not None:
        milestone.description = data.description
    if data.is_completed is not None:
        milestone.is_completed = data.is_completed
        milestone.completed_at = datetime.utcnow() if data.is_completed else None

    if editing_text:
        log_event(db, project_id, "milestone_updated", milestone.title)

    db.commit()
    db.refresh(milestone)
    return milestone


def delete_milestone(db: Session, project_id: int, milestone_id: int, user: UserOutSchema) -> str:
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    milestone = db.query(Milestone).filter(
        Milestone.milestone_id == milestone_id,
        Milestone.project_id == project_id,
    ).first()
    if not milestone:
        return "no_encontrado"

    db.delete(milestone)
    db.commit()
    return "exito"
