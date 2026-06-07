import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from models.testimony import Testimony, TestimonyTag
from schemas.testimony import TestimonyCreate, TestimonyOut, TestimonyUpdate, CsvImportResult, CsvRowError, CATEGORIES
from schemas.user import UserOut
from schemas.export_log import ExportLogOut
from services.crud.testimony import (
    create_testimony,
    delete_testimony,
    update_testimony_display_name,
    get_testimonies_for_project,
    get_all_testimonies,
    is_authorized_for_project,
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


@router.post("/import-csv", response_model=CsvImportResult)
async def import_testimonies_csv_route(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    if not is_authorized_for_project(db, project_id, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para gestionar los testimonios de este proyecto.")

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo debe tener extensión .csv")

    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo debe estar codificado en UTF-8.")

    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo CSV está vacío o no tiene encabezados.")

    fieldnames = [f.strip() for f in reader.fieldnames]
    if "content" not in fieldnames:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La columna 'content' es obligatoria en el encabezado del CSV.")

    valid_rows: list[dict] = []
    row_errors: list[CsvRowError] = []

    for i, row in enumerate(reader, start=2):
        errors: list[str] = []

        content_val = (row.get("content") or "").strip()
        display_name_val = (row.get("display_name") or "").strip() or None
        category_val = (row.get("category") or "").strip() or None
        tags_raw = (row.get("tags") or "").strip()

        if not content_val:
            errors.append("La columna 'content' es obligatoria.")
        elif len(content_val) < 50:
            errors.append(f"'content' debe tener al menos 50 caracteres (tiene {len(content_val)}).")
        elif len(content_val) > 5000:
            errors.append("'content' no puede superar 5,000 caracteres.")

        if category_val and category_val not in CATEGORIES:
            errors.append(f"Categoría '{category_val}' no válida. Opciones: {', '.join(CATEGORIES)}.")

        tags_list: list[str] = []
        if tags_raw:
            raw_tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
            if len(raw_tags) > 10:
                errors.append("Máximo 10 etiquetas por testimonio.")
            else:
                for tag in raw_tags:
                    if len(tag) < 2 or len(tag) > 30:
                        errors.append(f"Etiqueta '{tag}' debe tener entre 2 y 30 caracteres.")
                    else:
                        tags_list.append(tag)

        if errors:
            row_errors.append(CsvRowError(row=i, errors=errors))
        else:
            valid_rows.append({
                "content": content_val,
                "display_name": display_name_val,
                "category": category_val,
                "tags": tags_list,
            })

    created_count = 0
    for row_data in valid_rows:
        testimony = Testimony(
            project_id=project_id,
            author_username=user.username,
            display_name=row_data["display_name"],
            content=row_data["content"],
            category=row_data["category"],
        )
        db.add(testimony)
        db.flush()
        for tag in row_data["tags"]:
            db.add(TestimonyTag(testimony_id=testimony.testimony_id, tag_name=tag))
        created_count += 1

    db.commit()
    return CsvImportResult(created=created_count, errors=row_errors)


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
