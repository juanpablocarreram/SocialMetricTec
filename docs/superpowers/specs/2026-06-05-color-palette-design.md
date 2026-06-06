# Diseño: Sección "Paleta" en el Editor de Proyectos

**Fecha:** 2026-06-05  
**Estado:** Aprobado

---

## Contexto

El Editor de proyectos (`Editor.tsx`) actualmente permite editar un único color primario mediante un pequeño `<input type="color">` flotante en la esquina superior derecha del hero. La infraestructura para `secondaryColor` y `fontFamily` ya existe en `BlockRenderer.tsx` y `ProjectDetail.tsx` (con valores por defecto), pero nunca se expone al usuario en el Editor.

El objetivo es reemplazar ese input flotante con una sección dedicada "Paleta" en el sidebar del Editor, que incluya color primario, color secundario y un selector de tipografía con carrusel arrastrable.

---

## Qué se construye

### Sección "Paleta" en el sidebar

Se agrega un bloque fijo entre las secciones "Flujo de página" y "Añadir sección" del sidebar del Editor. Contiene:

**1. Color primario**  
- Input de color (`<input type="color">`) con swatch visual y hex legible.  
- Comportamiento actual sin cambios: controla el fondo del hero, botones y acentos principales.  
- Se elimina el input flotante que hoy aparece sobre el hero.

**2. Color secundario**  
- Input de color idéntico al primario.  
- Valor por defecto: `#525d85`.  
- Controla las líneas decorativas y detalles sutiles en `BlockRenderer` (el divisor de la sección `narrative`).

**3. Tipografía — carrusel arrastrable**  
- Carrusel horizontal con scroll por arrastre (mouse drag y touch).  
- 15 chips, cada uno renderizado en su propia fuente.  
- Encabezado muestra la fuente activa con un ícono "Ag" en esa misma tipografía.  
- Seleccionar una fuente actualiza el canvas del editor en tiempo real (sin panel de preview separado): hero title, hero subtitle, títulos de sección y cuerpo de texto.

**Fuentes incluidas:**

| Categoría | Fuentes |
|---|---|
| Sans-serif modernas | Manrope (default), Plus Jakarta Sans, Bricolage Grotesque, Syne, Unbounded, Outfit, Raleway, Inter |
| Serif / editoriales | Playfair Display, Cormorant Garamond, Fraunces, DM Serif Display, Instrument Serif, Merriweather |
| Monoespaciada | Source Code Pro |

---

## Flujo de datos

### Estado del editor

`PageState` (en `Editor.tsx`) gana dos campos nuevos:

```ts
interface PageState {
  coverImage: string;
  headline: string;
  subtitle: string;
  primaryColor: string;    // ya existe
  secondaryColor: string;  // nuevo — default '#525d85'
  fontFamily: string;      // nuevo — default 'Manrope'
  sections: Section[];
}
```

### Serialización hacia el backend

`toBackendPage` serializa los tres valores de estilo en `general_props.styles`:

```ts
general_props: {
  styles: {
    primaryColor: state.primaryColor,
    secondaryColor: state.secondaryColor,
    fontFamily: state.fontFamily,
  }
}
```

### Deserialización desde el backend

`fromBackendPage` lee los nuevos campos con fallback a los valores por defecto:

```ts
secondaryColor: styles.secondaryColor ?? '#525d85',
fontFamily: styles.fontFamily ?? 'Manrope',
```

### Página pública (`ProjectDetail.tsx` y `BlockRenderer.tsx`)

Sin cambios. Ya leen `secondaryColor` y `fontFamily` de `general_props.styles` y los pasan a `BlockRenderer` / `PagePreview`. El comportamiento en la página pública será automáticamente correcto una vez que el Editor los guarde.

---

## Cambios en el código

### Frontend — archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/Editor.tsx` | (1) Añadir `secondaryColor` y `fontFamily` a `PageState` y `DEFAULT_STATE`. (2) Actualizar `toBackendPage` y `fromBackendPage`. (3) Eliminar el input flotante del hero. (4) Agregar sección "Paleta" en el sidebar con los tres controles. (5) Conectar cambios de fuente al canvas en tiempo real con `style.fontFamily`. |
| `socialmetrictec-frontend/index.html` | Añadir `<link>` de Google Fonts con las 15 familias en el `<head>`. |

### Backend — sin cambios

El campo `page` del modelo `Project` ya es `JSON` libre. No requiere migración de base de datos ni cambios en esquemas o rutas.

---

## Comportamiento en tiempo real en el canvas

Al cambiar cualquier control de la paleta, los siguientes elementos del canvas del editor se actualizan inmediatamente (sin guardar):

- **Color primario:** fondo del hero, borde izquierdo de citas, color de títulos de sección, botón "Publicar" y tag activo del sidebar.
- **Color secundario:** guardado en estado, reflejado en la página pública al publicar (el canvas del editor no tiene elementos secundarios visibles en esta fase).
- **Tipografía:** se aplica vía `style={{ fontFamily: state.fontFamily }}` en los elementos React del canvas: el hero (headline y subtitle), los títulos de sección `TextSection`, el cuerpo de texto y las citas. También en el ícono "Ag" del encabezado de la sección Paleta.

Los cambios se persisten al presionar "Publicar" mediante `savePage`.

---

## Lo que NO entra en este alcance

- Presets de estilo / "moods" automáticos (descartado en brainstorming).
- Color de fondo de secciones individuales.
- Tamaños de fuente personalizables.
- Animaciones o transiciones en la página pública.
