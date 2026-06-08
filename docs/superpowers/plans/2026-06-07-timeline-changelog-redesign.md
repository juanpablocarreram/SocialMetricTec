# Timeline Changelog Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la sección "Línea de Tiempo" existente para mostrar solo publicaciones de página (expandibles con sub-eventos) y cambios de estado del proyecto, eliminando el resto de eventos de nivel superior.

**Architecture:** El backend agrega diff de bloques al guardar la página, registrando `page_block_added/modified/removed` como filas en `project_change_log`. El frontend agrupa todos los eventos entre dos `page_edited` consecutivos bajo el más reciente y los muestra en un acordeón expandible.

**Tech Stack:** Python/FastAPI (backend), React 19 + TypeScript + framer-motion + lucide-react + Tailwind (frontend)

---

## File Map

| Archivo | Acción | Qué hace |
|---|---|---|
| `socialmetrictec-backend/services/crud/project.py` | Modify | Agrega `_diff_blocks` e invoca antes de `page_edited` |
| `socialmetrictec-backend/tests/project/test_diff_blocks.py` | Create | Tests unitarios para `_diff_blocks` |
| `socialmetrictec-frontend/src/components/ProjectTimeline.tsx` | Rewrite | Nueva UI con acordeón, `buildGroups`, tipos limpios |
| `socialmetrictec-frontend/src/pages/ProjectDetail.tsx` | Modify | Simplifica props de `ProjectTimeline`, cambia título de sección |

---

## Task 1: Instalar pytest y escribir tests fallidos para `_diff_blocks`

**Files:**
- Create: `socialmetrictec-backend/tests/project/test_diff_blocks.py`

- [ ] **Step 1: Instalar pytest en el virtualenv del backend**

```bash
cd socialmetrictec-backend
venv/bin/pip install pytest
```

Salida esperada: `Successfully installed pytest-...`

- [ ] **Step 2: Escribir el archivo de tests**

Crea `socialmetrictec-backend/tests/project/test_diff_blocks.py` con el siguiente contenido:

```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from services.crud.project import _diff_blocks


def test_no_changes_returns_empty():
    blocks = [{'id': '1', 'type': 'hero', 'props': {'title': 'Hola'}}]
    assert _diff_blocks(blocks, blocks) == []


def test_block_added_by_id():
    old = [{'id': '1', 'type': 'hero', 'props': {}}]
    new = [{'id': '1', 'type': 'hero', 'props': {}}, {'id': '2', 'type': 'text', 'props': {}}]
    result = _diff_blocks(old, new)
    assert ('page_block_added', 'Text') in result
    assert len(result) == 1


def test_block_removed_by_id():
    old = [{'id': '1', 'type': 'hero', 'props': {}}, {'id': '2', 'type': 'image', 'props': {}}]
    new = [{'id': '1', 'type': 'hero', 'props': {}}]
    result = _diff_blocks(old, new)
    assert ('page_block_removed', 'Image') in result
    assert len(result) == 1


def test_block_modified_by_id():
    old = [{'id': '1', 'type': 'hero', 'props': {'title': 'Antes'}}]
    new = [{'id': '1', 'type': 'hero', 'props': {'title': 'Después'}}]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Hero') in result
    assert len(result) == 1


def test_multiple_changes():
    old = [
        {'id': '1', 'type': 'hero', 'props': {'title': 'Antes'}},
        {'id': '2', 'type': 'image', 'props': {}},
    ]
    new = [
        {'id': '1', 'type': 'hero', 'props': {'title': 'Después'}},
        {'id': '3', 'type': 'text', 'props': {}},
    ]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Hero') in result
    assert ('page_block_removed', 'Image') in result
    assert ('page_block_added', 'Text') in result
    assert len(result) == 3


def test_blocks_without_id_fallback_to_position():
    old = [{'type': 'hero', 'props': {'title': 'A'}}]
    new = [{'type': 'hero', 'props': {'title': 'B'}}]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Hero') in result


def test_no_id_block_added_by_position():
    old = []
    new = [{'type': 'video', 'props': {}}]
    result = _diff_blocks(old, new)
    assert ('page_block_added', 'Video') in result


def test_type_fallback_when_missing():
    old = [{'id': '1', 'props': {}}]
    new = [{'id': '1', 'props': {'x': 1}}]
    result = _diff_blocks(old, new)
    assert ('page_block_modified', 'Bloque') in result


def test_empty_to_empty_returns_empty():
    assert _diff_blocks([], []) == []
```

- [ ] **Step 3: Ejecutar los tests para confirmar que fallan**

```bash
cd socialmetrictec-backend
venv/bin/pytest tests/project/test_diff_blocks.py -v
```

Salida esperada: todos los tests FAILED con `ImportError: cannot import name '_diff_blocks'`

---

## Task 2: Implementar `_diff_blocks` e integrarlo en `update_project_page_in_db`

**Files:**
- Modify: `socialmetrictec-backend/services/crud/project.py`

- [ ] **Step 1: Agregar la función `_diff_blocks` al final de `project.py`**

Agrega esto al final de `socialmetrictec-backend/services/crud/project.py`, después de `_page_with_edit_log`:

```python
def _diff_blocks(old_blocks: list, new_blocks: list) -> list[tuple[str, str]]:
    events: list[tuple[str, str]] = []

    # Separate blocks with and without 'id'
    old_by_id = {b['id']: b for b in old_blocks if b.get('id')}
    new_by_id = {b['id']: b for b in new_blocks if b.get('id')}
    old_no_id = [b for b in old_blocks if not b.get('id')]
    new_no_id = [b for b in new_blocks if not b.get('id')]

    # ID-based comparison
    old_ids = set(old_by_id)
    new_ids = set(new_by_id)

    for bid in new_ids - old_ids:
        events.append(('page_block_added', new_by_id[bid].get('type', 'bloque').capitalize()))
    for bid in old_ids - new_ids:
        events.append(('page_block_removed', old_by_id[bid].get('type', 'bloque').capitalize()))
    for bid in old_ids & new_ids:
        if old_by_id[bid] != new_by_id[bid]:
            events.append(('page_block_modified', new_by_id[bid].get('type', 'bloque').capitalize()))

    # Position-based fallback for blocks without 'id'
    for i in range(max(len(old_no_id), len(new_no_id))):
        if i >= len(old_no_id):
            events.append(('page_block_added', new_no_id[i].get('type', 'bloque').capitalize()))
        elif i >= len(new_no_id):
            events.append(('page_block_removed', old_no_id[i].get('type', 'bloque').capitalize()))
        elif old_no_id[i] != new_no_id[i]:
            events.append(('page_block_modified', new_no_id[i].get('type', 'bloque').capitalize()))

    return events
```

- [ ] **Step 2: Ejecutar tests para verificar que pasan**

```bash
cd socialmetrictec-backend
venv/bin/pytest tests/project/test_diff_blocks.py -v
```

Salida esperada: todos los tests PASSED.

- [ ] **Step 3: Integrar `_diff_blocks` en `update_project_page_in_db`**

En `socialmetrictec-backend/services/crud/project.py`, reemplaza el cuerpo de `update_project_page_in_db` de esta forma. Localiza esta línea:

```python
    project.page = _page_with_edit_log(project.page, page_data.model_dump())
    log_event(db, project_id, "page_edited")
    db.commit()
```

Y reemplázala con:

```python
    new_page = page_data.model_dump()
    old_blocks = (project.page or {}).get("blocks", []) if isinstance(project.page, dict) else []
    new_blocks = new_page.get("blocks", [])

    for block_event, block_type in _diff_blocks(old_blocks, new_blocks):
        log_event(db, project_id, block_event, entity_name=block_type)

    project.page = _page_with_edit_log(project.page, new_page)
    log_event(db, project_id, "page_edited")
    db.commit()
```

- [ ] **Step 4: Re-ejecutar todos los tests para confirmar que nada se rompe**

```bash
cd socialmetrictec-backend
venv/bin/pytest tests/project/test_diff_blocks.py -v
```

Salida esperada: todos PASSED.

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-backend/services/crud/project.py \
        socialmetrictec-backend/tests/project/test_diff_blocks.py
git commit -m "feat: add block-level diff on page save and log to change_log"
```

---

## Task 3: Reescribir `ProjectTimeline.tsx`

**Files:**
- Modify: `socialmetrictec-frontend/src/components/ProjectTimeline.tsx`

- [ ] **Step 1: Reemplazar el contenido completo de `ProjectTimeline.tsx`**

Reemplaza todo el contenido de `socialmetrictec-frontend/src/components/ProjectTimeline.tsx` con:

```tsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, ToggleRight, BarChart3, Flag, PlusCircle, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ChangeLogEntry } from '@/src/services/changeLogService';

interface PublicationGroup {
  type: 'publication';
  publishEvent: ChangeLogEntry;
  children: ChangeLogEntry[];
}

interface StatusEvent {
  type: 'status';
  event: ChangeLogEntry;
}

type TimelineItem = PublicationGroup | StatusEvent;

const KNOWN_EVENTS = new Set([
  'page_edited', 'project_activated', 'project_deactivated',
  'page_block_added', 'page_block_modified', 'page_block_removed',
  'metric_created', 'metric_updated', 'metric_deleted', 'milestone_updated',
]);

function buildGroups(changeLogs: ChangeLogEntry[]): TimelineItem[] {
  const sorted = [...changeLogs]
    .filter(e => KNOWN_EVENTS.has(e.event_type))
    .sort((a, b) => {
      const tDiff = new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
      return tDiff !== 0 ? tDiff : a.log_id - b.log_id;
    });

  const groups: TimelineItem[] = [];
  let pending: ChangeLogEntry[] = [];

  for (const entry of sorted) {
    if (entry.event_type === 'page_edited') {
      groups.push({
        type: 'publication',
        publishEvent: entry,
        children: [...pending].reverse(),
      });
      pending = [];
    } else if (entry.event_type === 'project_activated' || entry.event_type === 'project_deactivated') {
      groups.push({ type: 'status', event: entry });
    } else {
      pending.push(entry);
    }
  }

  return groups.reverse();
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} · ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

const SUB_EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  page_block_added:    { label: 'añadido',           icon: PlusCircle, color: 'bg-blue-50 text-blue-500' },
  page_block_modified: { label: 'modificado',        icon: Pencil,     color: 'bg-blue-50 text-blue-500' },
  page_block_removed:  { label: 'eliminado',         icon: Trash2,     color: 'bg-blue-50 text-blue-500' },
  metric_created:      { label: 'Métrica creada',    icon: BarChart3,  color: 'bg-teal-50 text-teal-600' },
  metric_updated:      { label: 'Métrica editada',   icon: BarChart3,  color: 'bg-teal-50 text-teal-600' },
  metric_deleted:      { label: 'Métrica eliminada', icon: BarChart3,  color: 'bg-teal-50 text-teal-600' },
  milestone_updated:   { label: 'Hito editado',      icon: Flag,       color: 'bg-purple-50 text-purple-600' },
};

function subEventLabel(entry: ChangeLogEntry): string {
  const meta = SUB_EVENT_META[entry.event_type];
  if (!meta) return entry.event_type;
  if (entry.event_type.startsWith('page_block_')) {
    return `${entry.entity_name ?? 'Bloque'} ${meta.label}`;
  }
  return entry.entity_name ? `${meta.label}: ${entry.entity_name}` : meta.label;
}

export interface ProjectTimelineProps {
  changeLogs: ChangeLogEntry[];
}

export default function ProjectTimeline({ changeLogs }: ProjectTimelineProps) {
  const items = useMemo(() => buildGroups(changeLogs), [changeLogs]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (items.length === 0) return null;

  return (
    <div className="relative pl-10">
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-400 to-outline-variant/10" />
      <div className="space-y-4">
        {items.map((item, i) => {
          if (item.type === 'status') {
            const label =
              item.event.event_type === 'project_activated'
                ? 'Proyecto marcado como activo'
                : 'Proyecto marcado como inactivo';
            return (
              <motion.div
                key={item.event.log_id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 8) * 0.04 }}
                className="relative"
              >
                <span className="absolute -left-10 top-1 w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shadow-sm">
                  <ToggleRight className="w-3.5 h-3.5" />
                </span>
                <div className="px-4 py-3 bg-white rounded-xl border border-outline-variant/15">
                  <p className="text-sm font-bold text-on-surface leading-tight">{label}</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-1">
                    {formatDateTime(item.event.occurred_at)}
                  </p>
                </div>
              </motion.div>
            );
          }

          const { publishEvent, children } = item;
          const isOpen = expanded.has(publishEvent.log_id);
          const hasChildren = children.length > 0;
          const blockChildren = children.filter(c => c.event_type.startsWith('page_block_'));
          const dataChildren = children.filter(c => !c.event_type.startsWith('page_block_'));

          return (
            <motion.div
              key={publishEvent.log_id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="relative"
            >
              <span className="absolute -left-10 top-1 w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                <Pencil className="w-3.5 h-3.5" />
              </span>
              <div
                className={cn(
                  'bg-white rounded-xl border overflow-hidden',
                  hasChildren ? 'border-blue-200' : 'border-outline-variant/15',
                )}
              >
                <button
                  onClick={() => hasChildren && toggle(publishEvent.log_id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left',
                    hasChildren
                      ? 'cursor-pointer hover:bg-blue-50/50 transition-colors'
                      : 'cursor-default',
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-blue-700 leading-tight">
                      Publicación de página
                    </p>
                    <p className="text-[10px] text-outline uppercase tracking-wider font-medium mt-1">
                      {formatDateTime(publishEvent.occurred_at)}
                      {hasChildren && (
                        <span className="text-blue-500 font-bold">
                          {' '}·{' '}
                          {children.length}{' '}
                          {children.length === 1 ? 'cambio' : 'cambios'}
                        </span>
                      )}
                    </p>
                  </div>
                  {hasChildren && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-blue-400 transition-transform duration-200 shrink-0 ml-3',
                        isOpen && 'rotate-180',
                      )}
                    />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-blue-100 bg-blue-50/40 px-4 py-3 space-y-2">
                        {blockChildren.map(entry => {
                          const meta = SUB_EVENT_META[entry.event_type];
                          if (!meta) return null;
                          const Icon = meta.icon as React.ElementType;
                          return (
                            <div key={entry.log_id} className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                  meta.color,
                                )}
                              >
                                <Icon className="w-2.5 h-2.5" />
                              </span>
                              <span className="text-xs text-on-surface font-medium">
                                {subEventLabel(entry)}
                              </span>
                              <span className="text-[9px] text-outline ml-auto shrink-0">
                                {formatTime(entry.occurred_at)}
                              </span>
                            </div>
                          );
                        })}

                        {blockChildren.length > 0 && dataChildren.length > 0 && (
                          <div className="border-t border-blue-100 my-1" />
                        )}

                        {dataChildren.map(entry => {
                          const meta = SUB_EVENT_META[entry.event_type];
                          if (!meta) return null;
                          const Icon = meta.icon as React.ElementType;
                          return (
                            <div key={entry.log_id} className="flex items-center gap-2.5">
                              <span
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                                  meta.color,
                                )}
                              >
                                <Icon className="w-2.5 h-2.5" />
                              </span>
                              <span className="text-xs text-on-surface font-medium">
                                {subEventLabel(entry)}
                              </span>
                              <span className="text-[9px] text-outline ml-auto shrink-0">
                                {formatTime(entry.occurred_at)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que TypeScript compila sin errores**

```bash
cd socialmetrictec-frontend
npm run lint
```

Salida esperada: sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add socialmetrictec-frontend/src/components/ProjectTimeline.tsx
git commit -m "feat: rewrite ProjectTimeline with publication groups and accordion expand"
```

---

## Task 4: Actualizar `ProjectDetail.tsx`

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/ProjectDetail.tsx`

- [ ] **Step 1: Eliminar la variable `editLog` que quedará sin usar**

En `socialmetrictec-frontend/src/pages/ProjectDetail.tsx`, alrededor de la línea 90, elimina esta línea:

```tsx
const editLog: string[] = page?.general_props?.edit_log ?? [];
```

Esa variable solo se usaba para pasar a `ProjectTimeline`, que ya no la necesita.

- [ ] **Step 2: Simplificar las props de `ProjectTimeline` y cambiar el título de la sección**

En `socialmetrictec-frontend/src/pages/ProjectDetail.tsx`, localiza el bloque de la sección de la línea de tiempo (alrededor de la línea 338):

```tsx
      {/* Línea de tiempo (solo administradores) */}
      {user?.is_admin && (
        <section className="py-20 bg-surface-container-lowest">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--p-secondary)' }}>
                Evolución
              </span>
              <h2 className="text-3xl font-extrabold tracking-tighter mt-2" style={{ color: 'var(--p-primary)' }}>
                Línea de Tiempo
              </h2>
            </div>
            <ProjectTimeline
              createdAt={project.created_at}
              editLog={editLog}
              testimonies={testimonies}
              photos={photos}
              milestones={milestones}
              changeLogs={changeLogs}
            />
          </div>
        </section>
      )}
```

Reemplázalo con:

```tsx
      {/* Línea de tiempo (solo administradores) */}
      {user?.is_admin && (
        <section className="py-20 bg-surface-container-lowest">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--p-secondary)' }}>
                Evolución
              </span>
              <h2 className="text-3xl font-extrabold tracking-tighter mt-2" style={{ color: 'var(--p-primary)' }}>
                Publicaciones y Eventos
              </h2>
            </div>
            <ProjectTimeline changeLogs={changeLogs} />
          </div>
        </section>
      )}
```

- [ ] **Step 3: Verificar que TypeScript compila sin errores**

```bash
cd socialmetrictec-frontend
npm run lint
```

Salida esperada: sin errores. Si aparece un error sobre `editLog` o props eliminadas, asegúrate de que el import de `ProjectTimeline` esté usando el nuevo componente correctamente.

- [ ] **Step 4: Commit**

```bash
git add socialmetrictec-frontend/src/pages/ProjectDetail.tsx
git commit -m "feat: update ProjectDetail to use simplified ProjectTimeline props"
```

---

## Task 5: Verificación final manual

- [ ] **Step 1: Levantar el backend**

```bash
cd socialmetrictec-backend
venv/bin/uvicorn main:app --reload
```

- [ ] **Step 2: Levantar el frontend**

En otra terminal:

```bash
cd socialmetrictec-frontend
npm run dev
```

- [ ] **Step 3: Verificar la línea de tiempo como admin**

1. Navegar a la página de detalle de un proyecto como usuario administrador
2. Hacer scroll hasta la sección "Publicaciones y Eventos"
3. Verificar que:
   - No hay chips de filtro
   - Solo aparecen eventos de tipo "Publicación de página" y "Cambio de estado"
   - Los eventos de estado (activo/inactivo) aparecen como tarjetas simples sin botón de expansión
   - Las publicaciones con sub-eventos muestran "N cambios" y el chevron
   - El acordeón se expande/colapsa al hacer click
   - Los sub-eventos de bloque aparecen arriba del separador y los de métricas/hitos abajo

- [ ] **Step 4: Verificar que el diff de bloques funciona**

1. Como usuario con permisos, abrir el editor de la página de un proyecto
2. Modificar un bloque (ej. cambiar el título del hero) y hacer click en "Publicar"
3. Recargar la página de detalle como admin
4. Verificar que la nueva publicación aparece con "1 cambio" y al expandir dice "Hero modificado"

- [ ] **Step 5: Commit final de verificación (si no hay cambios pendientes)**

```bash
git status
# Si no hay cambios sin commit, todo está listo
```
