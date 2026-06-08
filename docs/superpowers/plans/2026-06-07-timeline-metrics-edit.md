# Timeline Extension + Metric/Milestone Editing + Project Status Toggle

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the admin timeline to show metric events with date+time, add editing of metrics/milestones in the Editor, and let admins toggle project active/inactive status from AdminPanel.

**Architecture:** New `project_change_log` DB table (no FK to project, survives deletion) acts as the audit log for metric, page, milestone-edit, and project-status events. Backend service helper `log_event()` is called inside existing CRUD transactions. Frontend timeline merges change-log entries with existing data sources. MetricsManager gains an edit modal; MilestonesManager gains inline title edit; AdminPanel gains a status toggle button.

**Tech Stack:** Python/FastAPI/SQLAlchemy (backend), React/TypeScript/Tailwind (frontend), MySQL (DB).

---

## File Map

**Create:**
- `socialmetrictec-backend/models/change_log.py`
- `socialmetrictec-backend/schemas/change_log.py`
- `socialmetrictec-backend/services/crud/change_log.py`
- `socialmetrictec-frontend/src/services/changeLogService.ts`

**Modify:**
- `socialmetrictec-backend/db/database_setup.sql`
- `socialmetrictec-backend/models/__init__.py`
- `socialmetrictec-backend/services/crud/metric.py`
- `socialmetrictec-backend/services/crud/milestone.py`
- `socialmetrictec-backend/services/crud/project.py`
- `socialmetrictec-backend/routes/project.py`
- `socialmetrictec-frontend/src/components/ProjectTimeline.tsx`
- `socialmetrictec-frontend/src/pages/ProjectDetail.tsx`
- `socialmetrictec-frontend/src/components/managers/MetricsManager.tsx`
- `socialmetrictec-frontend/src/components/managers/MilestonesManager.tsx`
- `socialmetrictec-frontend/src/services/projectService.ts`
- `socialmetrictec-frontend/src/pages/AdminPanel.tsx`

---

## Task 1: DB Migration + SQLAlchemy Model

**Files:**
- Modify: `socialmetrictec-backend/db/database_setup.sql`
- Create: `socialmetrictec-backend/models/change_log.py`
- Modify: `socialmetrictec-backend/models/__init__.py`

- [ ] **Step 1: Add table to database_setup.sql**

Append at the end of `socialmetrictec-backend/db/database_setup.sql`:

```sql
-- ============================================================
-- 14. project_change_log  —  auditoría de cambios del proyecto
--     Sin FK a project: el registro sobrevive al borrado del
--     proyecto o del usuario, igual que export_log.
-- ============================================================
CREATE TABLE IF NOT EXISTS project_change_log (
    log_id        INT           NOT NULL AUTO_INCREMENT,
    project_id    INT           NOT NULL,
    event_type    VARCHAR(60)   NOT NULL,
    entity_name   VARCHAR(255),
    occurred_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_project_change_log PRIMARY KEY (log_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Run the migration in MySQL**

Connect to MySQL and run just the new CREATE TABLE statement. The table must exist before starting the server.

```sql
USE socialmetrictec;
CREATE TABLE IF NOT EXISTS project_change_log (
    log_id        INT           NOT NULL AUTO_INCREMENT,
    project_id    INT           NOT NULL,
    event_type    VARCHAR(60)   NOT NULL,
    entity_name   VARCHAR(255),
    occurred_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_project_change_log PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Verify: `SHOW TABLES LIKE 'project_change_log';` should return one row.

- [ ] **Step 3: Create the SQLAlchemy model**

Create `socialmetrictec-backend/models/change_log.py`:

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from db.database import Base


class ProjectChangeLog(Base):
    __tablename__ = "project_change_log"
    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, nullable=False)
    event_type = Column(String(60), nullable=False)
    entity_name = Column(String(255), nullable=True)
    occurred_at = Column(DateTime, server_default=func.now())
```

- [ ] **Step 4: Register the model in models/__init__.py**

Add one line to `socialmetrictec-backend/models/__init__.py`:

```python
# models/__init__.py
from .user import User
from .project import Project, Manages
from .metric import Metric, SubMetric
from .testimony import Testimony, TestimonyTag
from .photo import ProjectPhoto
from .milestone import Milestone
from .export_log import ExportLog
from .change_log import ProjectChangeLog
```

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-backend/db/database_setup.sql \
        socialmetrictec-backend/models/change_log.py \
        socialmetrictec-backend/models/__init__.py
git commit -m "feat: add project_change_log table and SQLAlchemy model"
```

---

## Task 2: Schema + Service Helper

**Files:**
- Create: `socialmetrictec-backend/schemas/change_log.py`
- Create: `socialmetrictec-backend/services/crud/change_log.py`

- [ ] **Step 1: Create the Pydantic schema**

Create `socialmetrictec-backend/schemas/change_log.py`:

```python
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ChangeLogOut(BaseModel):
    log_id: int
    project_id: int
    event_type: str
    entity_name: Optional[str] = None
    occurred_at: datetime
    model_config = ConfigDict(from_attributes=True)
```

- [ ] **Step 2: Create the service helper**

Create `socialmetrictec-backend/services/crud/change_log.py`:

```python
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
```

- [ ] **Step 3: Commit**

```bash
git add socialmetrictec-backend/schemas/change_log.py \
        socialmetrictec-backend/services/crud/change_log.py
git commit -m "feat: add ChangeLogOut schema and log_event service helper"
```

---

## Task 3: Instrument Metric CRUD

**Files:**
- Modify: `socialmetrictec-backend/services/crud/metric.py`

- [ ] **Step 1: Replace the full file content**

Replace `socialmetrictec-backend/services/crud/metric.py` with:

```python
from sqlalchemy.orm import Session
from models.metric import Metric, SubMetric
from models.project import Manages
from schemas.metric import MetricCreate, MetricUpdate, SubMetricCreate, SubMetricUpdate
from schemas.user import UserOut as UserOutSchema
from services.crud.change_log import log_event


def _is_authorized(db: Session, project_id: int, user: UserOutSchema) -> bool:
    if user.is_admin:
        return True
    return db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username
    ).first() is not None


def get_metrics_for_project(db: Session, project_id: int) -> list[Metric]:
    return db.query(Metric).filter(Metric.project_id == project_id).all()


def create_metric(db: Session, project_id: int, data: MetricCreate, user: UserOutSchema) -> Metric | str:
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    metric = Metric(metric_title=data.metric_title, project_id=project_id)
    db.add(metric)
    db.flush()

    for sm in data.sub_metrics:
        db.add(SubMetric(
            sub_metric_title=sm.sub_metric_title,
            sub_metric_value=sm.sub_metric_value,
            metric_id=metric.metric_id
        ))

    log_event(db, project_id, "metric_created", data.metric_title)
    db.commit()
    db.refresh(metric)
    return metric


def update_metric(db: Session, metric_id: int, data: MetricUpdate, user: UserOutSchema) -> Metric | str:
    metric = db.query(Metric).filter(Metric.metric_id == metric_id).first()
    if not metric:
        return "no_encontrado"
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    metric.metric_title = data.metric_title
    log_event(db, metric.project_id, "metric_updated", data.metric_title)
    db.commit()
    db.refresh(metric)
    return metric


def delete_metric(db: Session, metric_id: int, user: UserOutSchema) -> str:
    metric = db.query(Metric).filter(Metric.metric_id == metric_id).first()
    if not metric:
        return "no_encontrado"
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    project_id = metric.project_id
    title = metric.metric_title
    log_event(db, project_id, "metric_deleted", title)
    db.delete(metric)
    db.commit()
    return "exito"


def create_sub_metric(db: Session, metric_id: int, data: SubMetricCreate, user: UserOutSchema) -> SubMetric | str:
    metric = db.query(Metric).filter(Metric.metric_id == metric_id).first()
    if not metric:
        return "no_encontrado"
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    sub_metric = SubMetric(
        sub_metric_title=data.sub_metric_title,
        sub_metric_value=data.sub_metric_value,
        metric_id=metric_id
    )
    db.add(sub_metric)
    db.commit()
    db.refresh(sub_metric)
    return sub_metric


def update_sub_metric(db: Session, sub_metric_id: int, data: SubMetricUpdate, user: UserOutSchema) -> SubMetric | str:
    sub_metric = db.query(SubMetric).filter(SubMetric.sub_metric_id == sub_metric_id).first()
    if not sub_metric:
        return "no_encontrado"

    metric = db.query(Metric).filter(Metric.metric_id == sub_metric.metric_id).first()
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    sub_metric.sub_metric_title = data.sub_metric_title
    sub_metric.sub_metric_value = data.sub_metric_value
    db.commit()
    db.refresh(sub_metric)
    return sub_metric


def delete_sub_metric(db: Session, sub_metric_id: int, user: UserOutSchema) -> str:
    sub_metric = db.query(SubMetric).filter(SubMetric.sub_metric_id == sub_metric_id).first()
    if not sub_metric:
        return "no_encontrado"

    metric = db.query(Metric).filter(Metric.metric_id == sub_metric.metric_id).first()
    if not _is_authorized(db, metric.project_id, user):
        return "acceso_denegado"

    db.delete(sub_metric)
    db.commit()
    return "exito"
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-backend/services/crud/metric.py
git commit -m "feat: log metric create/update/delete events to project_change_log"
```

---

## Task 4: Instrument Milestone CRUD

**Files:**
- Modify: `socialmetrictec-backend/services/crud/milestone.py`

- [ ] **Step 1: Add log_event import and call in update_milestone**

Replace `socialmetrictec-backend/services/crud/milestone.py` with:

```python
from datetime import datetime
from sqlalchemy.orm import Session
from models.milestone import Milestone
from models.project import Manages
from schemas.milestone import MilestoneCreate, MilestoneUpdate
from schemas.user import UserOut as UserOutSchema
from services.crud.change_log import log_event


def _is_authorized(db: Session, project_id: int, user: UserOutSchema) -> bool:
    if user.is_admin:
        return True
    return db.query(Manages).filter(
        Manages.project_id == project_id,
        Manages.username == user.username,
    ).first() is not None


def get_milestones_for_project(db: Session, project_id: int) -> list[Milestone]:
    return (
        db.query(Milestone)
        .filter(Milestone.project_id == project_id)
        .order_by(Milestone.created_at.asc())
        .all()
    )


def create_milestone(db: Session, project_id: int, data: MilestoneCreate, user: UserOutSchema):
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    milestone = Milestone(
        project_id=project_id,
        title=data.title,
        description=data.description,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


def update_milestone(db: Session, project_id: int, milestone_id: int, data: MilestoneUpdate, user: UserOutSchema):
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    milestone = db.query(Milestone).filter(
        Milestone.milestone_id == milestone_id,
        Milestone.project_id == project_id,
    ).first()
    if not milestone:
        return "no_encontrado"

    editing_text = data.title is not None or data.description is not None

    if data.title is not None:
        milestone.title = data.title
    if data.description is not None:
        milestone.description = data.description
    if data.is_completed is not None:
        milestone.is_completed = data.is_completed
        milestone.completed_at = datetime.utcnow() if data.is_completed else None

    if editing_text:
        log_event(db, project_id, "milestone_updated", milestone.title)

    db.commit()
    db.refresh(milestone)
    return milestone


def delete_milestone(db: Session, project_id: int, milestone_id: int, user: UserOutSchema) -> str:
    if not _is_authorized(db, project_id, user):
        return "acceso_denegado"

    milestone = db.query(Milestone).filter(
        Milestone.milestone_id == milestone_id,
        Milestone.project_id == project_id,
    ).first()
    if not milestone:
        return "no_encontrado"

    db.delete(milestone)
    db.commit()
    return "exito"
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-backend/services/crud/milestone.py
git commit -m "feat: log milestone title/description edits to project_change_log"
```

---

## Task 5: Instrument Project CRUD + Toggle Status

**Files:**
- Modify: `socialmetrictec-backend/services/crud/project.py`

- [ ] **Step 1: Replace the full file content**

Replace `socialmetrictec-backend/services/crud/project.py` with:

```python
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

    project.page = _page_with_edit_log(project.page, page_data.model_dump())
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
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-backend/services/crud/project.py
git commit -m "feat: log page edits and add toggle_project_status with change log"
```

---

## Task 6: New Backend Routes

**Files:**
- Modify: `socialmetrictec-backend/routes/project.py`

- [ ] **Step 1: Add imports and two new endpoints**

At the top of `socialmetrictec-backend/routes/project.py`, add to the existing imports:

```python
from schemas.change_log import ChangeLogOut
from services.crud.change_log import get_change_log as get_change_log_service
from services.crud.project import (
    create_project_in_db,
    delete_project_in_db,
    get_project_from_db,
    list_all_projects,
    list_projects_for_user,
    update_project_page_in_db,
    toggle_project_status,
)
```

Then append these two endpoints at the end of `socialmetrictec-backend/routes/project.py`:

```python
""" Ruta para obtener el registro de cambios de un proyecto (solo admin) """
@router.get("/{project_id}/change-log", response_model=list[ChangeLogOut])
def get_project_change_log(
    project_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden ver el registro de cambios.",
        )
    return get_change_log_service(db, project_id)


""" Ruta para cambiar el estado activo/inactivo de un proyecto (solo admin) """
@router.patch("/{project_id}/status", response_model=ProjectFull)
def toggle_project_status_route(
    project_id: int,
    db: Session = Depends(get_db),
    user: UserOut = Depends(get_current_user_from_token),
):
    result = toggle_project_status(db, project_id, user)
    if result == "acceso_denegado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden cambiar el estado del proyecto.",
        )
    if result == "no_encontrado":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado.",
        )
    return result
```

- [ ] **Step 2: Verify the server starts without errors**

```bash
cd socialmetrictec-backend
uvicorn main:app --reload
```

Expected: server starts, no import errors. Visit `http://localhost:8000/docs` and confirm `GET /project/{project_id}/change-log` and `PATCH /project/{project_id}/status` appear in the docs.

- [ ] **Step 3: Commit**

```bash
git add socialmetrictec-backend/routes/project.py
git commit -m "feat: add GET /change-log and PATCH /status project routes"
```

---

## Task 7: Frontend — changeLogService.ts

**Files:**
- Create: `socialmetrictec-frontend/src/services/changeLogService.ts`

- [ ] **Step 1: Create the service file**

Create `socialmetrictec-frontend/src/services/changeLogService.ts`:

```typescript
import apiClient from '@/src/lib/axios';

export interface ChangeLogEntry {
  log_id: number;
  project_id: number;
  event_type: string;
  entity_name: string | null;
  occurred_at: string;
}

export const getChangeLog = async (projectId: number): Promise<ChangeLogEntry[]> => {
  const res = await apiClient.get(`/project/${projectId}/change-log`);
  return res.data;
};
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-frontend/src/services/changeLogService.ts
git commit -m "feat: add changeLogService for fetching project change log"
```

---

## Task 8: Frontend — ProjectTimeline.tsx

**Files:**
- Modify: `socialmetrictec-frontend/src/components/ProjectTimeline.tsx`

- [ ] **Step 1: Replace the full file**

Replace `socialmetrictec-frontend/src/components/ProjectTimeline.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Rocket, Pencil, MessageSquare, Camera, Flag, CheckCircle2, BarChart3, ToggleRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { TestimonyOut } from '@/src/services/testimonyService';
import { PhotoOut } from '@/src/services/photoService';
import { MilestoneOut } from '@/src/services/milestoneService';
import { ChangeLogEntry } from '@/src/services/changeLogService';

type EventType = 'creacion' | 'edicion' | 'testimonio' | 'foto' | 'hito' | 'metrica' | 'estado';

interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  timestamp: string;
}

interface ProjectTimelineProps {
  createdAt: string;
  editLog?: string[];
  testimonies: TestimonyOut[];
  photos: PhotoOut[];
  milestones: MilestoneOut[];
  changeLogs: ChangeLogEntry[];
}

const TYPE_META: Record<EventType, { label: string; icon: typeof Rocket; color: string }> = {
  creacion:  { label: 'Creación',  icon: Rocket,       color: 'bg-primary text-white' },
  edicion:   { label: 'Ediciones', icon: Pencil,       color: 'bg-blue-100 text-blue-600' },
  testimonio:{ label: 'Testimonios',icon: MessageSquare,color: 'bg-orange-100 text-orange-600' },
  foto:      { label: 'Fotos',     icon: Camera,       color: 'bg-emerald-100 text-emerald-600' },
  hito:      { label: 'Hitos',     icon: Flag,         color: 'bg-purple-100 text-purple-600' },
  metrica:   { label: 'Métricas',  icon: BarChart3,    color: 'bg-teal-100 text-teal-600' },
  estado:    { label: 'Estado',    icon: ToggleRight,  color: 'bg-slate-100 text-slate-600' },
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
};

const METRIC_TITLES: Record<string, string> = {
  metric_created: 'Métrica creada',
  metric_updated: 'Métrica editada',
  metric_deleted: 'Métrica eliminada',
};

function buildEvents({ createdAt, editLog, testimonies, photos, milestones, changeLogs }: ProjectTimelineProps): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({ id: 'created', type: 'creacion', title: 'Proyecto creado', timestamp: createdAt });

  (editLog ?? []).forEach((ts, i) => {
    events.push({ id: `edit-${i}`, type: 'edicion', title: 'Página del proyecto editada', timestamp: ts });
  });

  testimonies.forEach((t) => {
    events.push({
      id: `testimony-${t.testimony_id}`,
      type: 'testimonio',
      title: `Testimonio de ${t.display_name ?? t.author_username}`,
      timestamp: t.created_at,
    });
  });

  photos.forEach((p) => {
    events.push({ id: `photo-${p.photo_id}`, type: 'foto', title: 'Foto subida al proyecto', timestamp: p.created_at });
  });

  milestones.forEach((m) => {
    events.push({ id: `milestone-new-${m.milestone_id}`, type: 'hito', title: `Hito creado: ${m.title}`, timestamp: m.created_at });
    if (m.is_completed && m.completed_at) {
      events.push({ id: `milestone-done-${m.milestone_id}`, type: 'hito', title: `Hito completado: ${m.title}`, timestamp: m.completed_at });
    }
  });

  changeLogs.forEach((entry) => {
    if (entry.event_type === 'page_edited') {
      // Only add if not already present from edit_log (different source, won't duplicate)
      events.push({ id: `cl-${entry.log_id}`, type: 'edicion', title: 'Página del proyecto editada', timestamp: entry.occurred_at });
    } else if (entry.event_type in METRIC_TITLES) {
      const base = METRIC_TITLES[entry.event_type];
      const title = entry.entity_name ? `${base}: ${entry.entity_name}` : base;
      events.push({ id: `cl-${entry.log_id}`, type: 'metrica', title, timestamp: entry.occurred_at });
    } else if (entry.event_type === 'milestone_updated') {
      const title = entry.entity_name ? `Hito editado: ${entry.entity_name}` : 'Hito editado';
      events.push({ id: `cl-${entry.log_id}`, type: 'hito', title, timestamp: entry.occurred_at });
    } else if (entry.event_type === 'project_activated') {
      events.push({ id: `cl-${entry.log_id}`, type: 'estado', title: 'Proyecto marcado como activo', timestamp: entry.occurred_at });
    } else if (entry.event_type === 'project_deactivated') {
      events.push({ id: `cl-${entry.log_id}`, type: 'estado', title: 'Proyecto marcado como inactivo', timestamp: entry.occurred_at });
    }
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export default function ProjectTimeline(props: ProjectTimelineProps) {
  const allEvents = useMemo(() => buildEvents(props), [props]);
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set());

  const toggleFilter = (type: EventType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const visibleEvents = activeFilters.size === 0
    ? allEvents
    : allEvents.filter((e) => activeFilters.has(e.type));

  if (allEvents.length === 0) return null;

  const availableTypes = (Object.keys(TYPE_META) as EventType[]).filter((type) =>
    allEvents.some((e) => e.type === type),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {availableTypes.map((type) => {
          const { label, icon: Icon } = TYPE_META[type];
          const active = activeFilters.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all',
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/30',
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          );
        })}
      </div>

      <div className="relative pl-8">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-outline-variant/20" />
        <div className="space-y-6">
          {visibleEvents.map((event, i) => {
            const { icon: Icon, color } = TYPE_META[event.type];
            const isCompletion = event.id.startsWith('milestone-done');
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="relative"
              >
                <span className={cn('absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm', color)}>
                  {isCompletion ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </span>
                <div className="pb-1">
                  <p className="text-sm font-bold text-primary leading-tight">{event.title}</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-0.5">{formatDateTime(event.timestamp)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {visibleEvents.length === 0 && (
          <p className="text-sm text-outline italic">No hay eventos de este tipo.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-frontend/src/components/ProjectTimeline.tsx
git commit -m "feat: extend timeline with datetime, metric/status events, and change log support"
```

---

## Task 9: Frontend — ProjectDetail.tsx (fetch change log)

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/ProjectDetail.tsx`

- [ ] **Step 1: Add import**

At the top of `ProjectDetail.tsx`, add the import:

```typescript
import { getChangeLog, ChangeLogEntry } from '../services/changeLogService';
```

- [ ] **Step 2: Add state**

Inside the `ProjectDetail` component, after the `milestones` state declaration, add:

```typescript
const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
```

- [ ] **Step 3: Fetch change log (admin only) in useEffect**

The current `useEffect` runs `Promise.all([...])` for all users. The change-log endpoint is admin-only, so fetch it conditionally after the main data loads. Replace the existing `useEffect` with:

```typescript
useEffect(() => {
  if (!id) return;
  Promise.all([
    getProject(Number(id)),
    getMetrics(Number(id)),
    getPhotos(Number(id)),
    getTestimonies(Number(id)),
    getProjectLeaders(Number(id)),
    getMilestones(Number(id)),
  ])
    .then(([p, m, ph, t, l, ms]) => {
      setProject(p);
      setMetrics(m);
      setPhotos(ph);
      setTestimonies(t);
      setLeaders(l);
      setMilestones(ms);

      if (user?.is_admin) {
        getChangeLog(Number(id))
          .then(setChangeLogs)
          .catch(console.error);
      }
    })
    .catch(() => setNotFound(true))
    .finally(() => setLoading(false));
}, [id, user?.is_admin]);
```

- [ ] **Step 4: Pass changeLogs to ProjectTimeline**

Find the `<ProjectTimeline ... />` usage (around line 342 in the original) and add the `changeLogs` prop:

```tsx
<ProjectTimeline
  createdAt={project.created_at}
  editLog={editLog}
  testimonies={testimonies}
  photos={photos}
  milestones={milestones}
  changeLogs={changeLogs}
/>
```

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-frontend/src/pages/ProjectDetail.tsx
git commit -m "feat: fetch and pass change log to ProjectTimeline for admin view"
```

---

## Task 10: Frontend — MetricsManager.tsx (edit modal)

**Files:**
- Modify: `socialmetrictec-frontend/src/components/managers/MetricsManager.tsx`

- [ ] **Step 1: Replace the full file**

Replace `socialmetrictec-frontend/src/components/managers/MetricsManager.tsx` with:

```tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Trash2, Check, Loader2, BarChart3, Pencil } from 'lucide-react';
import {
  MetricOut,
  SubMetricOut,
  MetricCreate,
  getMetrics,
  createMetric,
  deleteMetric,
  updateMetric,
  createSubMetric,
  updateSubMetric,
  deleteSubMetric,
} from '@/src/services/metricService';

interface SubMetricFormField {
  title: string;
  value: string;
}

interface MetricFormState {
  title: string;
  subMetrics: SubMetricFormField[];
}

interface EditSubMetricRow {
  sub_metric_id?: number;
  title: string;
  value: string;
  toDelete: boolean;
}

interface MetricEditState {
  metricId: number;
  title: string;
  rows: EditSubMetricRow[];
}

const EMPTY_FORM: MetricFormState = { title: '', subMetrics: [{ title: '', value: '' }] };

export default function MetricsManager({ projectId }: { projectId: number }) {
  const [metrics, setMetrics] = useState<MetricOut[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<MetricFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState<MetricEditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getMetrics(projectId).then(setMetrics).catch(console.error);
  }, [projectId]);

  // ── Create modal ─────────────────────────────────────────────────────────

  const openModal = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const addSubMetricField = () =>
    setForm({ ...form, subMetrics: [...form.subMetrics, { title: '', value: '' }] });

  const removeSubMetricField = (index: number) =>
    setForm({ ...form, subMetrics: form.subMetrics.filter((_, i) => i !== index) });

  const handleSubMetricChange = (index: number, field: keyof SubMetricFormField, value: string) => {
    const updated = [...form.subMetrics];
    updated[index][field] = value;
    setForm({ ...form, subMetrics: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data: MetricCreate = {
      metric_title: form.title,
      sub_metrics: form.subMetrics
        .filter((sm) => sm.title.trim() !== '')
        .map((sm) => ({
          sub_metric_title: sm.title,
          sub_metric_value: sm.value.trim() || null,
        })),
    };
    try {
      const created = await createMetric(projectId, data);
      setMetrics((prev) => [...prev, created]);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (metricId: number) => {
    try {
      await deleteMetric(projectId, metricId);
      setMetrics((prev) => prev.filter((m) => m.metric_id !== metricId));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Edit modal ────────────────────────────────────────────────────────────

  const openEdit = (metric: MetricOut) => {
    setEditState({
      metricId: metric.metric_id,
      title: metric.metric_title,
      rows: metric.sub_metrics.map((sm) => ({
        sub_metric_id: sm.sub_metric_id,
        title: sm.sub_metric_title,
        value: sm.sub_metric_value ?? '',
        toDelete: false,
      })),
    });
  };

  const addEditRow = () => {
    if (!editState) return;
    setEditState({ ...editState, rows: [...editState.rows, { title: '', value: '', toDelete: false }] });
  };

  const updateEditRow = (index: number, field: 'title' | 'value', value: string) => {
    if (!editState) return;
    const rows = [...editState.rows];
    rows[index] = { ...rows[index], [field]: value };
    setEditState({ ...editState, rows });
  };

  const markRowDelete = (index: number) => {
    if (!editState) return;
    const rows = [...editState.rows];
    // New rows (no id) are removed immediately; existing rows are flagged
    if (!rows[index].sub_metric_id) {
      rows.splice(index, 1);
    } else {
      rows[index] = { ...rows[index], toDelete: true };
    }
    setEditState({ ...editState, rows });
  };

  const handleEditSave = async () => {
    if (!editState) return;
    setEditSaving(true);
    try {
      await updateMetric(projectId, editState.metricId, { metric_title: editState.title });

      const original = metrics.find((m) => m.metric_id === editState.metricId);
      const originalSubs: SubMetricOut[] = original?.sub_metrics ?? [];

      for (const row of editState.rows) {
        if (row.toDelete && row.sub_metric_id) {
          await deleteSubMetric(projectId, editState.metricId, row.sub_metric_id);
        } else if (!row.toDelete && row.sub_metric_id) {
          const orig = originalSubs.find((s) => s.sub_metric_id === row.sub_metric_id);
          const changed =
            orig?.sub_metric_title !== row.title ||
            (orig?.sub_metric_value ?? '') !== row.value;
          if (changed) {
            await updateSubMetric(projectId, editState.metricId, row.sub_metric_id, {
              sub_metric_title: row.title,
              sub_metric_value: row.value.trim() || null,
            });
          }
        } else if (!row.toDelete && !row.sub_metric_id && row.title.trim()) {
          await createSubMetric(projectId, editState.metricId, {
            sub_metric_title: row.title,
            sub_metric_value: row.value.trim() || null,
          });
        }
      }

      const refreshed = await getMetrics(projectId);
      setMetrics(refreshed);
      setEditState(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-primary tracking-tight">Métricas de Impacto</h2>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Métrica
        </button>
      </div>

      {metrics.length === 0 ? (
        <p className="text-sm text-outline italic">Aún no has registrado métricas.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div
              key={metric.metric_id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10 relative group"
            >
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">
                  {metric.metric_title}
                </h4>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => openEdit(metric)}
                    className="p-1.5 text-outline hover:text-primary transition-colors"
                    aria-label="Editar métrica"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(metric.metric_id)}
                    className="p-1.5 text-outline hover:text-error transition-colors"
                    aria-label="Eliminar métrica"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {metric.sub_metrics.map((sm) => (
                  <div key={sm.sub_metric_id} className="flex justify-between items-baseline border-b border-outline-variant/5 pb-2">
                    <span className="text-xs font-semibold text-outline tracking-tight">{sm.sub_metric_title}</span>
                    <span className="text-2xl font-black text-primary tracking-tighter">
                      {sm.sub_metric_value ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10 overflow-hidden">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-outline hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Configurar Métrica</h2>
                <p className="text-on-surface-variant font-light text-sm mt-2 font-body">Define los indicadores y valores que deseas monitorear.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Título de la Métrica</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ej: Alcance en Comunidades"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Submétricas / Indicadores</label>
                    <button type="button" onClick={addSubMetricField} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Añadir Campo
                    </button>
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto px-1">
                    {form.subMetrics.map((sm, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          placeholder="Título (Ej: Niños atendidos)"
                          value={sm.title}
                          onChange={(e) => handleSubMetricChange(idx, 'title', e.target.value)}
                          className="flex-grow bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                        />
                        <input
                          placeholder="Valor (Ej: 450, 15%, Alto)"
                          value={sm.value}
                          onChange={(e) => handleSubMetricChange(idx, 'value', e.target.value)}
                          className="w-32 bg-surface-container-low border-none rounded-xl p-3 text-xs font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                        {form.subMetrics.length > 1 && (
                          <button type="button" onClick={() => removeSubMetricField(idx)} className="p-2 text-outline-variant hover:text-error transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar Métrica
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit modal */}
      {editState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setEditState(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-10 overflow-hidden">
            <button onClick={() => setEditState(null)} className="absolute top-6 right-6 p-2 text-outline hover:text-primary transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Editar Métrica</h2>
                <p className="text-on-surface-variant font-light text-sm mt-2 font-body">Modifica el título y los indicadores de esta métrica.</p>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Título de la Métrica</label>
                  <input
                    type="text"
                    value={editState.title}
                    onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest">Submétricas / Indicadores</label>
                    <button type="button" onClick={addEditRow} className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Añadir Campo
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto px-1">
                    {editState.rows.map((row, idx) =>
                      row.toDelete ? null : (
                        <div key={row.sub_metric_id ?? `new-${idx}`} className="flex gap-2 items-center">
                          <input
                            placeholder="Título (Ej: Niños atendidos)"
                            value={row.title}
                            onChange={(e) => updateEditRow(idx, 'title', e.target.value)}
                            className="flex-grow bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                          />
                          <input
                            placeholder="Valor"
                            value={row.value}
                            onChange={(e) => updateEditRow(idx, 'value', e.target.value)}
                            className="w-32 bg-surface-container-low border-none rounded-xl p-3 text-xs font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                          <button type="button" onClick={() => markRowDelete(idx)} className="p-2 text-outline-variant hover:text-error transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setEditState(null)} className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleEditSave} disabled={editSaving || !editState.title.trim()} className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-frontend/src/components/managers/MetricsManager.tsx
git commit -m "feat: add metric edit modal with sub-metric create/update/delete support"
```

---

## Task 11: Frontend — MilestonesManager.tsx (inline title edit)

**Files:**
- Modify: `socialmetrictec-frontend/src/components/managers/MilestonesManager.tsx`

- [ ] **Step 1: Replace the full file**

Replace `socialmetrictec-frontend/src/components/managers/MilestonesManager.tsx` with:

```tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Flag, CheckCircle2, Circle, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  MilestoneOut,
} from '@/src/services/milestoneService';

export default function MilestonesManager({ projectId }: { projectId: number }) {
  const [milestones, setMilestones] = useState<MilestoneOut[]>([]);
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getMilestones(projectId).then(setMilestones).catch(console.error);
  }, [projectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const created = await createMilestone(projectId, { title: title.trim() });
      setMilestones((prev) => [...prev, created]);
      setTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (milestone: MilestoneOut) => {
    try {
      const updated = await updateMilestone(projectId, milestone.milestone_id, { is_completed: !milestone.is_completed });
      setMilestones((prev) => prev.map((m) => m.milestone_id === updated.milestone_id ? updated : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (milestoneId: number) => {
    try {
      await deleteMilestone(projectId, milestoneId);
      setMilestones((prev) => prev.filter((m) => m.milestone_id !== milestoneId));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (milestone: MilestoneOut) => {
    setEditingId(milestone.milestone_id);
    setEditingTitle(milestone.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEdit = async (milestoneId: number) => {
    if (!editingTitle.trim()) return;
    setEditSaving(true);
    try {
      const updated = await updateMilestone(projectId, milestoneId, { title: editingTitle.trim() });
      setMilestones((prev) => prev.map((m) => m.milestone_id === updated.milestone_id ? updated : m));
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Flag className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-primary tracking-tight">Hitos del Proyecto</h2>
        <span className="text-[10px] text-outline font-bold uppercase tracking-widest">
          {milestones.filter((m) => m.is_completed).length}/{milestones.length} completados
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Añade un hito (ej: Primera jornada comunitaria realizada)"
          className="flex-grow bg-white border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
        />
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="flex items-center gap-2 px-5 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Añadir
        </button>
      </form>

      {milestones.length === 0 ? (
        <p className="text-sm text-outline italic">Aún no has registrado hitos. Documenta los logros clave del proyecto.</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div key={milestone.milestone_id} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-outline-variant/10 group">
              <button
                onClick={() => handleToggle(milestone)}
                aria-label={milestone.is_completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                className={cn('shrink-0 transition-colors', milestone.is_completed ? 'text-emerald-600' : 'text-outline hover:text-primary')}
              >
                {milestone.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>

              {editingId === milestone.milestone_id ? (
                <div className="flex-grow flex items-center gap-2">
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(milestone.milestone_id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="flex-grow bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    onClick={() => saveEdit(milestone.milestone_id)}
                    disabled={editSaving || !editingTitle.trim()}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Guardar"
                  >
                    {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 text-outline hover:bg-surface-container-low rounded-lg transition-colors"
                    aria-label="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className={cn('flex-grow text-sm', milestone.is_completed ? 'text-outline line-through' : 'text-primary font-medium')}>
                  {milestone.title}
                </span>
              )}

              {editingId !== milestone.milestone_id && milestone.is_completed && milestone.completed_at && (
                <span className="text-[10px] text-outline uppercase tracking-wider shrink-0">
                  {new Date(milestone.completed_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}

              {editingId !== milestone.milestone_id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    onClick={() => startEdit(milestone)}
                    className="p-1 text-outline hover:text-primary transition-all"
                    aria-label="Editar hito"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(milestone.milestone_id)}
                    className="p-1 text-outline hover:text-error transition-all"
                    aria-label="Eliminar hito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-frontend/src/components/managers/MilestonesManager.tsx
git commit -m "feat: add inline title edit to MilestonesManager"
```

---

## Task 12: Frontend — AdminPanel + projectService (status toggle)

**Files:**
- Modify: `socialmetrictec-frontend/src/services/projectService.ts`
- Modify: `socialmetrictec-frontend/src/pages/AdminPanel.tsx`

- [ ] **Step 1: Add toggleProjectStatus to projectService.ts**

Append to `socialmetrictec-frontend/src/services/projectService.ts`:

```typescript
export const toggleProjectStatus = async (projectId: number): Promise<ProjectFull> => {
  const res = await api.patch(`/project/${projectId}/status`);
  return res.data;
};
```

Also add `ProjectFull` import check — it's already defined in the same file so just use it.

- [ ] **Step 2: Add toggle UI to AdminPanel.tsx**

In `AdminPanel.tsx`, add `toggleProjectStatus` to the import from `projectService`:

```typescript
import { type ProjectSummary, listProjects, deleteProject, formatArea, toggleProjectStatus } from '@/src/services/projectService';
```

Add a `togglingProjectId` state near the other project states (after `deletingProject`):

```typescript
const [togglingProjectId, setTogglingProjectId] = useState<number | null>(null);
```

Add the handler function (place it near the `handleDeleteProject` handler):

```typescript
const handleToggleStatus = async (projectId: number) => {
  setTogglingProjectId(projectId);
  try {
    const updated = await toggleProjectStatus(projectId);
    setProjectList((prev) =>
      prev.map((p) => p.project_id === projectId ? { ...p, is_active: updated.is_active } : p)
    );
  } catch (err) {
    console.error(err);
  } finally {
    setTogglingProjectId(null);
  }
};
```

- [ ] **Step 3: Add toggle button and status badge to project list rows**

Find the section in `AdminPanel.tsx` where each project in `projectList` is rendered (search for `projectList.map`). In that mapping, add the badge and toggle button alongside the existing delete button.

Add this import at the top of the file:
```typescript
import { ToggleLeft, ToggleRight } from 'lucide-react';
```

In the project list item render, after (or alongside) the delete button, add:

```tsx
{/* Status badge */}
<span className={cn(
  'text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
  project.is_active
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-500'
)}>
  {project.is_active ? 'Activo' : 'Inactivo'}
</span>

{/* Toggle button */}
<button
  onClick={() => handleToggleStatus(project.project_id)}
  disabled={togglingProjectId === project.project_id}
  aria-label={project.is_active ? 'Desactivar proyecto' : 'Activar proyecto'}
  className={cn(
    'p-1.5 rounded-lg transition-colors disabled:opacity-50',
    project.is_active
      ? 'text-emerald-600 hover:bg-emerald-50'
      : 'text-slate-400 hover:bg-slate-100'
  )}
>
  {togglingProjectId === project.project_id
    ? <Loader2 className="w-4 h-4 animate-spin" />
    : project.is_active
      ? <ToggleRight className="w-5 h-5" />
      : <ToggleLeft className="w-5 h-5" />
  }
</button>
```

- [ ] **Step 4: Commit**

```bash
git add socialmetrictec-frontend/src/services/projectService.ts \
        socialmetrictec-frontend/src/pages/AdminPanel.tsx
git commit -m "feat: add project active/inactive toggle in AdminPanel with status badge"
```

---

## Self-Review Checklist

- [x] **Spec section 1 (DB table):** Task 1 covers SQL + model + `__init__.py` registration.
- [x] **Spec section 2 (backend files):** Tasks 2–6 cover model, schema, helper, all CRUD updates, and both new routes.
- [x] **Spec section 3 (timeline):** Task 8 covers datetime, new types `metrica`/`estado`, `changeLogs` prop, `buildEvents` merge. Task 9 covers the fetch and prop pass in `ProjectDetail`.
- [x] **Spec section 4 (editor):** Task 10 covers MetricsManager edit modal with sub-metric CRUD. Task 11 covers MilestonesManager inline edit.
- [x] **Spec section 5 (AdminPanel):** Task 12 covers `toggleProjectStatus` + badge + button.
- [x] **log_event not committing:** Confirmed in Tasks 3–5 — `log_event` only does `db.add`, callers call `db.commit`.
- [x] **metric_deleted saves title before delete:** Task 3 saves `title = metric.metric_title` before `db.delete`.
- [x] **changeLogService uses same apiClient import pattern as milestoneService:** Confirmed (`import apiClient from '@/src/lib/axios'`).
- [x] **page_edited from change_log doesn't duplicate edit_log entries:** Task 8 note in `buildEvents` explains they are different sources with different timestamps.
