# SocialMetricTec

> Una plataforma integral para gestionar, rastrear y reportar métricas sociales, proyectos y testimonios con soporte multimedia completo.
ss
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensources.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Tecnológico](#stack-tecnológico)
- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

--- 

## 📖 Descripción

**SocialMetricTec** es una solución full-stack diseñada para una organizacion que necesitaba:

- 📊 Gestionar métricas de impacto social
- 🎯 Administrar proyectos y sus hitos
- 💬 Recopilar testimonios de beneficiarios
- 🖼️ Almacenar y organizar fotogalería
- 📈 Generar reportes detallados

La plataforma proporciona una interfaz intuitiva respaldada por una API REST robusta, con autenticación segura y almacenamiento confiable en la nube.

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.136.1 (Python 3.10+)
- **Base de Datos**: MySQL 8.0+
- **ORM**: SQLAlchemy
- **Autenticación**: JWT (JSON Web Tokens)
- **Almacenamiento**: Supabase Storage
- **API**: REST con Swagger Documentation

### Frontend
- **Framework**: React 19 con TypeScript
- **Bundler**: Vite 6.2
- **Estilos**: Tailwind CSS 4.1 + Tailwind Merge
- **Enrutamiento**: React Router 7.14
- **Componentes**: Lucide React (iconos)
- **Animaciones**: Motion
- **HTTP**: Axios
- **Drag & Drop**: dnd-kit

### Infraestructura
- **Control de Versión**: Git
- **Gestión de Dependencias**: pip (Python), npm (Node.js)

---

## ✨ Características

### 👥 Gestión de Usuarios
- Registro e inicio de sesión con JWT
- Perfiles de usuario personalizables
- Autenticación segura con refresh tokens

### 🏗️ Administración de Proyectos
- Crear, editar y eliminar proyectos
- Organizar proyectos por estados
- Vista previa de listado de proyectos
- Asignación de hitos y métricas

### 📊 Métricas e Indicadores
- Definir métricas personalizadas por proyecto
- Rastrear valores de métricas en el tiempo
- Visualización de evolución de indicadores

### 🎯 Hitos (Milestones)
- Crear hitos para proyectos
- Monitorear progreso hacia objetivos
- Fechas y descripción de hitos

### 💬 Testimonios
- Recopilar testimonios de beneficiarios
- Exportar testimonios (PDF, CSV)
- Editor visual con bloques de contenido

### 🖼️ Galería Multimedia
- Subir y gestionar fotos
- Almacenamiento en Supabase
- Organización por proyecto

---

## 📦 Requisitos Previos

### Mínimos del Sistema

| Componente | Versión Recomendada |
|------------|-------------------|
| Python | 3.10+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| Git | 2.0+ |

### Cuentas Externas

- 🔑 [Supabase](https://supabase.com) - Para almacenamiento de archivos

---

## 🚀 Instalación

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/juanpablocarreram/SocialMetricTec.git
cd socialmetrictec
```

### 2️⃣ Configurar Backend

#### Crear Entorno Virtual
```bash
cd socialmetrictec-backend

# Linux / macOS
python -m venv venv
source venv/bin/activate

# Windows
# python -m venv venv
# venv\Scripts\activate
```

#### Instalar Dependencias
```bash
pip install -r requirements.txt
```

#### Configurar Base de Datos
```bash
# Crear base de datos en MySQL
mysql -u root -p
```

```sql
CREATE DATABASE socialmetrictec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Variables de Entorno
Crear archivo `.env` en `socialmetrictec-backend/`:

```env
# Base de Datos
DATABASE_URL=mysql+pymysql://usuario:contraseña@localhost:3306/socialmetrictec

# JWT
SECRET_KEY=tu-clave-secreta-larga-y-aleatoria
REFRESH_SECRET_KEY=otra-clave-secreta-diferente

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-api-key

# Admin
ROOT_USERNAME=admin
ROOT_EMAIL=admin@socialmetrictec.com
ROOT_PASSWORD=contraseña-segura
```

#### Iniciar Backend
```bash
# Las tablas se crean automáticamente
python -m uvicorn main:app --reload --port 8000
```

📝 **API Docs**: http://localhost:8000/docs

---

### 3️⃣ Configurar Frontend

#### Instalar Dependencias
```bash
cd socialmetrictec-frontend
npm install
```

#### Variables de Entorno
Crear archivo `.env` en `socialmetrictec-frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

#### Iniciar Desarrollo
```bash
npm run dev
```

🌐 **Aplicación**: http://localhost:5173

---

## 📁 Estructura del Proyecto

```
socialmetrictec/
├── socialmetrictec-backend/          # API REST
│   ├── main.py                       # Entrada principal
│   ├── requirements.txt              # Dependencias Python
│   ├── .env                          # Configuración (no versionar)
│   ├── db/                           # Scripts de base de datos
│   │   ├── database.py               # Configuración SQLAlchemy
│   │   ├── database_setup.sql        # Esquema de tablas
│   │   └── admin_creation.py         # Script creación admin
│   ├── models/                       # Modelos SQLAlchemy
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── metric.py
│   │   ├── milestone.py
│   │   ├── photo.py
│   │   ├── testimony.py
│   │   └── export_log.py
│   ├── routes/                       # Endpoints de la API
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── metric.py
│   │   ├── milestone.py
│   │   ├── photo.py
│   │   ├── testimony.py
│   │   └── deps.py                   # Dependencias compartidas
│   ├── schemas/                      # Pydantic schemas de validación
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── metric.py
│   │   ├── milestone.py
│   │   ├── photo.py
│   │   ├── testimony.py
│   │   ├── media.py
│   │   ├── page.py
│   │   ├── token.py
│   │   └── export_log.py
│   ├── services/                     # Lógica de negocio
│   │   ├── auth/
│   │   │   ├── auth_service.py
│   │   │   └── security.py           # Hashing, JWT
│   │   ├── crud/                     # Operaciones CRUD
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── metric.py
│   │   │   ├── milestone.py
│   │   │   ├── photo.py
│   │   │   ├── testimony.py
│   │   │   └── export_log.py
│   │   └── storage/
│   │       └── supabase_storage.py   # Integración Supabase
│   ├── tests/                        # Tests unitarios
│   │   ├── project/
│   │   ├── user/
│   │   └── __init__.py
│   └── docs/
│       ├── DATABASE.md
│       └── DEPENDENCIES.md
│
├── socialmetrictec-frontend/         # Aplicación React
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env                          # Configuración (no versionar)
│   ├── src/
│   │   ├── main.tsx                  # Entry point
│   │   ├── App.tsx                   # Router principal
│   │   ├── index.css                 # Estilos globales
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── Directory.tsx
│   │   │   ├── CreateProject.tsx
│   │   │   ├── Editor.tsx            # Editor de proyectos
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── ProjectReport.tsx
│   │   │   └── TestimonyForm.tsx
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── BlockRenderer.tsx
│   │   │   ├── MediaUploader.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   ├── ProjectTimeline.tsx
│   │   │   ├── NoProjectSelected.tsx
│   │   │   └── managers/             # Managers especializados
│   │   │       ├── MetricsManager.tsx
│   │   │       ├── MilestonesManager.tsx
│   │   │       ├── PhotosManager.tsx
│   │   │       ├── TestimoniesManager.tsx
│   │   │       └── ReportButton.tsx
│   │   ├── context/                  # React Context API
│   │   │   ├── AuthContext.jsx
│   │   │   └── ProjectContext.tsx
│   │   ├── services/                 # Servicios de API
│   │   │   ├── userService.ts
│   │   │   ├── projectService.ts
│   │   │   ├── metricService.ts
│   │   │   ├── milestoneService.ts
│   │   │   ├── photoService.ts
│   │   │   ├── testimonyService.ts
│   │   │   ├── pageService.ts
│   │   │   └── mediaService.ts
│   │   └── lib/
│   │       ├── axios.js              # Cliente HTTP configurado
│   │       └── utils.ts              # Utilidades comunes
│   └── public/
│       └── sdg/                      # Recursos estáticos
│
└── README.md                         # Este archivo
```

---

## 📚 Documentación

Documentación detallada disponible en:

- **Backend**: Consulta [socialmetrictec-backend/README.md](./socialmetrictec-backend/README.md)
  - 📖 [Documentación de Base de Datos](./socialmetrictec-backend/docs/DATABASE.md)
  - 📦 [Dependencias](./socialmetrictec-backend/docs/DEPENDENCIES.md)
  - 🔌 [API Swagger](http://localhost:8000/docs) (cuando el servidor está activo)

- **Frontend**: Consulta [socialmetrictec-frontend/README.md](./socialmetrictec-frontend/README.md)

---

## 🚦 Ejecutar en Desarrollo

### Terminal 1 - Backend
```bash
cd socialmetrictec-backend
source venv/bin/activate  # o en Windows: venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd socialmetrictec-frontend
npm run dev
```

**Estado de verificación:**
- ✅ Backend API: http://localhost:8000
- ✅ Frontend App: http://localhost:5173
- ✅ API Docs: http://localhost:8000/docs

---

## 🏗️ Build para Producción

### Backend
```bash
cd socialmetrictec-backend
pip install -r requirements.txt
# Ejecutar con Gunicorn o similar en servidor
```

### Frontend
```bash
cd socialmetrictec-frontend
npm run build
# El contenido está en 'dist/' listo para servir
npm run preview  # Ver preview local
```

---

## 🧪 Testing

### Backend
```bash
cd socialmetrictec-backend
# Ejecutar tests
pytest
```

### Frontend
```bash
cd socialmetrictec-frontend
npm run lint  # Verificar tipos TypeScript
```

---

## 🔐 Seguridad

- ✅ JWT con access y refresh tokens
- ✅ Contraseñas hasheadas con bcrypt
- ✅ CORS configurado en backend
- ✅ Validación de entrada con Pydantic
- ✅ Variables sensibles en `.env`

⚠️ **Importante**: No versiones archivos `.env`. Usa `.env.example` como referencia.

---

## 📋 Rutas Principales Frontend

| Ruta | Descripción | Requiere Autenticación |
|------|-------------|------------------------|
| `/` | Página de inicio | No |
| `/login` | Iniciar sesión | No |
| `/directory` | Directorio de proyectos | Sí |
| `/admin-panel` | Panel de administración | Sí (Admin) |
| `/project/create` | Crear nuevo proyecto | Sí |
| `/project/:id` | Detalle de proyecto | Sí |
| `/project/:id/editor` | Editor de proyecto | Sí |
| `/project/:id/report` | Generar reporte | Sí |
| `/profile` | Perfil de usuario | Sí |

---

## 🔌 Endpoints Principales Backend

### Usuarios
- `POST /users/register` - Registrarse
- `POST /users/login` - Iniciar sesión
- `GET /users/me` - Perfil actual
- `GET /users/{user_id}` - Perfil de usuario

### Proyectos
- `GET /projects/` - Listar proyectos
- `POST /projects/` - Crear proyecto
- `GET /projects/{project_id}` - Detalle del proyecto
- `PUT /projects/{project_id}` - Actualizar proyecto
- `DELETE /projects/{project_id}` - Eliminar proyecto

### Métricas
- `GET /metrics/` - Listar métricas
- `POST /metrics/` - Crear métrica
- `GET /metrics/{metric_id}` - Detalle de métrica
- `PUT /metrics/{metric_id}` - Actualizar métrica
- `DELETE /metrics/{metric_id}` - Eliminar métrica

### Testimonios
- `GET /testimonies/` - Listar testimonios
- `POST /testimonies/` - Crear testimonio
- `GET /testimonies/export` - Exportar testimonios

Documentación completa en: http://localhost:8000/docs

---


## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

## 📞 Contacto

**Desarrolladores**: [Juan Pablo Carrera, Arturo Gutierrez, Diego Sanchez, Shalom Israel Santiago]

Para preguntas o sugerencias, abre un issue en el repositorio.

---

## 🎯 Roadmap

- [ ] Añadir autenticación de dos factores (2FA)
- [ ] Integración con redes sociales
- [ ] Dashboard con gráficos más avanzados
- [ ] Exportación a múltiples formatos
- [ ] Notificaciones en tiempo real
- [ ] Soporte multiidioma

---

## 🙏 Agradecimientos

- [FastAPI](https://fastapi.tiangolo.com/) - Web framework moderno
- [React](https://react.dev/) - Biblioteca UI
- [Tailwind CSS](https://tailwindcss.com/) - Utilidades de estilos
- [Supabase](https://supabase.com/) - Backend y almacenamiento
- [SQLAlchemy](https://www.sqlalchemy.org/) - ORM para Python

---

**Última actualización**: Junio 2026

