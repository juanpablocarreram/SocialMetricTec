import os
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile
from schemas.media import MediaUploadResponse
from schemas.user import UserOut
from services.storage import supabase_storage
from routes.deps import get_current_user_from_token

router = APIRouter(prefix="/media", tags=["media"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"}


""" Subida genérica de archivos, independiente de un proyecto.

El front la usa cuando necesita una URL antes de que el recurso exista
(por ejemplo, la portada de un proyecto que aún no se ha creado):
sube el archivo aquí, recibe la URL y la guarda en el campo correspondiente.
"""
@router.post("", response_model=MediaUploadResponse)
async def upload_media(
    file: UploadFile,
    user: UserOut = Depends(get_current_user_from_token),
):
    if file.content_type not in ALLOWED_TYPES:
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
    path = f"uploads/{user.username}/{uuid4()}{ext}"
    public_url = supabase_storage.upload_file(path, file_bytes, file.content_type)

    return MediaUploadResponse(
        url=public_url,
        path=path,
        content_type=file.content_type,
        size_bytes=len(file_bytes),
    )
