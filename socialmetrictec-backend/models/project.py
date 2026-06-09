import enum
from sqlalchemy.orm import Mapped,mapped_column
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from db.database import Base #
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


class Project(Base):
    __tablename__ = "project"
    project_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_name = Column(String(255), nullable=False, unique = True)
    description = Column(Text, nullable=True)
    impact_area = Column(String(255), nullable=True) 
    cover_image_url = Column(String(2048), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    page = Column(JSON, nullable=True)
    objetivo = Column(Text, nullable=True)
    numero_beneficiarios = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

class Manages(Base):
    __tablename__ = "manages"
    username: Mapped[str] = mapped_column(
        String(100), 
        ForeignKey("user.username", ondelete="CASCADE", onupdate="CASCADE"), 
        primary_key=True
    )
    
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.project_id", ondelete="CASCADE", onupdate="CASCADE"), 
        primary_key=True
    )
