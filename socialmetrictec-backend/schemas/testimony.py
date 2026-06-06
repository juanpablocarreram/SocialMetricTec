from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime

CATEGORIES = [
    "Logros y resultados",
    "Retos y obstáculos",
    "Aprendizajes",
    "Impacto comunitario",
    "Gestión del proyecto",
    "Colaboración",
    "Otro",
]


class TestimonyCreate(BaseModel):
    content: str
    category: Optional[str] = None
    tags: list[str] = []
    display_name: Optional[str] = None

    @field_validator("content")
    @classmethod
    def validate_length(cls, v: str) -> str:
        if len(v.strip()) < 50:
            raise ValueError("El testimonio debe tener al menos 50 caracteres.")
        if len(v.strip()) > 5000:
            raise ValueError("El testimonio no puede superar los 5,000 caracteres.")
        return v.strip()

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        if len(v) > 10:
            raise ValueError("No puedes añadir más de 10 etiquetas.")
        cleaned = []
        for tag in v:
            tag = tag.strip()
            if len(tag) < 2 or len(tag) > 30:
                raise ValueError("Cada etiqueta debe tener entre 2 y 30 caracteres.")
            cleaned.append(tag)
        return cleaned


class TestimonyUpdate(BaseModel):
    display_name: Optional[str] = None


class TestimonyOut(BaseModel):
    testimony_id: int
    project_id: int
    author_username: str
    display_name: Optional[str] = None
    content: str
    category: Optional[str]
    tags: list[str] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
