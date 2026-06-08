# Accesibilidad WCAG 2.1 AA — Estructura, Semántica y ARIA

**Fecha:** 2026-06-08  
**Alcance:** Frontend completo (`socialmetrictec-frontend/src`)  
**Nivel objetivo:** WCAG 2.1 AA  
**Fuera de alcance:** Ajustes de color/contraste (diseño visual intacto)

---

## Contexto

La aplicación es un frontend React/TypeScript (Vite + Tailwind) con rutas públicas y privadas. Las páginas principales son: Home, Directory, Login, Editor, ProjectDetail, CreateProject, AdminPanel, TestimonyForm, Profile y ProjectReport. Se usa Framer Motion para animaciones y Lucide React para íconos.

El objetivo es que usuarios con discapacidades visuales, motoras o cognitivas puedan navegar y operar la app con lectores de pantalla y teclado, cumpliendo WCAG 2.1 AA en semántica y estructura sin alterar el diseño visual.

---

## Sección 1: Cambios Globales

**Archivos:** `index.html`, `App.tsx`

### `lang="es"` en `<html>`
- Criterio: WCAG 3.1.1 (Language of Page)
- Añadir `lang="es"` al elemento `<html>` en `index.html`.

### Skip link "Saltar al contenido principal"
- Criterio: WCAG 2.4.1 (Bypass Blocks)
- Añadir un `<a href="#main-content">` como primer elemento del DOM en `AppContent`.
- Visible solo al recibir foco (CSS: `sr-only focus:not-sr-only`).
- Target: `<main id="main-content">` en `App.tsx`.

### `<main>` con `id="main-content"`
- El wrapper `<main>` en `App.tsx` recibe `id="main-content"` para ser el destino del skip link.

### Estado de carga accesible
- Criterio: WCAG 4.1.3 (Status Messages)
- El div del spinner de carga recibe `role="status"` y `aria-live="polite"`.

---

## Sección 2: Navbar (`Navbar.tsx`)

### Navegación principal
- `<nav>` recibe `aria-label="Navegación principal"`.
- Links activos reciben `aria-current="page"` cuando `location.pathname === link.path`.

### Logo / Link a Home
- El `<Link to="/">` del logo recibe `aria-label="SocialMetricTec - Página de inicio"`.

### Dropdown de proyectos
- Botón trigger: `aria-expanded={isDropdownOpen}`, `aria-haspopup="listbox"`, `aria-controls="project-listbox"`.
- `aria-label` dinámico: `"Seleccionar proyecto"` o `"Proyecto actual: [nombre]"`.
- El panel desplegable: `id="project-listbox"`, `role="listbox"`.
- Cada opción de proyecto: `role="option"`, `aria-selected={currentProject?.id === project.id}`.
- Tecla `Escape` cierra el dropdown y devuelve el foco al botón trigger.

### Dropdown de perfil
- Botón trigger: `aria-expanded={isProfileOpen}`, `aria-haspopup="menu"`, `aria-label="Menú de perfil de [username]"` o `"Menú de perfil"`.
- El panel desplegable: `role="menu"`.
- Cada item: `role="menuitem"`.
- Imagen de perfil: `alt={user.username}` (reemplaza el genérico "User Profile").
- Tecla `Escape` cierra el dropdown y devuelve el foco al botón trigger.

### Icono ChevronDown
- Todos los `<ChevronDown>` dentro de botones reciben `aria-hidden="true"`.

---

## Sección 3: Formularios

**Archivos:** `Login.tsx`, `PasswordInput.tsx`, `CreateProject.tsx`, `TestimonyForm.tsx`, `Profile.tsx`

### Login (`Login.tsx`)
- Criterios: WCAG 1.3.1, 3.3.2
- Los `<label>` reciben `htmlFor` asociado al `id` de su input.
- Input de usuario: `id="username"`. Input de contraseña: `id="password"`.
- Reemplazar `alert()` de error por un `<div role="alert" aria-live="assertive">` visible en la UI.
- Botón "Regresar": `aria-label="Regresar a la página anterior"`.
- Botón submit en estado de carga: `aria-busy="true"` cuando `isSubmitting`.

### `PasswordInput.tsx`
- Ya implementado correctamente: tiene `type="button"`, `aria-label` dinámico `"Mostrar contraseña"` / `"Ocultar contraseña"`. No requiere cambios.

### `AdminPanel.tsx` — Modales
- Los modales de confirmación (`userToDelete`, `userToEdit`, `projectToDelete`) necesitan `role="dialog"`, `aria-modal="true"`, y `aria-labelledby` apuntando al título del modal.
- Al abrir un modal: mover el foco al primer elemento interactivo dentro de él.
- Al cerrar un modal: devolver el foco al botón que lo abrió.
- Cerrar con `Escape`.
- Fondo/overlay: `aria-hidden="true"` para que los lectores de pantalla no lean el contenido detrás.

### `CreateProject.tsx`, `TestimonyForm.tsx`, `Profile.tsx`
- Todos los inputs reciben `id` único y su `<label>` recibe `htmlFor` correspondiente.
- Campos requeridos: `aria-required="true"` (o atributo HTML `required`).
- Mensajes de error: `role="alert"` o contenedor con `aria-live="polite"`.
- Botones de submit con estado cargando: `aria-busy="true"` y `aria-label` descriptivo.

---

## Sección 4: Contenido de Páginas

**Archivos:** `Home.tsx`, `Directory.tsx`, `ProjectDetail.tsx`, `ProjectReport.tsx`, `NoProjectSelected.tsx`

### Links no descriptivos (WCAG 2.4.6)
- Todos los links "Ver Detalles" reciben `aria-label="Ver detalles de [project.project_name]"`.
- Links "Ver todos los proyectos" → ya descriptivo.
- Link "Crea el primero" → `aria-label="Crear el primer proyecto"`.

### Imágenes (WCAG 1.1.1)
- Imágenes decorativas (fondos, gradientes como elementos `<img>`): `alt=""`.
- Imagen del campus en Hero (`Home.tsx`): `alt="Campus del Tecnológico de Monterrey"`.
- Imágenes de portada de proyectos: `alt={project.project_name}`.
- Imágenes de proyectos en listboxes del Navbar: `alt={project.name}` (ya presente, verificar).

### Secciones con landmarks (WCAG 1.3.1)
- Cada `<section>` en `Home.tsx` recibe `aria-labelledby` apuntando al `id` de su `<h2>`:
  - Hero: `aria-labelledby="hero-heading"`
  - Métricas: `aria-labelledby="metrics-heading"` (añadir `<h2>` visualmente oculto si no hay uno)
  - Proyectos destacados: `aria-labelledby="featured-heading"`
  - ODS: `aria-labelledby="ods-heading"`

### Jerarquía de encabezados
- Verificar que no haya saltos de nivel (e.g., `h1` → `h3` sin `h2`). Si los hay, ajustar los niveles de los encabezados secundarios para que sean consecutivos.
- Cada página debe tener exactamente un `<h1>` visible.

---

## Sección 5: Movimiento Reducido y Loaders

**Archivos:** todos los que usan `motion.*` de Framer Motion

### `useReducedMotion()` (WCAG 2.3.3 / buena práctica AA)
- En cada componente con animaciones Framer Motion, importar y usar `useReducedMotion()`.
- Cuando `shouldReduceMotion` es `true`: pasar `transition={{ duration: 0 }}` o `initial={false}` para desactivar animaciones de entrada/salida.
- Afecta: `Home.tsx`, `Navbar.tsx` (dropdowns), `Directory.tsx`, `ProjectDetail.tsx`.

### Spinners y loaders (WCAG 4.1.3)
- `<Loader2>` en Login: `aria-hidden="true"` en el ícono, texto visible o `aria-label` en el botón.
- Loader global de `App.tsx`: ya cubierto en Sección 1.
- Cualquier otro spinner en la app: `role="status"` + `aria-label="Cargando"`.

### Footer (`Footer.tsx`)
- `<footer>` ya es semántico. Añadir `aria-label="Pie de página"` para distinguirlo del footer de Login.

---

## Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `index.html` | `lang="es"` |
| `App.tsx` | Skip link, `id="main-content"`, `role="status"` en loader |
| `Navbar.tsx` | `aria-label` nav, `aria-current`, dropdowns ARIA, Escape handler, imágenes |
| `Login.tsx` | `htmlFor`/`id`, error como `role="alert"`, `aria-busy` |
| `PasswordInput.tsx` | `aria-label` toggle, `aria-hidden` ícono, `type="button"` |
| `CreateProject.tsx` | `htmlFor`/`id`, `aria-required`, error `role="alert"` |
| `TestimonyForm.tsx` | `htmlFor`/`id`, `aria-required`, error `role="alert"` |
| `Profile.tsx` | `htmlFor`/`id`, `aria-required`, error `role="alert"` |
| `Home.tsx` | `aria-label` links, `alt` imágenes, `aria-labelledby` secciones, `useReducedMotion` |
| `Directory.tsx` | `aria-label` links, jerarquía headings, `useReducedMotion` |
| `ProjectDetail.tsx` | `alt` imágenes, headings, `useReducedMotion` |
| `AdminPanel.tsx` | `role="dialog"`, focus trap en modales, Escape handler |
| `Footer.tsx` | `aria-label="Pie de página"` |

## Criterios WCAG 2.1 AA cubiertos

| Criterio | Descripción | Sección |
|----------|-------------|---------|
| 1.1.1 | Contenido no textual (alt) | 4 |
| 1.3.1 | Información y relaciones (semántica) | 3, 4 |
| 2.1.1 | Teclado | 2, 3 |
| 2.4.1 | Saltar bloques (skip link) | 1 |
| 2.4.6 | Encabezados y etiquetas descriptivos | 2, 4 |
| 3.1.1 | Idioma de la página | 1 |
| 3.3.1 | Identificación de errores | 3 |
| 3.3.2 | Etiquetas o instrucciones | 3 |
| 4.1.2 | Nombre, función, valor (ARIA) | 2, 3 |
| 4.1.3 | Mensajes de estado | 1, 5 |
