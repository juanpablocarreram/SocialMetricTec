import os
import httpx
from fastapi import HTTPException, status


def _get_config() -> tuple[str, str, str]:
    return (
        os.getenv("SUPABASE_URL", ""),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        os.getenv("SUPABASE_BUCKET_NAME", ""),
    )


def upload_file(path: str, file_bytes: bytes, content_type: str) -> str:
    url, key, bucket = _get_config()

    if not all([url, key, bucket]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El servicio de almacenamiento no está configurado.",
        )

    headers = {"Authorization": f"Bearer {key}", "apikey": key, "Content-Type": content_type}
    endpoint = f"{url}/storage/v1/object/{bucket}/{path}"
    response = httpx.post(endpoint, headers=headers, content=file_bytes)

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error al subir el archivo al servicio de almacenamiento.",
        )

    return f"{url}/storage/v1/object/public/{bucket}/{path}"


def delete_file(path: str) -> None:
    url, key, bucket = _get_config()
    if not all([url, key, bucket]):
        return

    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    httpx.delete(f"{url}/storage/v1/object/{bucket}/{path}", headers=headers)
