from pydantic import BaseModel


class MediaUploadResponse(BaseModel):
    url: str
    path: str
    content_type: str
    size_bytes: int
