from datetime import date, datetime, time
from sqlalchemy.orm import Session
from models.testimony import Testimony, TestimonyTag
from models.project import Manages
from schemas.testimony import TestimonyCreate
from schemas.user import UserOut as UserOutSchema


def _is_authorized(db: Session, project_id: int, user: UserOutSchema) -> bool:
    if user.is_admin:
        return True
    return db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username,
    ).first() is not None


def get_testimonies_for_project(db: Session, project_id: int) -> list[Testimony]:
    return db.query(Testimony).filter(Testimony.project_id == project_id).order_by(Testimony.created_at.desc()).all()


def get_all_testimonies(
    db: Session,
    project_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[Testimony]:
    query = db.query(Testimony)
    if project_id is not None:
        query = query.filter(Testimony.project_id == project_id)
    if date_from is not None:
        query = query.filter(Testimony.created_at >= datetime.combine(date_from, time.min))
    if date_to is not None:
        query = query.filter(Testimony.created_at <= datetime.combine(date_to, time.max))
    return query.order_by(Testimony.created_at.desc()).all()


def create_testimony(db: Session, project_id: int, data: TestimonyCreate, user: UserOutSchema) -> Testimony | str:
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    testimony = Testimony(
        project_id=project_id,
        author_username=user.username,
        display_name=data.display_name or None,
        content=data.content,
        category=data.category,
    )
    db.add(testimony)
    db.flush()

    for tag in data.tags:
        db.add(TestimonyTag(testimony_id=testimony.testimony_id, tag_name=tag))

    db.commit()
    db.refresh(testimony)
    return testimony


def update_testimony_display_name(db: Session, testimony_id: int, display_name: str | None, user: UserOutSchema) -> Testimony | str:
    testimony = db.query(Testimony).filter(Testimony.testimony_id == testimony_id).first()
    if not testimony:
        return "no_encontrado"
    if not user.is_admin and testimony.author_username != user.username:
        return "acceso_denegado"
    testimony.display_name = display_name or None
    db.commit()
    db.refresh(testimony)
    return testimony


def delete_testimony(db: Session, testimony_id: int, user: UserOutSchema) -> str:
    testimony = db.query(Testimony).filter(Testimony.testimony_id == testimony_id).first()
    if not testimony:
        return "no_encontrado"
    if not user.is_admin and testimony.author_username != user.username:
        return "acceso_denegado"

    db.delete(testimony)
    db.commit()
    return "exito"
