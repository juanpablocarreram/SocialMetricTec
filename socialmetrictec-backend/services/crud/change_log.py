from sqlalchemy.orm import Session
from models.change_log import ProjectChangeLog


def log_event(db: Session, project_id: int, event_type: str, entity_name: str = None) -> None:
    entry = ProjectChangeLog(
        project_id=project_id,
        event_type=event_type,
        entity_name=entity_name,
    )
    db.add(entry)
    # No commit here — caller handles the transaction


def get_change_log(db: Session, project_id: int) -> list[ProjectChangeLog]:
    return (
        db.query(ProjectChangeLog)
        .filter(ProjectChangeLog.project_id == project_id)
        .order_by(ProjectChangeLog.occurred_at.desc())
        .all()
    )
