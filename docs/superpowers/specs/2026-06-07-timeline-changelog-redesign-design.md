# Diseño: Rediseño del Historial de Cambios en la Línea de Tiempo

**Fecha:** 2026-06-07  
**Estado:** Aprobado

---

## Resumen

Rediseño de la sección "Línea de Tiempo" existente en `ProjectDetail.tsx` / `ProjectTimeline.tsx`. Se elimina la visualización de eventos sueltos y heterogéneos, y se reemplaza por una línea de tiempo de dos tipos de eventos: publicaciones de página (expandibles) y cambios de estado del proyecto. Los eventos de testimonios, fotos, hitos y métricas dejan de aparecer como entradas de nivel superior.

---

## Alcance

### Lo que cambia

- `ProjectTimeline.tsx` — reescritura del componente
- `services/crud/project.py` — agregar diff de bloques al guardar la página
- `ProjectDetail.tsx` — simplificación de props pasadas a `ProjectTimeline`

### Lo que NO cambia

- `project_change_log` (tabla y modelo) — sin migraciones de schema
- `changeLogService.ts` — misma API, misma interfaz `ChangeLogEntry`
- Las demás secciones de `ProjectDetail` (galería, testimonios, hitos, métricas)

---

## Diseño del Backend

### Archivo: `socialmetrictec-backend/services/crud/project.py`

Se agrega la función `_diff_blocks(old_blocks, new_blocks)` y se invoca dentro de `update_project_page_in_db` antes de registrar el evento `page_edited`.

**Lógica de diff:**

Comparar los arrays de bloques `old` y `new` usando el campo `id` de cada bloque como clave de identidad:

| Caso | Event type registrado | `entity_name` |
|---|---|---|
| Bloque presente en `new` pero no en `old` | `page_block_added` | Tipo de bloque (ej. `"Hero"`) |
| Bloque presente en `old` pero no en `new` | `page_block_removed` | Tipo de bloque |
| Bloque presente en ambos con contenido diferente | `page_block_modified` | Tipo de bloque |

Los eventos de bloque se registran **antes** del `page_edited`, de modo que en la base de datos queden con `occurred_at` ≤ `occurred_at` del `page_edited` que los cierra.

**Secuencia de llamadas al guardar:**

```python
old_blocks = (project.page or {}).get("blocks", [])
new_blocks = page_data.model_dump().get("blocks", [])

for block_event, block_type in _diff_blocks(old_blocks, new_blocks):
    log_event(db, project_id, block_event, entity_name=block_type)

log_event(db, project_id, "page_edited")  # cierra la sesión
db.commit()
```

**Tipos de bloque:** Se extrae del campo `type` de cada bloque (string, ej. `"hero"`, `"text"`, `"image"`, `"video"`). Si el campo no existe, se usa `"Bloque"` como fallback.

**Identificación de bloques:** El diff usa el campo `id` de cada bloque como clave de identidad. Si algún bloque no tiene `id`, se cae a comparación por posición en el array (índice).

---

## Diseño del Frontend

### Tipos de eventos en la timeline

Solo se procesan dos categorías de nivel superior:

| Categoría | Event types de `changeLogs` | Comportamiento |
|---|---|---|
| Publicación de página | `page_edited` | Expandible — muestra sub-eventos |
| Cambio de estado | `project_activated`, `project_deactivated` | Solo lectura, no expandible |

El resto de event types (`metric_*`, `milestone_*`, `page_block_*`) son **sub-eventos** — solo aparecen dentro del acordeón de una publicación.

### Algoritmo de agrupación (`buildGroups`)

```
1. Filtrar changeLogs: descartar cualquier event_type no reconocido
2. Ordenar todos los entries por occurred_at ASC, con log_id ASC como tiebreaker
   (bloques y page_edited pueden tener el mismo occurred_at por ser de la misma transacción)
3. Inicializar: groups = [], pendingChildren = []
4. Para cada entry en orden:
     - Si event_type === "page_edited":
         crear PublicationGroup { publishEvent: entry, children: [...pendingChildren] }
         agregar a groups
         limpiar pendingChildren
     - Si event_type en ["project_activated", "project_deactivated"]:
         agregar StatusEvent directamente a groups
     - Resto (metric_*, milestone_*, page_block_*):
         agregar a pendingChildren
5. Descartar pendingChildren restantes (sin publicación posterior)
6. Invertir groups → orden descendente (más reciente primero)
```

### Estructura de datos

```typescript
interface PublicationGroup {
  type: 'publication';
  publishEvent: ChangeLogEntry;   // event_type === 'page_edited'
  children: ChangeLogEntry[];      // ordenados por occurred_at DESC dentro del grupo
}

interface StatusEvent {
  type: 'status';
  event: ChangeLogEntry;           // project_activated | project_deactivated
}

type TimelineItem = PublicationGroup | StatusEvent;
```

### Props de `ProjectTimeline`

Se simplifican — se eliminan `editLog`, `testimonies`, `photos` y `milestones`:

```typescript
interface ProjectTimelineProps {
  changeLogs: ChangeLogEntry[];
}
```

`createdAt` también se elimina (el evento "Proyecto creado" desaparece de la timeline).

### Render del componente

**Nivel superior:** Lista vertical de `TimelineItem`, más reciente arriba.

**`StatusEvent`:** Tarjeta simple. Icono `ToggleRight`, color `bg-slate-100 text-slate-600`. Sin interactividad.

**`PublicationGroup`:**
- Header: icono `Pencil`, título "Publicación de página", fecha/hora, contador "N cambios", chevron.
- Al hacer click en el header: toggle del acordeón (framer-motion `AnimatePresence`).
- Cuerpo expandido: lista de sub-eventos con separador visual entre `page_block_*` (arriba) y `metric_*`/`milestone_*` (abajo).
- Sub-eventos de bloque: icono por tipo (`page_block_added` → `PlusCircle`, `page_block_modified` → `Pencil`, `page_block_removed` → `Trash2`), color azul.
- Sub-eventos de métrica: icono `BarChart3`, color teal.
- Sub-eventos de hito: icono `Flag`, color purple.
- Si `children` está vacío: no mostrar cuerpo expandible (tarjeta no interactiva).

**Sin chips de filtro** — se eliminan completamente.

### Cambios en `ProjectDetail.tsx`

El `<ProjectTimeline />` pasa de recibir 6 props a recibir 1:

```tsx
// Antes
<ProjectTimeline
  createdAt={project.created_at}
  editLog={editLog}
  testimonies={testimonies}
  photos={photos}
  milestones={milestones}
  changeLogs={changeLogs}
/>

// Después
<ProjectTimeline changeLogs={changeLogs} />
```

---

## Comportamiento de eventos huérfanos

Los cambios de métricas/hitos realizados **después de la última publicación** no aparecen en la timeline hasta que el usuario vuelva a publicar la página. Es el comportamiento esperado — la publicación es la acción que "cierra" y agrupa la sesión de edición.

---

## Título de la sección

El título de la sección en `ProjectDetail.tsx` cambia de "Línea de Tiempo" a **"Publicaciones y Eventos"**.
