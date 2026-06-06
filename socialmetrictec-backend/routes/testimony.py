import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from schemas.testimony import TestimonyCreate, TestimonyOut, TestimonyUpdate, CATEGORIES
from schemas.user import UserOut
from schemas.export_log import ExportLogOut
from services.crud.testimony import (
    create_testimony,
    delete_testimony,
    update_testimony_display_name,
    get_testimonies_for_project,
    get_all_testimonies,
)
from services.crud.export_log import record_export, get_export_logs
from routes.deps import get_current_user_from_token, get_admin_user
from db.database import get_db

router = APIRouter(prefix="/project/{project_id}/testimonies", tags=["testimonies"])


def _raise_for_error(result) -> None:
    if result == "no_encontrado":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Testimonio no encontrado.")
    if result == "acceso_denegado":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para gestionar los testimonios de este proyecto.")


@router.get("", response_model=list[TestimonyOut])
def list_testimonies(project_id: int, db: Session = Depends(get_db)):
    testimonies = get_testimonies_for_project(db, project_id)
    return [_serialize(t) for t in testimonies]


@router.post("", response_model=TestimonyOut, status_code=status.HTTP_201_CREATED)
def create_testimony_route(
    project_id: int,
    data: TestimonyCreate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = create_testimony(db, project_id, data, user)
    _raise_for_error(result)
    return _serialize(result)


@router.patch("/{testimony_id}", response_model=TestimonyOut)
def update_testimony_route(
    project_id: int,
    testimony_id: int,
    data: TestimonyUpdate,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = update_testimony_display_name(db, testimony_id, data.display_name, user)
    _raise_for_error(result)
    return _serialize(result)


@router.delete("/{testimony_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimony_route(
    project_id: int,
    testimony_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = delete_testimony(db, testimony_id, user)
    _raise_for_error(result)


def _serialize(t):
    return TestimonyOut(
        testimony_id=t.testimony_id,
        project_id=t.project_id,
        author_username=t.author_username,
        display_name=t.display_name,
        content=t.content,
        category=t.category,
        tags=[tag.tag_name for tag in t.tags],
        created_at=t.created_at,
    )


# ─── Export (admin-only, on /testimonies/export) ─────────────────────────────

export_router = APIRouter(prefix="/testimonies", tags=["testimonies"])


@export_router.get("/export")
def export_testimonies_csv(
    project_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    admin: UserOut = Depends(get_admin_user),
):
    testimonies = get_all_testimonies(db, project_id, date_from, date_to)

    output = io.StringIO()
    # BOM para que Excel reconozca UTF-8 (acentos correctos en español).
    output.write("﻿")
    writer = csv.writer(output)
    writer.writerow(["id", "autor", "nombre_visible", "proyecto_id", "categoria", "tags", "texto", "fecha"])

    for t in testimonies:
        writer.writerow([
            t.testimony_id,
            t.author_username,
            t.display_name or "",
            t.project_id,
            t.category or "",
            "|".join(tag.tag_name for tag in t.tags),
            t.content,
            t.created_at.isoformat(),
        ])

    record_export(db, admin.username, project_id, date_from, date_to, len(testimonies))

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=testimonios.csv"},
    )


@export_router.get("/export/log", response_model=list[ExportLogOut], dependencies=[Depends(get_admin_user)])
def list_export_log(db: Session = Depends(get_db)):
    return get_export_logs(db)
