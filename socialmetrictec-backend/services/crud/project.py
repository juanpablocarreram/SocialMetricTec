from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from models.project import Project, Manages
from schemas.project import Project as ProjectSchema
from schemas.page import Page
from schemas.user import UserOut as UserOutSchema

""" Hace la query a la base de datos que retorna el registro con todo el proyecto """
def get_project_from_db(db: Session, id_project: int):
    return db.query(Project).filter(Project.project_id == id_project).first()

""" Hace la insercion en la base de datos de un proyecto con la informacion """
def create_project_in_db(db: Session,project_info: ProjectSchema,user: UserOutSchema):
    try:
        new_project = Project(
            project_name=project_info.project_name,
            description=project_info.description,
            impact_area=project_info.impact_area,
            cover_image_url=project_info.cover_image_url,
            is_active=True,
            objetivo=project_info.objetivo,
            numero_beneficiarios=project_info.numero_beneficiarios,
        )
        db.add(new_project)
        db.flush() 

        new_manage = Manages(
            username = user.username,
            project_id = new_project.project_id
        )
        db.add(new_manage)
        
        db.commit() # Aquí se hacen permanentes AMBOS
        db.refresh(new_project)
        return new_project
    
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El proyecto con el nombre '{project_info.project_name}' ya existe."
        )
    except Exception as e:
        db.rollback() # Si algo falló arriba, cancela TODO lo pendiente
        raise e # Lanza el error para que FastAPI lo maneje
""" Elimina un proyecto que si existe en la base """
def delete_project_in_db(db: Session, project_id:int, current_user:UserOutSchema):
    db_project = db.query(Project).filter(Project.project_id == project_id).first()
    if not db_project:
        return "no_encontrado"
    if not current_user.is_admin:
        return "acceso_denegado"

    # Proceder con la eliminación
    # Gracias al ON DELETE CASCADE en tu SQL, esto borra:
    # El proyecto + filas en manages + métricas + beneficiarios + tags asociados.
    try:
        db.delete(db_project)
        db.commit()
        return "exito"
    except Exception as e:
        db.rollback()
        raise e
def list_all_projects(db: Session):
    return db.query(
        Project.project_id,
        Project.project_name,
        Project.description,
        Project.impact_area,
        Project.cover_image_url,
        Project.is_active,
        Project.numero_beneficiarios,
        Project.created_at,
    ).all()


def list_projects_for_user(db: Session, user: UserOutSchema):
    if user.is_admin:
        return list_all_projects(db)
    managed_ids = [
        row.project_id
        for row in db.query(Manages.project_id).filter(Manages.username == user.username).all()
    ]
    if not managed_ids:
        return []
    return db.query(
        Project.project_id,
        Project.project_name,
        Project.description,
        Project.impact_area,
        Project.cover_image_url,
        Project.is_active,
        Project.numero_beneficiarios,
        Project.created_at,
    ).filter(Project.project_id.in_(managed_ids)).all()


def update_project_page_in_db(db: Session, project_id: int, page_data: Page, user: UserOutSchema):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return "no_encontrado"

    is_manager = db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username,
    ).first()
    if not user.is_admin and not is_manager:
        return "acceso_denegado"

    project.page = _page_with_edit_log(project.page, page_data.model_dump())
    db.commit()
    db.refresh(project)
    return project


def _page_with_edit_log(previous_page, new_page: dict) -> dict:
    previous = previous_page if isinstance(previous_page, dict) else {}
    previous_log = previous.get("general_props", {}).get("edit_log", [])

    general_props = new_page.get("general_props") or {}
    general_props["edit_log"] = ([*previous_log, datetime.utcnow().isoformat()])[-50:]
    new_page["general_props"] = general_props
    return new_page