# Accesibilidad WCAG 2.1 AA — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir conformidad WCAG 2.1 AA de estructura, semántica y ARIA a todo el frontend sin modificar el diseño visual.

**Architecture:** Cambios quirúrgicos archivo por archivo: atributos ARIA, asociaciones label→input, gestión de foco en dropdowns y modales, skip link global, `lang`, y `useReducedMotion` en todos los componentes animados con Framer Motion.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Motion React (`motion/react`), Lucide React, React Router v6

---

## Task 1: Cambios globales — `index.html` y `App.tsx`

**Files:**
- Modify: `socialmetrictec-frontend/index.html`
- Modify: `socialmetrictec-frontend/src/App.tsx`

- [ ] **Step 1: Cambiar `lang="en"` a `lang="es"` en `index.html`**

```html
<!-- Antes -->
<html lang="en">

<!-- Después -->
<html lang="es">
```

- [ ] **Step 2: Añadir skip link y `id="main-content"` en `App.tsx`**

Localiza el `return` de `AppContent` y reemplaza el bloque completo:

```tsx
return (
  <div className="flex flex-col min-h-screen">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-md focus:font-bold focus:text-sm"
    >
      Saltar al contenido principal
    </a>
    {!isLoginPage && <Navbar />}
    <main id="main-content" className="flex-grow">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/login" element={<Login />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/project/:projectId/testimonies" element={<TestimonyForm />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/project/:projectId/report" element={<ProjectReport />} />
      </Routes>
    </main>
    {!isLoginPage && <Footer />}
  </div>
);
```

- [ ] **Step 3: Añadir `role="status"` al spinner de carga**

Localiza el bloque `if (loading)` en `AppContent` y reemplaza:

```tsx
if (loading) {
  return (
    <div role="status" aria-live="polite" className="flex h-screen items-center justify-center">
      <div className="loader">Cargando SocialTec...</div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add socialmetrictec-frontend/index.html socialmetrictec-frontend/src/App.tsx
git commit -m "a11y: add lang=es, skip link, main landmark, and loading status role"
```

---

## Task 2: Navbar — navegación principal, logo y `aria-current`

**Files:**
- Modify: `socialmetrictec-frontend/src/components/Navbar.tsx`

- [ ] **Step 1: Añadir `aria-label` al `<header>` y al `<nav>`**

Localiza `<header className="w-full sticky...">` y dentro el `<nav>`:

```tsx
<header aria-label="Encabezado principal" className="w-full sticky top-0 z-[100] glass-header border-b border-outline-variant/10 bg-white/80 backdrop-blur-md">
  <nav aria-label="Navegación principal" className="flex justify-between items-center px-6 md:px-12 py-3 max-w-screen-2xl mx-auto">
```

- [ ] **Step 2: Añadir `aria-label` al link del logo**

```tsx
<Link to="/" aria-label="SocialMetricTec - Página de inicio" className="shrink-0">
```

- [ ] **Step 3: Añadir `aria-current="page"` a los links activos**

Localiza el mapeo de `visibleLinks` dentro de la sección de links del nav:

```tsx
{visibleLinks.map((link) => (
  <Link
    key={link.path}
    to={link.path}
    aria-current={location.pathname === link.path ? 'page' : undefined}
    className={cn(
      'transition-all duration-300 ease-in-out pb-1 border-b-2 whitespace-nowrap',
      location.pathname === link.path
        ? 'text-primary border-primary'
        : 'text-on-surface-variant border-transparent hover:text-primary hover:border-primary/30',
    )}
  >
    {link.name}
  </Link>
))}
```

- [ ] **Step 4: Commit**

```bash
git add socialmetrictec-frontend/src/components/Navbar.tsx
git commit -m "a11y: add nav aria-label, logo aria-label, aria-current on active links"
```

---

## Task 3: Navbar — dropdown de proyectos

**Files:**
- Modify: `socialmetrictec-frontend/src/components/Navbar.tsx`

- [ ] **Step 1: Añadir ARIA al botón trigger del dropdown de proyectos**

Localiza el `<button onClick={() => setIsDropdownOpen...` del proyecto y reemplázalo:

```tsx
<button
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  aria-expanded={isDropdownOpen}
  aria-haspopup="listbox"
  aria-controls="project-listbox"
  aria-label={currentProject ? `Proyecto actual: ${currentProject.name}` : 'Seleccionar proyecto'}
  className={cn(
    'flex items-center gap-3 px-3 py-1.5 rounded-full transition-all duration-300 border border-outline-variant/10 hover:bg-surface-container-low group',
    isDropdownOpen ? 'bg-surface-container-low ring-2 ring-primary/20' : 'bg-transparent',
  )}
>
```

- [ ] **Step 2: Añadir `aria-hidden` a los íconos ChevronDown dentro de botones**

Dentro del botón de proyectos, el `ChevronDown`:

```tsx
<ChevronDown aria-hidden="true" className={cn('w-3 h-3 transition-transform duration-300', isDropdownOpen && 'rotate-180')} />
```

- [ ] **Step 3: Añadir roles al panel del dropdown y sus items**

Localiza el `<motion.div` del panel (dentro de `isDropdownOpen &&`) y añade `id` y `role`:

```tsx
<motion.div
  id="project-listbox"
  role="listbox"
  aria-label="Mis proyectos"
  initial={{ opacity: 0, y: 10, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.15 }}
  className="absolute left-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50 p-2"
>
```

Luego, cada botón de proyecto dentro del listbox:

```tsx
<button
  key={project.id}
  role="option"
  aria-selected={currentProject?.id === project.id}
  onClick={() => { setCurrentProject(project); setIsDropdownOpen(false); }}
  className={cn(
    'w-full flex items-center gap-3 p-3 rounded-xl transition-all group',
    currentProject?.id === project.id
      ? 'bg-primary/5 text-primary'
      : 'hover:bg-surface-container-low text-on-surface-variant',
  )}
>
```

- [ ] **Step 4: Añadir manejador de `Escape` para el dropdown de proyectos**

Modifica el `useEffect` existente que escucha `mousedown`:

```tsx
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setIsProfileOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  };
}, []);
```

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-frontend/src/components/Navbar.tsx
git commit -m "a11y: add ARIA to project dropdown (expanded, listbox, options, Escape)"
```

---

## Task 4: Navbar — dropdown de perfil

**Files:**
- Modify: `socialmetrictec-frontend/src/components/Navbar.tsx`

- [ ] **Step 1: Añadir ARIA al botón trigger del dropdown de perfil**

Localiza el `<button onClick={() => setIsProfileOpen...` y reemplázalo:

```tsx
<button
  onClick={() => setIsProfileOpen(!isProfileOpen)}
  aria-expanded={isProfileOpen}
  aria-haspopup="menu"
  aria-label={user ? `Menú de perfil de ${user.username}` : 'Menú de perfil'}
  className={cn(
    'flex items-center gap-2 p-1 rounded-full transition-all duration-300 hover:bg-surface-container-low group border border-transparent',
    isProfileOpen ? 'bg-surface-container-low border-outline-variant/10 shadow-sm' : 'bg-transparent',
  )}
>
```

- [ ] **Step 2: Corregir `alt` de la imagen de perfil**

```tsx
<img src={userImage} alt={user.username} className="w-full h-full object-cover" />
```

- [ ] **Step 3: Añadir `aria-hidden` al ChevronDown del botón de perfil**

```tsx
<ChevronDown aria-hidden="true" className={cn('w-4 h-4 text-outline transition-transform duration-300 mr-1', isProfileOpen && 'rotate-180')} />
```

- [ ] **Step 4: Añadir `role="menu"` al panel y `role="menuitem"` a los items**

Localiza el `<motion.div` del dropdown de perfil y añade `role`:

```tsx
<motion.div
  role="menu"
  aria-label="Opciones de perfil"
  initial={{ opacity: 0, y: 10, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.15 }}
  className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50 p-2"
>
```

Luego el link "Editar Perfil":

```tsx
<Link
  to="/profile"
  role="menuitem"
  onClick={() => setIsProfileOpen(false)}
  className="w-full flex items-center gap-3 p-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all"
>
```

Y el botón "Cerrar Sesión":

```tsx
<button
  role="menuitem"
  onClick={() => { 
    logout(); 
    setIsProfileOpen(false); 
    window.location.replace("/login");
  }}
  className="w-full flex cursor-pointer items-center gap-3 p-3 rounded-xl text-error hover:bg-error/5 transition-all text-left"
>
```

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-frontend/src/components/Navbar.tsx
git commit -m "a11y: add ARIA to profile dropdown (expanded, menu, menuitem, alt text)"
```

---

## Task 5: Login — formulario accesible

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/Login.tsx`

- [ ] **Step 1: Añadir estado de error visible y eliminar `alert()`**

Añade el estado al inicio de `LoginForm`:

```tsx
const [errorMessage, setErrorMessage] = useState('');
```

- [ ] **Step 2: Reemplazar `alert()` por mensaje de error con `role="alert"`**

En el bloque `catch` del `handleSubmit`, reemplaza:

```tsx
// Antes
alert(typeof errorMsg === 'string' ? errorMsg : "Error de validación");

// Después
setErrorMessage(typeof errorMsg === 'string' ? errorMsg : "Error de validación");
```

- [ ] **Step 3: Añadir el bloque de error visible en el JSX**

Dentro del `<form>`, antes del botón submit, añade:

```tsx
{errorMessage && (
  <div role="alert" aria-live="assertive" className="flex items-center gap-2 bg-error/10 border border-error/30 text-error rounded-lg p-3 text-sm font-medium">
    {errorMessage}
  </div>
)}
```

- [ ] **Step 4: Asociar labels con inputs via `htmlFor`/`id`**

Reemplaza los dos campos del formulario:

```tsx
<div className="space-y-2">
  <label htmlFor="username" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
    Nombre de Usuario
  </label>
  <input 
    id="username"
    required
    type="text" 
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
    placeholder="Noobmaster69"
    className="w-full bg-surface-container-low border-none rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
  />
</div>
<div className="space-y-2">
  <label htmlFor="password" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
    Contraseña
  </label>
  <PasswordInput
    id="password"
    required
    value={formData.password}
    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
    placeholder="........"
    className="w-full bg-surface-container-low border-none rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
  />
</div>
```

- [ ] **Step 5: Añadir `aria-busy` al botón submit**

```tsx
<button 
  type="submit" 
  disabled={isSubmitting}
  aria-busy={isSubmitting}
  className="w-full bg-primary text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-70"
>
  {isSubmitting ? (
    <><Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" /> Iniciando sesión...</>
  ) : (
    <>Iniciar Sesión <ArrowRight aria-hidden="true" className="w-5 h-5" /></>
  )}
</button>
```

- [ ] **Step 6: Añadir `aria-label` al botón "Regresar"**

```tsx
<button 
  onClick={() => navigate(-1)}
  aria-label="Regresar a la página anterior"
  className="px-6 py-2 cursor-pointer border border-primary text-primary rounded-md text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center gap-2"
>
  Regresar
</button>
```

- [ ] **Step 7: Commit**

```bash
git add socialmetrictec-frontend/src/pages/Login.tsx
git commit -m "a11y: associate login labels, replace alert() with role=alert, aria-busy"
```

---

## Task 6: CreateProject — formulario accesible

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/CreateProject.tsx`

- [ ] **Step 1: Añadir `htmlFor`/`id` a los campos del formulario**

Localiza cada `<label>` y su `<input>` o `<textarea>` correspondiente. Añade `htmlFor` al label e `id` al input. Los ids a usar:

| Campo | id |
|-------|----|
| Nombre del Proyecto | `project-name` |
| Resumen del Proyecto | `project-description` |
| Objetivo Principal | `project-objetivo` |
| Número de Beneficiarios | `project-beneficiarios` |

Ejemplo para el campo de nombre:

```tsx
<label htmlFor="project-name" className="text-[10px] font-bold text-outline uppercase tracking-widest flex items-center gap-2">
  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
  Nombre del Proyecto
</label>
<input
  id="project-name"
  required
  type="text"
  placeholder="Escribe el nombre de tu proyecto..."
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  className="w-full text-4xl font-extrabold tracking-tighter text-primary placeholder:text-outline-variant/30 border-none bg-transparent focus:ring-0 p-0"
/>
```

Aplica el mismo patrón para los otros tres campos.

- [ ] **Step 2: Reemplazar el mensaje de error por `role="alert"`**

Localiza `{error && (` y reemplaza:

```tsx
{error && (
  <div role="alert" aria-live="assertive" className="text-error text-sm font-medium text-center">
    {error}
  </div>
)}
```

- [ ] **Step 3: Añadir `aria-busy` y `aria-label` al botón submit**

```tsx
<button
  type="submit"
  disabled={submitting}
  aria-busy={submitting}
  className="flex-grow md:flex-none px-12 py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-60"
>
  {submitting ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : (
    <>
      Lanzar Proyecto
      <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </>
  )}
</button>
```

- [ ] **Step 4: Añadir `aria-label` al botón de imagen y `aria-label` descriptivo a la sección ODS**

La sección de ODS ya tiene un `<label>` con texto. Añade `role="group"` y `aria-labelledby` para agrupar los botones:

```tsx
<div className="space-y-6" role="group" aria-labelledby="ods-select-label">
  <label id="ods-select-label" className="text-[10px] font-bold text-outline uppercase tracking-widest">
    Selecciona el ODS
  </label>
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
    {STRATEGIC_AREAS.map((area) => (
      <button
        key={area.value}
        type="button"
        aria-pressed={formData.area === area.value}
        onClick={() => setFormData({ ...formData, area: area.value })}
        ...
      >
```

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-frontend/src/pages/CreateProject.tsx
git commit -m "a11y: associate CreateProject labels, role=alert errors, aria-busy, ODS group"
```

---

## Task 7: TestimonyForm — formulario accesible

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/TestimonyForm.tsx`

- [ ] **Step 1: Añadir `htmlFor`/`id` a los campos**

| Campo | id |
|-------|----|
| Tu testimonio (textarea) | `testimony-content` |
| Etiquetas (input) | `testimony-tags` |

```tsx
<label htmlFor="testimony-content" className="text-[10px] font-bold text-outline uppercase tracking-widest">Tu testimonio</label>
<textarea
  id="testimony-content"
  required
  rows={6}
  value={content}
  ...
/>
```

```tsx
<label htmlFor="testimony-tags" className="text-[10px] font-bold text-outline uppercase tracking-widest">Etiquetas ({tags.length}/10)</label>
<input
  id="testimony-tags"
  type="text"
  value={tagInput}
  ...
/>
```

La sección de categorías no tiene un input, pero sí necesita un agrupador:

```tsx
<div role="group" aria-labelledby="testimony-category-label">
  <label id="testimony-category-label" className="text-[10px] font-bold text-outline uppercase tracking-widest">Categoría</label>
  <div className="flex flex-wrap gap-2">
    {CATEGORIES.map((cat) => (
      <button
        key={cat}
        type="button"
        aria-pressed={category === cat}
        onClick={() => setCategory(category === cat ? '' : cat)}
        ...
      >
```

- [ ] **Step 2: Reemplazar el error con `role="alert"`**

```tsx
{error && (
  <motion.p role="alert" aria-live="assertive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-error font-medium">
    {error}
  </motion.p>
)}
```

- [ ] **Step 3: Añadir `aria-label` al botón de eliminar testimonio**

```tsx
<button
  onClick={() => handleDelete(t.testimony_id)}
  aria-label={`Eliminar testimonio de ${t.display_name ?? t.author_username}`}
  className="p-1.5 text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-error/5"
>
  <Trash2 aria-hidden="true" className="w-4 h-4" />
</button>
```

- [ ] **Step 4: Añadir `aria-busy` al botón submit**

```tsx
<button
  type="submit"
  disabled={submitting || !isValid}
  aria-busy={submitting}
  className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
>
  {submitting ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Check aria-hidden="true" className="w-4 h-4" />}
  Enviar Testimonio
</button>
```

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-frontend/src/pages/TestimonyForm.tsx
git commit -m "a11y: associate TestimonyForm labels, role=alert, aria-busy, delete aria-label"
```

---

## Task 8: Profile — formulario accesible

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/Profile.tsx`

- [ ] **Step 1: Añadir `htmlFor`/`id` a los campos del formulario de perfil**

| Campo | id |
|-------|----|
| Correo electrónico | `profile-email` |
| Descripción | `profile-description` |
| Sitio web | `profile-website` |

```tsx
<label htmlFor="profile-email" className="text-[10px] font-bold text-outline uppercase tracking-widest">Correo electrónico</label>
<input
  id="profile-email"
  required
  type="email"
  value={email}
  ...
/>
```

Aplica el mismo patrón para `profile-description` (textarea) y `profile-website` (input).

- [ ] **Step 2: Reemplazar errores con `role="alert"`**

Formulario de perfil:

```tsx
{profileError && (
  <div role="alert" aria-live="assertive" className="text-sm text-error font-medium">
    {profileError}
  </div>
)}
```

Formulario de contraseña:

```tsx
{passwordError && (
  <div role="alert" aria-live="assertive" className="text-sm text-error font-medium">
    {passwordError}
  </div>
)}
```

- [ ] **Step 3: Asociar labels con PasswordInputs en el formulario de contraseña**

| Campo | id |
|-------|----|
| Contraseña actual | `current-password` |
| Nueva contraseña | `new-password` |
| Confirmar contraseña | `confirm-password` |

```tsx
<label htmlFor="current-password" className="text-[10px] font-bold text-outline uppercase tracking-widest">Contraseña actual</label>
<PasswordInput
  id="current-password"
  required
  value={currentPassword}
  ...
/>
```

Nota: `PasswordInput` acepta todos los `InputHTMLAttributes`, por lo que `id` se propaga automáticamente al `<input>` interno.

- [ ] **Step 4: Añadir `aria-busy` a los botones submit**

Botón de guardar perfil:

```tsx
<button
  type="submit"
  disabled={savingProfile}
  aria-busy={savingProfile}
  ...
>
  {savingProfile ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Check aria-hidden="true" className="w-4 h-4" />}
  {profileSaved ? 'Guardado' : 'Guardar Perfil'}
</button>
```

Botón de cambiar contraseña (mismo patrón con `savingPassword`).

- [ ] **Step 5: Commit**

```bash
git add socialmetrictec-frontend/src/pages/Profile.tsx
git commit -m "a11y: associate Profile labels, role=alert errors, aria-busy on submit buttons"
```

---

## Task 9: AdminPanel — modales accesibles

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/AdminPanel.tsx`

- [ ] **Step 1: Añadir Escape handler para todos los modales**

Añade este `useEffect` junto a los otros effects existentes:

```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (showAddModal) setShowAddModal(false);
    if (userToEdit) closeEditModal();
    if (userToDelete) setUserToDelete(null);
    if (projectToDelete) setProjectToDelete(null);
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [showAddModal, userToEdit, userToDelete, projectToDelete]);
```

- [ ] **Step 2: Añadir `role="dialog"` al modal "Añadir Líder" (línea ~601)**

Localiza el `<motion.div` del contenido del modal (no el overlay) y añade:

```tsx
<motion.div
  role="dialog"
  aria-modal="true"
  aria-labelledby="add-leader-title"
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-10 overflow-hidden"
>
```

Luego añade `id` al `<h2>`:

```tsx
<h2 id="add-leader-title" className="text-3xl font-extrabold text-primary tracking-tighter">Nuevo Líder</h2>
```

Y añade `aria-label` al botón de cerrar (X):

```tsx
<button
  onClick={() => setShowAddModal(false)}
  aria-label="Cerrar modal"
  className="absolute top-6 right-6 p-2 text-outline hover:text-primary"
>
  <X aria-hidden="true" className="w-6 h-6 cursor-pointer" />
</button>
```

- [ ] **Step 3: Añadir `htmlFor`/`id` a los campos del formulario dentro del modal "Añadir"**

| Campo | id |
|-------|----|
| Nombre de Usuario | `new-leader-username` |
| Correo Electrónico | `new-leader-email` |
| Contraseña | `new-leader-password` |
| Confirmar | `new-leader-confirm` |

```tsx
<label htmlFor="new-leader-username" className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Nombre de Usuario</label>
<input
  id="new-leader-username"
  required
  type="text"
  value={newUser.username}
  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
  ...
/>
```

Aplica el mismo patrón para los otros tres campos. Para los `PasswordInput`, el `id` se propaga automáticamente.

- [ ] **Step 4: Añadir `role="dialog"` al modal "Editar Líder" (línea ~707)**

```tsx
<motion.div
  role="dialog"
  aria-modal="true"
  aria-labelledby="edit-leader-title"
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
>
```

Localiza el `<h2>` del título del modal de edición y añade `id="edit-leader-title"`. Añade `aria-label="Cerrar modal"` al botón X del modal de edición.

- [ ] **Step 5: Añadir `role="dialog"` a los modales de confirmación de eliminación (líneas ~889 y ~944)**

Modal de eliminar usuario:

```tsx
<motion.div
  role="dialog"
  aria-modal="true"
  aria-labelledby="delete-user-title"
  ...
>
```

Añade `id="delete-user-title"` al `<h3>` o título dentro del modal de confirmación. Añade `aria-label="Cancelar eliminación"` al botón de cancelar.

Modal de eliminar proyecto (mismo patrón con `id="delete-project-title"`).

- [ ] **Step 6: Commit**

```bash
git add socialmetrictec-frontend/src/pages/AdminPanel.tsx
git commit -m "a11y: add role=dialog, aria-modal, aria-labelledby, Escape handler to AdminPanel modals"
```

---

## Task 10: Home.tsx — contenido y `useReducedMotion`

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/Home.tsx`

- [ ] **Step 1: Importar `useReducedMotion`**

```tsx
import { motion, useReducedMotion } from 'motion/react';
```

- [ ] **Step 2: Usar `useReducedMotion` en el componente**

Al inicio de la función `Home`, después de los estados:

```tsx
const rm = useReducedMotion();
```

- [ ] **Step 3: Aplicar duración 0 cuando `rm` es true en todas las animaciones**

Para cada `<motion.div>` con `transition`, añade la condición:

```tsx
// Ejemplo para el hero
<motion.div 
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: rm ? 0 : 0.8 }}
  className="lg:w-3/5 space-y-8"
>
```

Aplica `transition={{ duration: rm ? 0 : [valor_original] }}` a todos los `motion.*` de la página (hero image, métricas, tarjetas de proyectos destacados, ODS grid).

Para los que usan `whileInView`:

```tsx
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ delay: rm ? 0 : idx * 0.1, duration: rm ? 0 : 0.4 }}
  viewport={{ once: true }}
  ...
>
```

- [ ] **Step 4: Añadir `aria-labelledby` a las secciones y `id` a los encabezados**

```tsx
{/* Hero Section */}
<section aria-labelledby="hero-heading" className="relative overflow-hidden bg-surface py-20 md:py-32 px-6 md:px-12">
  ...
  <h1 id="hero-heading" className="text-5xl md:text-7xl font-extrabold text-primary tracking-tighter leading-tight">
    Construyendo el futuro a través del impacto social
  </h1>
```

```tsx
{/* Metrics Section - no tiene h2, añadir uno visualmente oculto */}
<section aria-labelledby="metrics-heading" className="bg-surface-container py-20 px-6 md:px-12">
  <h2 id="metrics-heading" className="sr-only">Métricas de impacto</h2>
  <div className="max-w-screen-2xl mx-auto grid ...">
```

```tsx
{/* Featured Projects */}
<section aria-labelledby="featured-heading" className="bg-surface py-24 ...">
  ...
  <h2 id="featured-heading" className="text-4xl font-bold text-primary mb-4 tracking-tight">Proyectos Destacados</h2>
```

```tsx
{/* Impact Areas */}
<section aria-labelledby="ods-heading" className="bg-surface-container-low py-24 ...">
  ...
  <h2 id="ods-heading" className="text-3xl md:text-4xl font-bold text-primary tracking-tighter">Áreas de Impacto Estratégico</h2>
```

- [ ] **Step 5: Añadir `aria-label` a los links "Ver Detalles"**

```tsx
<Link
  to={`/project/${project.project_id}`}
  aria-label={`Ver detalles de ${project.project_name}`}
  className="self-start text-primary border-b-2 border-primary pb-1 font-bold hover:text-secondary hover:border-secondary transition-colors"
>
  Ver Detalles
</Link>
```

- [ ] **Step 6: Añadir `aria-label` al link "Crea el primero"**

```tsx
<Link to="/create-project" aria-label="Crear el primer proyecto" className="text-primary font-bold hover:underline">
  Crea el primero
</Link>
```

- [ ] **Step 7: Mejorar el `alt` de la imagen del campus**

```tsx
<img 
  className="w-full h-full object-cover opacity-90" 
  src="https://static.wixstatic.com/media/6f8753_a64ed9907504448d92f14d82543e4811~mv2.gif" 
  alt="Campus del Tecnológico de Monterrey"
  referrerPolicy="no-referrer"
/>
```

- [ ] **Step 8: Commit**

```bash
git add socialmetrictec-frontend/src/pages/Home.tsx
git commit -m "a11y: aria-labelledby sections, aria-label links, alt text, useReducedMotion in Home"
```

---

## Task 11: Directory.tsx — contenido y accesibilidad

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/Directory.tsx`

- [ ] **Step 1: Importar `useReducedMotion`**

```tsx
import { motion, useReducedMotion } from 'motion/react';
```

- [ ] **Step 2: Usar `useReducedMotion` y aplicar en animaciones**

```tsx
const rm = useReducedMotion();
```

En las animaciones de la página (header animations, tarjetas de proyectos):

```tsx
<motion.span
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: rm ? 0 : 0.4 }}
  ...
>
```

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ delay: rm ? 0 : (idx % 3) * 0.1, duration: rm ? 0 : 0.4 }}
  viewport={{ once: true }}
  ...
>
```

- [ ] **Step 3: Añadir `aria-label` al input de búsqueda**

```tsx
<input
  type="search"
  aria-label="Buscar proyectos por nombre o área"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Buscar por nombre, palabra clave o área..."
  className="w-full pl-16 pr-8 py-6 bg-surface-container-lowest border-none shadow-sm rounded-2xl font-body text-lg focus:ring-2 focus:ring-primary transition-all outline-none"
/>
```

Nota: Cambia `type="text"` a `type="search"` para mejor semántica.

- [ ] **Step 4: Añadir `aria-label` a los selects de filtro**

```tsx
<select
  aria-label="Filtrar por estado de actividad"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  ...
>
```

```tsx
<select
  aria-label="Filtrar por área de impacto"
  value={areaFilter}
  onChange={(e) => setAreaFilter(e.target.value)}
  ...
>
```

- [ ] **Step 5: Añadir `role="status"` al spinner de carga**

```tsx
{loading ? (
  <div role="status" aria-label="Cargando proyectos" className="flex justify-center py-24">
    <Loader2 aria-hidden="true" className="w-8 h-8 text-primary animate-spin" />
  </div>
) : (
```

- [ ] **Step 6: Añadir `aria-label` a los links de tarjeta de proyecto**

Las tarjetas de proyecto ya tienen el nombre del proyecto en un `<h3>` dentro del link, lo que lo hace accesible. Sin embargo, para mayor claridad:

```tsx
<Link
  key={project.project_id}
  to={`/project/${project.project_id}`}
  aria-label={`Ver proyecto: ${project.project_name}`}
  className="flex flex-col bg-surface-container-lowest group cursor-pointer tonal-card rounded-2xl p-2"
>
```

- [ ] **Step 7: Añadir `aria-live` al contador de resultados**

```tsx
<div aria-live="polite" aria-atomic="true" className="text-on-surface-variant text-sm font-medium">
  Mostrando <span className="font-bold text-primary">{filteredProjects.length}</span> proyectos
</div>
```

- [ ] **Step 8: Commit**

```bash
git add socialmetrictec-frontend/src/pages/Directory.tsx
git commit -m "a11y: search/filter aria-labels, loader status, results live region, useReducedMotion in Directory"
```

---

## Task 12: ProjectDetail.tsx — contenido accesible

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/ProjectDetail.tsx`

- [ ] **Step 1: Importar `useReducedMotion`**

```tsx
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
```

- [ ] **Step 2: Añadir `role="status"` al spinner de carga**

```tsx
if (loading) {
  return (
    <div role="status" aria-label="Cargando proyecto" className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 aria-hidden="true" className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
```

- [ ] **Step 3: Aplicar `useReducedMotion` en `LeaderCard`**

`LeaderCard` recibe `primaryColor` e `index` como props. Añade `useReducedMotion` dentro del componente:

```tsx
function LeaderCard({ leader, index, primaryColor }: { leader: ProjectLeader; index: number; primaryColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const rm = useReducedMotion();
  const p = leader.profile ?? {};
  // ...
```

Aplica a la animación del artículo:

```tsx
<motion.article
  initial={{ opacity: 0, y: 16 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ delay: rm ? 0 : index * 0.08, duration: rm ? 0 : 0.4, ease: 'easeOut' }}
  ...
>
```

Y al `AnimatePresence` del contenido expandible:

```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
  transition={{ duration: rm ? 0 : 0.25, ease: 'easeOut' }}
  className="overflow-hidden"
>
```

- [ ] **Step 4: Añadir `aria-expanded` al botón "Ver más / Ver menos" de LeaderCard**

```tsx
<button
  onClick={() => setExpanded((v) => !v)}
  aria-expanded={expanded}
  aria-label={expanded ? `Ver menos información de ${leader.username}` : `Ver más información de ${leader.username}`}
  className="mt-5 self-start inline-flex items-center gap-1.5 text-xs font-bold hover:gap-2.5 transition-all"
  style={{ color: primaryColor }}
>
  {expanded ? 'Ver menos' : 'Ver más'}
  <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
</button>
```

- [ ] **Step 5: Añadir `useReducedMotion` a las secciones del proyecto principal**

Al inicio de `ProjectDetail` (no dentro de `LeaderCard`):

```tsx
export default function ProjectDetail() {
  // ... estados existentes ...
  const rm = useReducedMotion();
```

Aplica `transition={{ duration: rm ? 0 : 0.4 }}` a los `motion.div` de beneficiarios, fotos, testimonios e hitos.

- [ ] **Step 6: Commit**

```bash
git add socialmetrictec-frontend/src/pages/ProjectDetail.tsx
git commit -m "a11y: loader status, useReducedMotion, aria-expanded on LeaderCard in ProjectDetail"
```

---

## Task 13: Footer.tsx — landmark accesible

**Files:**
- Modify: `socialmetrictec-frontend/src/components/Footer.tsx`

- [ ] **Step 1: Añadir `aria-label` al footer**

```tsx
export default function Footer() {
  return (
    <footer aria-label="Pie de página" className="w-full py-12 px-6 md:px-12 bg-surface-container border-t border-outline-variant/10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <span className="font-headline font-bold text-primary text-lg">SocialMetricTec</span>
          <span className="font-body text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant">
            © 2026 Instituto Tecnológico de Estudios Superiores de Monterrey
          </span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add socialmetrictec-frontend/src/components/Footer.tsx
git commit -m "a11y: add aria-label to Footer landmark"
```

---

## Task 14: ProjectReport.tsx y NoProjectSelected.tsx

**Files:**
- Modify: `socialmetrictec-frontend/src/pages/ProjectReport.tsx`
- Modify: `socialmetrictec-frontend/src/components/NoProjectSelected.tsx`

- [ ] **Step 1: Añadir `role="status"` al loader de ProjectReport**

```tsx
if (loading) {
  return (
    <div role="status" aria-label="Cargando reporte" className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 aria-hidden="true" className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
```

- [ ] **Step 2: Añadir `aria-hidden` al icono decorativo de NoProjectSelected**

```tsx
<div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center">
  <FolderOpen aria-hidden="true" className="w-10 h-10 text-primary/40" />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add socialmetrictec-frontend/src/pages/ProjectReport.tsx socialmetrictec-frontend/src/components/NoProjectSelected.tsx
git commit -m "a11y: loader status in ProjectReport, aria-hidden decorative icon in NoProjectSelected"
```

---

## Cobertura final de criterios WCAG 2.1 AA

| Criterio | Descripción | Tasks |
|----------|-------------|-------|
| 1.1.1 | Contenido no textual (alt) | 10, 12 |
| 1.3.1 | Información y relaciones (semántica) | 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 |
| 2.1.1 | Teclado | 3, 4, 9 |
| 2.4.1 | Saltar bloques (skip link) | 1 |
| 2.4.6 | Encabezados y etiquetas descriptivos | 2, 10, 11 |
| 3.1.1 | Idioma de la página | 1 |
| 3.3.1 | Identificación de errores | 5, 6, 7, 8, 9 |
| 3.3.2 | Etiquetas o instrucciones | 5, 6, 7, 8, 9 |
| 4.1.2 | Nombre, función, valor (ARIA) | 2, 3, 4, 9, 12 |
| 4.1.3 | Mensajes de estado | 1, 11, 12 |
| 2.3.3 | Animación desde interacciones | 10, 11, 12 |
