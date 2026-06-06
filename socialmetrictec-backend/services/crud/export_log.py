from datetime import date
from sqlalchemy.orm import Session
from models.export_log import ExportLog


def record_export(
    db: Session,
    exported_by: str,
    project_id: int | None,
    date_from: date | None,
    date_to: date | None,
    row_count: int,
) -> ExportLog:
    entry = ExportLog(
        exported_by=exported_by,
        project_id=project_id,
        date_from=date_from.isoformat() if date_from else None,
        date_to=date_to.isoformat() if date_to else None,
        row_count=row_count,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_export_logs(db: Session, limit: int = 50) -> list[ExportLog]:
    return db.query(ExportLog).order_by(ExportLog.created_at.desc()).limit(limit).all()
