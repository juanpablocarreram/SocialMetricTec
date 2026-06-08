# Color Palette Redesign — SocialMetricTec Frontend

**Date:** 2026-06-07  
**Status:** Approved  
**Scope:** `src/index.css` — reemplazar sistema de tokens de color completo para alinear con el logo actual

---

## Contexto

El logo actual tiene 5 colores vibrantes: teal `#0BA599`, naranja `#E89018`, coral `#E0564E`, púrpura `#7C30AA` y azul `#5A8FBE`. La paleta anterior del sitio era azul marino corporativo (`#002068`) que no guardaba relación visual con el logo. El objetivo es una paleta Dribbble-quality: contraste alto, elegante, moderno, con jerarquía visual clara.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| ¿Base clara u oscura? | Clara — blanco con tinte lavanda (Lavender Wash) |
| ¿Color de acción primaria? | Púrpura `#7C30AA` |
| ¿Rol de los 4 colores restantes? | Semántico: teal=éxito, naranja=aviso, coral=error, azul=info |
| ¿Surface tone? | Lavanda wash `#F8F5FF` — cohesiona con el primario sin perder legibilidad |

---

## Sistema de tokens — valores completos

### Primario

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#7C30AA` | Botones CTA, links activos, focus rings, indicadores de selección |
| `--color-on-primary` | `#FFFFFF` | Texto sobre fondo primario |
| `--color-primary-container` | `#F0EAFF` | Fondos de elementos primarios (hover chips, badges, avatar bg) |
| `--color-on-primary-container` | `#7C30AA` | Texto dentro de primary-container |

### Secundario (púrpura más suave)

| Token | Valor | Uso |
|---|---|---|
| `--color-secondary` | `#9B59B6` | Estados hover del primario, variantes de acento |
| `--color-on-secondary` | `#FFFFFF` | Texto sobre secundario |
| `--color-secondary-container` | `#E8E0F7` | Fondos de elementos secundarios |

### Terciario (eliminado — reemplazado por sistema semántico)

El anterior terciario rojo-oscuro (`#4f1100`) queda eliminado. El coral `#E0564E` cubre el rol de error con más coherencia visual.

### Superficie

| Token | Valor | Uso |
|---|---|---|
| `--color-surface` | `#F8F5FF` | Fondo principal del body |
| `--color-on-surface` | `#111827` | Texto principal |
| `--color-surface-variant` | `#E8E0F7` | Bordes de secciones, dividers con peso visual |
| `--color-on-surface-variant` | `#6B7280` | Texto secundario, subtítulos, metadatos |
| `--color-surface-container-lowest` | `#FFFFFF` | Cards, modales, dropdowns — el nivel más claro |
| `--color-surface-container-low` | `#F4F0FF` | Hover backgrounds, items de lista |
| `--color-surface-container` | `#F0EAFF` | Contenedores seleccionados, chips activos |
| `--color-surface-container-high` | `#E8E0F7` | Elementos elevados, headers de sección |
| `--color-surface-container-highest` | `#DDD6F3` | Bordes enfatizados, separadores |

### Outline

| Token | Valor | Uso |
|---|---|---|
| `--color-outline` | `#9B8BB5` | Bordes de inputs, separadores funcionales |
| `--color-outline-variant` | `#DDD6F3` | Bordes decorativos sutiles, dividers ligeros |

### Semánticos (mapeados desde los 5 colores del logo)

| Token | Valor | Color del logo | Uso |
|---|---|---|---|
| `--color-error` | `#E0564E` | Coral | Errores, estados destructivos |
| `--color-on-error` | `#FFFFFF` | — | Texto sobre error |
| `--color-success` | `#0BA599` | Teal | Éxito, confirmaciones, publicado |
| `--color-on-success` | `#FFFFFF` | — | Texto sobre success |
| `--color-warning` | `#E89018` | Naranja | Avisos, revisión pendiente |
| `--color-on-warning` | `#FFFFFF` | — | Texto sobre warning |
| `--color-info` | `#5A8FBE` | Azul | Información, borradores, neutral |
| `--color-on-info` | `#FFFFFF` | — | Texto sobre info |

---

## Tipografía

Sin cambio — ya implementada correctamente:

- **Headline:** Manrope 700/800 (h1–h6)
- **Body:** Inter 400/500/600
- **Label:** Inter 800, `text-transform: uppercase`, `letter-spacing: 0.12em`

---

## Navbar

- Fondo: `rgba(255,255,255,0.88)` con `backdrop-filter: blur(16px)`
- Borde inferior: `1px solid #DDD6F3` (outline-variant)
- Texto de marca: `color-primary` (`#7C30AA`)
- Links activos: `color-primary` + `border-bottom: 2px solid`
- Sin cambios estructurales al componente `Navbar.tsx`

---

## Utilidades a actualizar en `index.css`

- `.glass-header`: mantener `backdrop-blur` — cambiar el borde a `border-outline-variant`
- `.tonal-card`: sin cambio funcional — los nuevos tokens de surface ya producen el tono correcto

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/index.css` | Reemplazar el bloque `@theme` completo con los nuevos tokens |

**Tokens eliminados** (no existen en el nuevo sistema):
- `--color-tertiary`, `--color-on-tertiary`, `--color-tertiary-container`

**Tokens nuevos** (no existían antes — se agregan):
- `--color-success`, `--color-on-success`
- `--color-warning`, `--color-on-warning`
- `--color-info`, `--color-on-info`

No se toca ningún componente `.tsx` — todos usan los tokens semánticamente (e.g., `bg-primary`, `text-on-surface`) y se actualizarán automáticamente.

> **Nota de contraste:** `#E89018` (warning) sobre blanco tiene ratio ~3.1:1 — cumple AA solo para texto grande (≥18px o ≥14px bold). Usarlo únicamente en badges con fondo tintado `#fffbeb` o en iconos acompañados de texto oscuro.

---

## Contraste WCAG

| Combinación | Ratio estimado | WCAG |
|---|---|---|
| `#7C30AA` sobre `#FFFFFF` | ~7.2:1 | AAA |
| `#7C30AA` sobre `#F8F5FF` | ~6.9:1 | AA+ |
| `#111827` sobre `#FFFFFF` | ~17.5:1 | AAA |
| `#0BA599` sobre `#FFFFFF` | ~4.6:1 | AA |
| `#E0564E` sobre `#FFFFFF` | ~4.2:1 | AA |
| `#E89018` sobre `#FFFFFF` | ~3.1:1 | AA (texto grande) |

---

## Fuera de alcance

- Tipografía (sin cambio)
- Estructura de componentes (sin cambio)
- Dark mode (no solicitado)
- Colores de los SDG/ODS (imágenes externas, no tokens)
