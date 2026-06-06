from sqlalchemy.orm import Session
from models.photo import ProjectPhoto
from models.project import Manages
from schemas.user import UserOut as UserOutSchema

MAX_PHOTOS = 10


def _is_authorized(db: Session, project_id: int, user: UserOutSchema) -> bool:
    if user.is_admin:
        return True
    return db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username,
    ).first() is not None


def get_photos_for_project(db: Session, project_id: int) -> list[ProjectPhoto]:
    return db.query(ProjectPhoto).filter(ProjectPhoto.project_id == project_id).order_by(ProjectPhoto.created_at).all()


def add_photo(db: Session, project_id: int, url: str, caption: str | None, user: UserOutSchema) -> ProjectPhoto | str:
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    count = db.query(ProjectPhoto).filter(ProjectPhoto.project_id == project_id).count()
    if count >= MAX_PHOTOS:
        return "limite_alcanzado"

    photo = ProjectPhoto(project_id=project_id, url=url, caption=caption, uploaded_by=user.username)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def delete_photo(db: Session, photo_id: int, user: UserOutSchema) -> str:
    photo = db.query(ProjectPhoto).filter(ProjectPhoto.photo_id == photo_id).first()
    if not photo:
        return "no_encontrado"
    if not _is_authorized(db, photo.project_id, user):
        return "acceso_denegado"

    db.delete(photo)
    db.commit()
    return "exito"
