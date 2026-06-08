# Diseño: Línea de Tiempo Extendida + Edición de Métricas/Hitos + Toggle de Estado

**Fecha:** 2026-06-07  
**Estado:** Aprobado

---

## Contexto

El proyecto tiene una línea de tiempo (`ProjectTimeline`) visible solo para admins al final de la página pública de cada proyecto. Actualmente muestra: creación del proyecto, ediciones de página, testimonios, fotos e hitos (creados/completados). Solo muestra fecha sin hora. No hay registro de eventos de métricas. Las métricas no son editables desde el Editor. Los hitos solo pueden completarse/descompletarse, no editarse. No existe UI para que el admin cambie el estado activo/inactivo de un proyecto.

---

## Objetivos

1. Mostrar fecha **y hora** en todos los eventos de la línea de tiempo.
2. Registrar en BD todos los eventos de métricas (creación, edición, eliminación) visibles en la línea de tiempo del admin.
3. Permitir editar métricas existentes (título + sub-métricas) desde el Editor.
4. Permitir editar el título de un hito existente desde el Editor.
5. Permitir al admin marcar un proyecto como activo/inactivo desde el AdminPanel, registrando el evento con timestamp.

---

## Sección 1 — Base de Datos

### Nueva tabla: `project_change_log`

```sql
CREATE TABLE IF NOT EXISTS project_change_log (
    log_id        INT           NOT NULL AUTO_INCREMENT,
    project_id    INT           NOT NULL,
    event_type    VARCHAR(60)   NOT NULL,
    entity_name   VARCHAR(255),
    occurred_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_project_change_log PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Sin FK a `project`** (igual que `export_log`) para que los registros sobrevivan si se elimina el proyecto.

### Tipos de evento activos en esta iteración

| event_type            | Cuándo se escribe                                      | entity_name              |
|-----------------------|--------------------------------------------------------|--------------------------|
| `metric_created`      | Al crear una métrica                                   | título de la métrica     |
| `metric_updated`      | Al editar título o sub-métricas de una métrica         | título de la métrica     |
| `metric_deleted`      | Al eliminar una métrica                                | título de la métrica     |
| `milestone_updated`   | Al editar el título/descripción de un hito             | nuevo título del hito    |
| `page_edited`         | Al guardar la página del proyecto desde el Editor      | null                     |
| `project_activated`   | Al marcar el proyecto como activo                      | null                     |
| `project_deactivated` | Al marcar el proyecto como inactivo                    | null                     |

### Tipos reservados para iteraciones futuras

`milestone_created`, `milestone_completed`, `testimony_created` — la tabla los soporta; la lógica de escritura se añade cuando se necesite. Los eventos de milestones y testimonios ya tienen `created_at`/`completed_at` en sus propias tablas, por lo que el timeline los sigue leyendo desde ahí.

---

## Sección 2 — Backend

### Archivos nuevos

**`models/change_log.py`**
Modelo SQLAlchemy para `project_change_log`: `log_id`, `project_id`, `event_type`, `entity_name`, `occurred_at`.

**`schemas/change_log.py`**
Schema Pydantic `ChangeLogOut` con los mismos campos y `model_config = ConfigDict(from_attributes=True)`.

**`services/crud/change_log.py`**
Función helper:
```python
def log_event(db, project_id, event_type, entity_name=None):
    entry = ProjectChangeLog(project_id=project_id, event_type=event_type, entity_name=entity_name)
    db.add(entry)
    # No commit aquí — el commit lo hace el caller dentro de su transacción
```

### Archivos modificados

**`services/crud/metric.py`**
- `create_metric`: llama `log_event(db, project_id, "metric_created", data.metric_title)` antes del commit.
- `update_metric`: llama `log_event(db, metric.project_id, "metric_updated", data.metric_title)` antes del commit.
- `delete_metric`: llama `log_event(db, metric.project_id, "metric_deleted", metric.metric_title)` antes del commit (guardar el título antes de borrar).

**`services/crud/milestone.py`**
- `update_milestone`: si se actualiza `title` o `description`, llama `log_event(db, project_id, "milestone_updated", new_title)` antes del commit.

**`services/crud/project.py`**
- `update_project_page_in_db`: llama `log_event(db, project_id, "page_edited")` antes del commit.
- Nueva función `toggle_project_status(db, project_id, user)`:
  - Verifica `user.is_admin`; retorna `"acceso_denegado"` si no.
  - Busca el proyecto; retorna `"no_encontrado"` si no existe.
  - Invierte `project.is_active`.
  - Llama `log_event(db, project_id, "project_activated" o "project_deactivated")`.
  - Commit y retorna el proyecto actualizado.

**`routes/project.py`**
- Nuevo `GET /{project_id}/change-log` → solo admin, retorna `list[ChangeLogOut]` ordenado por `occurred_at DESC`.
- Nuevo `PATCH /{project_id}/status` → solo admin, llama `toggle_project_status`.

---

## Sección 3 — Frontend: Línea de Tiempo

### `ProjectTimeline.tsx`

- `formatDate` → `formatDateTime`: incluye hora, ej: `"7 de junio de 2026 · 14:32"`.
- Nuevos `EventType`: `"metrica"` y `"estado"`.
- `TYPE_META` añade:
  - `metrica`: icono `BarChart3`, color `bg-teal-100 text-teal-600`, label `"Métricas"`
  - `estado`: icono `ToggleRight`, color `bg-slate-100 text-slate-600`, label `"Estado"`
- Nueva prop `changeLogs: ChangeLogEntry[]` (array del endpoint `/change-log`).
- `buildEvents` mapea `changeLogs`:
  - `metric_*` → tipo `"metrica"`, title según event_type + entity_name
  - `page_edited` → tipo `"edicion"` (se une al edit_log existente; se evitan duplicados por timestamp exacto)
  - `project_activated` / `project_deactivated` → tipo `"estado"`
  - `milestone_updated` → tipo `"hito"`, title `"Hito editado: {entity_name}"`

> Los eventos existentes (project.created_at, edit_log JSON, testimonies, photos, milestones created_at/completed_at) continúan leyéndose desde sus fuentes actuales para preservar datos históricos. Los eventos `page_edited` del change_log y los del edit_log JSON se unen; si hay duplicados exactos de timestamp se deduplican por id único.

### `ProjectDetail.tsx`

- Añade llamada a `getChangeLog(projectId)` en el `Promise.all` del `useEffect`.
- Pasa `changeLogs` como prop a `ProjectTimeline`.

### `changeLogService.ts` (nuevo)

```typescript
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

---

## Sección 4 — Frontend: Editor

### `MetricsManager.tsx`

- Nuevo estado `metricToEdit: MetricOut | null`.
- Botón lápiz (Pencil) junto al botón eliminar en cada tarjeta de métrica.
- El modal de edición se pre-puebla con:
  - Título de la métrica.
  - Lista de sub-métricas existentes (editables: título y valor).
  - Opción de añadir nuevas sub-métricas.
  - Opción de eliminar sub-métricas (marcadas como eliminadas, no se borra hasta guardar).
- Al guardar:
  1. Llama `updateMetric(projectId, metricId, { metric_title })` si el título cambió.
  2. Para cada sub-métrica existente modificada: `updateSubMetric(...)`.
  3. Para cada sub-métrica nueva: `createSubMetric(...)`.
  4. Para cada sub-métrica marcada para eliminar: `deleteSubMetric(...)`.
  5. Actualiza el estado local `metrics` con el resultado.

### `MilestonesManager.tsx`

- Nuevo estado `editingId: number | null` y `editingTitle: string`.
- Botón lápiz junto al botón eliminar en cada hito.
- Al hacer clic: `editingId = milestone.milestone_id`, `editingTitle = milestone.title`.
- El título se reemplaza por un `<input>` con botones Guardar (Check) y Cancelar (X).
- Al guardar: llama `updateMilestone(projectId, milestoneId, { title: editingTitle })`, actualiza estado local, limpia `editingId`.

---

## Sección 5 — Frontend: AdminPanel

### `AdminPanel.tsx`

- En la sección "Proyectos", cada fila de proyecto muestra:
  - Badge de estado: `"Activo"` (verde) / `"Inactivo"` (gris).
  - Botón toggle (ToggleRight verde / ToggleLeft gris) junto al botón eliminar.
- Al hacer clic en toggle: llama `toggleProjectStatus(projectId)`, actualiza `projectList` localmente invirtiendo `is_active`.
- Requiere confirmación implícita (un clic, sin modal — la acción es reversible).

### `projectService.ts`

```typescript
export const toggleProjectStatus = async (projectId: number): Promise<ProjectFull> => {
  const res = await apiClient.patch(`/project/${projectId}/status`);
  return res.data;
};
```

---

## Restricciones y límites de alcance

- El toggle de activo/inactivo **no cambia la visibilidad pública** del proyecto en el directorio en esta iteración — solo actualiza el campo y genera el log. Comportamiento de filtrado se define en otra iteración.
- No se migran eventos históricos al `project_change_log`. La línea de tiempo mostrará eventos de métricas y estado solo a partir del despliegue.
- La edición de sub-métricas en el modal maneja la sincronización en el cliente: se hacen múltiples llamadas API al guardar (no transacción atómica del lado del cliente, pero cada operación individual es atómica en el servidor).
- El endpoint `GET /change-log` requiere token de admin. Si el usuario no es admin, el frontend no llama este endpoint (la sección de línea de tiempo ya está protegida por `user?.is_admin`).
