# Color Palette Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el sistema de tokens de color en `src/index.css` para alinear la UI con la estética del logo actual — púrpura como primario, surface lavanda wash, y los 4 colores restantes del logo como semánticos.

**Architecture:** Un único bloque `@theme` en `src/index.css` define todos los tokens de color que Tailwind CSS v4 consume. Reemplazar esos valores actualiza toda la UI automáticamente sin tocar ningún componente `.tsx`.

**Tech Stack:** Tailwind CSS v4 (`@theme` inline tokens), Vite, React

**Spec:** `docs/superpowers/specs/2026-06-07-color-palette-redesign.md`

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `src/index.css` | Reemplazar bloque `@theme` completo |

No se crean archivos nuevos. No se tocan componentes.

---

### Task 1: Reemplazar el bloque `@theme` en `src/index.css`

**Files:**
- Modify: `src/index.css:4-38` (bloque `@theme` completo)

- [ ] **Step 1: Verificar el estado actual del archivo**

```bash
cd socialmetrictec-frontend
head -50 src/index.css
```

Esperado: ver `--color-primary: #002068` y los tokens de tertiary (`#4f1100`).

- [ ] **Step 2: Reemplazar el bloque `@theme` completo**

Sustituir desde `@theme {` hasta el cierre `}` correspondiente con:

```css
@theme {
  --font-headline: "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-label: "Inter", ui-sans-serif, system-ui, sans-serif;

  --color-primary: #7C30AA;
  --color-on-primary: #ffffff;
  --color-primary-container: #F0EAFF;
  --color-on-primary-container: #7C30AA;

  --color-secondary: #9B59B6;
  --color-on-secondary: #ffffff;
  --color-secondary-container: #E8E0F7;

  --color-surface: #F8F5FF;
  --color-on-surface: #111827;
  --color-surface-variant: #E8E0F7;
  --color-on-surface-variant: #6B7280;

  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #F4F0FF;
  --color-surface-container: #F0EAFF;
  --color-surface-container-high: #E8E0F7;
  --color-surface-container-highest: #DDD6F3;

  --color-outline: #9B8BB5;
  --color-outline-variant: #DDD6F3;

  --color-error: #E0564E;
  --color-on-error: #ffffff;

  --color-success: #0BA599;
  --color-on-success: #ffffff;

  --color-warning: #E89018;
  --color-on-warning: #ffffff;

  --color-info: #5A8FBE;
  --color-on-info: #ffffff;
}
```

> Nota: los tokens `--color-tertiary`, `--color-on-tertiary`, `--color-tertiary-container` quedan eliminados — no son usados en ningún componente.

- [ ] **Step 3: Verificar que no queden referencias a tokens eliminados**

```bash
grep -r "tertiary" src/
```

Esperado: sin output (cero resultados).

- [ ] **Step 4: Verificar que TypeScript compila sin errores**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat: apply Lavender Wash color palette aligned with logo"
```

---

### Task 2: Verificación visual en el navegador

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Iniciar el servidor de desarrollo**

```bash
npm run dev
```

Abre `http://localhost:3000` en el navegador.

- [ ] **Step 2: Verificar la Navbar**

Comprobar en la página de inicio (sin login):
- Fondo: blanco translúcido (frosted glass) con tinte lavanda muy sutil en el body
- Texto "SocialMetricTec": púrpura `#7C30AA`
- Botón "Iniciar Sesión": fondo `#7C30AA`, texto blanco

- [ ] **Step 3: Verificar el body / surface**

El fondo de la página completa debe tener un lavanda wash `#F8F5FF` — distinguible del blanco puro pero muy sutil.

- [ ] **Step 4: Verificar cards y dropdowns**

Con sesión iniciada:
- Cards de proyectos: fondo blanco `#FFFFFF`, bordes lavanda `#DDD6F3`
- Dropdown de proyecto activo: fondo blanco, anillo de hover `ring-primary/20` en púrpura

- [ ] **Step 5: Verificar estados de error**

Navegar a una página con validación (ej. `/create-project`):
- Mensajes de error: coral `#E0564E` — más cálido que el rojo anterior `#ba1a1a`
- Botón "Cerrar Sesión" en el menú de perfil: coral `#E0564E`

- [ ] **Step 6: Verificar el link de logout en Navbar**

En el dropdown de perfil, "Cerrar Sesión" debe aparecer en coral `#E0564E` (color-error).

- [ ] **Step 7: Confirmar sin regresiones visuales graves**

Revisar rápidamente:
- `/` (Explorar)
- `/directory` (Directorio)
- `/login`
- `/admin` (si hay acceso)

Si todo se ve correctamente, la implementación está completa.
