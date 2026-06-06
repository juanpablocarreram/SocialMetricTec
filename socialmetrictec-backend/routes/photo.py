from fastapi import APIRouter, Depends, HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from uuid import uuid4
import os
from schemas.photo import PhotoOut
from schemas.user import UserOut
from services.crud.photo import add_photo, delete_photo, get_photos_for_project
from services.storage import supabase_storage
from routes.deps import get_current_user_from_token
from db.database import get_db

router = APIRouter(prefix="/project/{project_id}/photos", tags=["photos"])

ALLOWED_TYPES = {"image/jpeg", "image/png"}
MAX_SIZE_BYTES = 5 * 1024 * 1024


def _raise_for_error(result) -> None:
    if result == "no_encontrado":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto no encontrada.")
    if result == "acceso_denegado":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para gestionar las fotos de este proyecto.")
    if result == "limite_alcanzado":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este proyecto ya tiene el máximo de 10 fotos.")


@router.get("", response_model=list[PhotoOut])
def list_photos(project_id: int, db: Session = Depends(get_db)):
    return get_photos_for_project(db, project_id)


@router.post("", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    project_id: int,
    file: UploadFile,
    caption: str = "",
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se permiten imágenes JPG o PNG.")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="La imagen no puede superar 5 MB.")

    _, ext = os.path.splitext(file.filename or "photo.jpg")
    path = f"projects/{project_id}/photos/{uuid4()}{ext}"
    url = supabase_storage.upload_file(path, file_bytes, file.content_type)

    result = add_photo(db, project_id, url, caption or None, user)
    _raise_for_error(result)
    return result


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo_route(
    project_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = delete_photo(db, photo_id, user)
    _raise_for_error(result)
