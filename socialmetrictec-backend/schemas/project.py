import enum
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from schemas.page import Page

class ProjectAreas(str, enum.Enum):
    ods_1  = "ods_1"   # Fin de la pobreza
    ods_2  = "ods_2"   # Hambre cero
    ods_3  = "ods_3"   # Salud y bienestar
    ods_4  = "ods_4"   # Educación de calidad
    ods_5  = "ods_5"   # Igualdad de género
    ods_6  = "ods_6"   # Agua limpia y saneamiento
    ods_7  = "ods_7"   # Energía asequible y no contaminante
    ods_8  = "ods_8"   # Trabajo decente y crecimiento económico
    ods_9  = "ods_9"   # Industria, innovación e infraestructura
    ods_10 = "ods_10"  # Reducción de las desigualdades
    ods_11 = "ods_11"  # Ciudades y comunidades sostenibles
    ods_12 = "ods_12"  # Producción y consumo responsables
    ods_13 = "ods_13"  # Acción por el clima
    ods_14 = "ods_14"  # Vida submarina
    ods_15 = "ods_15"  # Vida de ecosistemas terrestres
    ods_16 = "ods_16"  # Paz, justicia e instituciones sólidas
    ods_17 = "ods_17"  # Alianzas para lograr los objetivos

class Project(BaseModel):
    project_name: str
    description: Optional[str] = None
    impact_area: ProjectAreas
    cover_image_url: str
    is_active: bool = True
    objetivo: Optional[str] = None
    numero_beneficiarios: int
    model_config = ConfigDict(from_attributes=True)

class ProjectSummary(Project):
    project_id: int
    created_at: datetime
    is_featured: bool = False

class ProjectFull(ProjectSummary):
    page: Optional[Page] = None
