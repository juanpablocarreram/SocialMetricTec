# Social Metric Tec — Frontend

Interfaz web con React 19 + TypeScript + Vite + Tailwind CSS.

## Requisitos

- Node.js 18 o superior ([descargar aquí](https://nodejs.org))
- El backend corriendo (ver `socialmetrictec-backend/README.md`)

## Setup

### 1. Clonar el repo

```bash
git clone <url-del-repo>
cd socialmetrictec-frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000
```

Cambia la URL si el backend corre en otro puerto o host.

### 4. Correr la app

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Página de inicio |
| `/login` | Iniciar sesión |
| `/directory` | Directorio de proyectos |
| `/create-project` | Crear nuevo proyecto |
| `/editor/:id` | Editor de bloques del proyecto |
| `/dashboard/:id` | Dashboard de métricas |
| `/project/:id` | Vista pública del proyecto |
| `/admin` | Panel de administración (solo admins) |
