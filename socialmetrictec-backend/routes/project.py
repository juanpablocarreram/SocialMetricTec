import os
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile
from sqlalchemy.orm import Session
from schemas.project import Project, ProjectFull, ProjectSummary
from schemas.page import Page
from schemas.media import MediaUploadResponse
from schemas.user import UserOut, PublicLeader
from schemas.change_log import ChangeLogOut
from services.crud.project import (
    create_project_in_db,
    delete_project_in_db,
    get_project_from_db,
    list_all_projects,
    list_projects_for_user,
    update_project_page_in_db,
    toggle_project_status,
)
from services.crud.change_log import get_change_log as get_change_log_service
from services.crud.user import get_project_leaders
from services.storage import supabase_storage
from routes.deps import get_current_user_from_token
from db.database import get_db
from models.project import Manages

router = APIRouter(prefix="/project", tags=["project"])


@router.get("/listpreview", response_model=list[ProjectSummary])
def list_projects_preview(db: Session = Depends(get_db)):
    return list_all_projects(db)


@router.get("/mine", response_model=list[ProjectSummary])
def list_my_projects(
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    return list_projects_for_user(db, user)


@router.post("/create", response_model=ProjectFull)
async def create_project(project_info:Project,db = Depends(get_db),user : UserOut = Depends(get_current_user_from_token)):
    created_project = create_project_in_db(db,project_info,user)
    return created_project


@router.get("/{id_project}", response_model=ProjectFull)
def get_all_info_about_project(id_project: int, db = Depends(get_db)):
    project = get_project_from_db(db, id_project)
    if project is None:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return project


@router.get("/{project_id}/leaders", response_model=list[PublicLeader])
def list_project_leaders(project_id: int, db: Session = Depends(get_db)):
    return get_project_leaders(db, project_id)


@router.put("/{project_id}/page", response_model=ProjectFull)
def update_project_page(
    project_id: int,
    page_data: Page,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = update_project_page_in_db(db, project_id, page_data, user)
    if result == "no_encontrado":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado.")
    if result == "acceso_denegado":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para editar este proyecto.")
    return result


@router.post("/{project_id}/media", response_model=MediaUploadResponse)
async def upload_project_media(
    project_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    is_manager = db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username,
    ).first()
    if not user.is_admin and not is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para subir archivos a este proyecto.",
        )

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido: {file.content_type}",
        )

    file_bytes = await file.read()
    is_video = file.content_type.startswith("video/")
    size_limit = 100 * 1024 * 1024 if is_video else 10 * 1024 * 1024

    if len(file_bytes) > size_limit:
        limit_mb = size_limit // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo excede el límite de {limit_mb}MB.",
        )

    _, ext = os.path.splitext(file.filename or "file")
    path = f"projects/{project_id}/{uuid4()}{ext}"
    public_url = supabase_storage.upload_file(path, file_bytes, file.content_type)

    return MediaUploadResponse(url=public_url, path=path, content_type=file.content_type, size_bytes=len(file_bytes))


@router.delete("/{project_id}/delete")
def delete_project(project_id: int, db = Depends(get_db), user:UserOut = Depends(get_current_user_from_token)):
        result = delete_project_in_db(db, project_id, user)
        if result == "no_encontrado":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="El proyecto no existe."
            )
        if result == "acceso_denegado":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="No tienes permiso para eliminar este proyecto."
            )
        return {"message": "Proyecto eliminado exitosamente", "project_id": project_id}


@router.get("/{project_id}/change-log", response_model=list[ChangeLogOut])
def get_project_change_log(
    project_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden ver el registro de cambios.",
        )
    return get_change_log_service(db, project_id)


@router.patch("/{project_id}/status", response_model=ProjectFull)
def toggle_project_status_route(
    project_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = toggle_project_status(db, project_id, user)
    if result == "acceso_denegado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden cambiar el estado del proyecto.",
        )
    if result == "no_encontrado":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado.",
        )
    return result
