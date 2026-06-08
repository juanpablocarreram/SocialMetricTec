from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from models.project import Project, Manages
from schemas.project import Project as ProjectSchema
from schemas.page import Page
from schemas.user import UserOut as UserOutSchema
from services.crud.change_log import log_event


def get_project_from_db(db: Session, id_project: int):
    return db.query(Project).filter(Project.project_id == id_project).first()


def create_project_in_db(db: Session, project_info: ProjectSchema, user: UserOutSchema):
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
            username=user.username,
            project_id=new_project.project_id
        )
        db.add(new_manage)

        db.commit()
        db.refresh(new_project)
        return new_project

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El proyecto con el nombre '{project_info.project_name}' ya existe."
        )
    except Exception as e:
        db.rollback()
        raise e


def delete_project_in_db(db: Session, project_id: int, current_user: UserOutSchema):
    db_project = db.query(Project).filter(Project.project_id == project_id).first()
    if not db_project:
        return "no_encontrado"
    if not current_user.is_admin:
        return "acceso_denegado"

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

    new_page = page_data.model_dump()
    old_page_dict = project.page if isinstance(project.page, dict) else {}
    old_blocks = old_page_dict.get("blocks", [])
    new_blocks = new_page.get("blocks", [])

    for block_event, block_type in _diff_blocks(old_blocks, new_blocks):
        log_event(db, project_id, block_event, entity_name=block_type)

    palette_entity = _diff_styles(old_page_dict, new_page)
    if palette_entity is not None:
        log_event(db, project_id, "palette_updated", palette_entity)

    project.page = _page_with_edit_log(project.page, new_page)
    log_event(db, project_id, "page_edited")
    db.commit()
    db.refresh(project)
    return project


def toggle_project_status(db: Session, project_id: int, user: UserOutSchema):
    if not user.is_admin:
        return "acceso_denegado"

    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return "no_encontrado"

    project.is_active = not project.is_active
    event_type = "project_activated" if project.is_active else "project_deactivated"
    log_event(db, project_id, event_type)
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


_STYLE_LABELS = {
    'primaryColor': 'color primario',
    'secondaryColor': 'color secundario',
    'fontFamily': 'tipografía',
}


def _diff_styles(old_page: dict, new_page: dict) -> str | None:
    old_styles = old_page.get("general_props", {}).get("styles", {})
    new_styles = new_page.get("general_props", {}).get("styles", {})
    all_keys = set(old_styles) | set(new_styles)
    changed = [_STYLE_LABELS.get(k, k) for k in all_keys if old_styles.get(k) != new_styles.get(k)]
    if not changed:
        return None
    return ", ".join(changed)


def _diff_blocks(old_blocks: list, new_blocks: list) -> list[tuple[str, str]]:
    events: list[tuple[str, str]] = []

    old_by_id = {b['id']: b for b in old_blocks if b.get('id')}
    new_by_id = {b['id']: b for b in new_blocks if b.get('id')}
    old_no_id = [b for b in old_blocks if not b.get('id')]
    new_no_id = [b for b in new_blocks if not b.get('id')]

    old_ids = set(old_by_id)
    new_ids = set(new_by_id)

    for bid in new_ids - old_ids:
        events.append(('page_block_added', new_by_id[bid].get('type', 'bloque').capitalize()))
    for bid in old_ids - new_ids:
        events.append(('page_block_removed', old_by_id[bid].get('type', 'bloque').capitalize()))
    for bid in old_ids & new_ids:
        if old_by_id[bid] != new_by_id[bid]:
            events.append(('page_block_modified', new_by_id[bid].get('type', 'bloque').capitalize()))

    for i in range(max(len(old_no_id), len(new_no_id), 0)):
        if i >= len(old_no_id):
            events.append(('page_block_added', new_no_id[i].get('type', 'bloque').capitalize()))
        elif i >= len(new_no_id):
            events.append(('page_block_removed', old_no_id[i].get('type', 'bloque').capitalize()))
        elif old_no_id[i] != new_no_id[i]:
            events.append(('page_block_modified', new_no_id[i].get('type', 'bloque').capitalize()))

    return events
