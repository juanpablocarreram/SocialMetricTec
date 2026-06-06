from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from schemas.user import (
    UserCreate as UserCreateSchema,
    UserUpdate as UserUpdateSchema,
    SelfProfileUpdate as SelfProfileUpdateSchema,
)
from models.user import User
from models.project import Manages, Project
from services.auth.security import get_password_hash, verify_password


def create_user_in_db(db: Session, user_info: UserCreateSchema):
    try:
        new_user = User(
            username=user_info.username,
            email=user_info.email,
            password_hash=get_password_hash(user_info.password),
            is_admin=False,
        )
        db.add(new_user)
        db.commit()
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo o nombre de usuario ya están registrados.",
        )
    except Exception as e:
        db.rollback()
        raise e


def get_users_preview(db: Session):
    return db.query(User).all()


def get_user_or_404(db: Session, username: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return user


def update_user_in_db(db: Session, username: str, update_data: UserUpdateSchema) -> User:
    user = get_user_or_404(db, username)
    changes = update_data.model_dump(exclude_none=True)
    if not changes:
        return user
    for field, value in changes.items():
        setattr(user, field, value)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está en uso por otro usuario.",
        )


def update_own_profile(db: Session, user: User, data: SelfProfileUpdateSchema) -> User:
    if data.email is not None:
        user.email = data.email
    if data.profile is not None:
        user.profile = data.profile.model_dump(exclude_none=True)
    try:
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está en uso por otro usuario.",
        )


def change_own_password(db: Session, user: User, current_password: str, new_password: str):
    if not verify_password(current_password, user.password_hash):
        return "password_incorrecto"
    user.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user


def get_project_leaders(db: Session, project_id: int) -> list[User]:
    return (
        db.query(User)
        .join(Manages, Manages.username == User.username)
        .filter(Manages.project_id == project_id)
        .all()
    )


def reset_password_in_db(db: Session, username: str, new_password: str) -> User:
    user = get_user_or_404(db, username)
    user.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return user


def get_user_projects(db: Session, username: str):
    get_user_or_404(db, username)
    return (
        db.query(Project)
        .join(Manages, Manages.project_id == Project.project_id)
        .filter(Manages.username == username)
        .all()
    )


def assign_user_to_project(db: Session, username: str, project_id: int) -> str:
    get_user_or_404(db, username)
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado.")
    already_assigned = db.query(Manages).filter(
        Manages.username == username,
        Manages.project_id == project_id,
    ).first()
    if already_assigned:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario ya gestiona ese proyecto.")
    db.add(Manages(username=username, project_id=project_id))
    db.commit()
    return "asignado"


def remove_user_from_project(db: Session, username: str, project_id: int) -> str:
    assignment = db.query(Manages).filter(
        Manages.username == username,
        Manages.project_id == project_id,
    ).first()
    if not assignment:
        return "no_encontrado"
    db.delete(assignment)
    db.commit()
    return "eliminado"


def delete_user_from_db(db: Session, username: str) -> str:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return "no_encontrado"
    db.delete(user)
    db.commit()
    return "exito"