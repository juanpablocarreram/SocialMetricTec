# Social Metric Tec — Backend

API REST con FastAPI + MySQL.

## Requisitos

- Python 3.10 o superior
- MySQL 8.0 o superior
- Una cuenta de [Supabase](https://supabase.com) (para el almacenamiento de archivos)

## Setup

### 1. Clonar el repo

```bash
git clone <url-del-repo>
cd socialmetrictec-backend
```

### 2. Crear entorno virtual e instalar dependencias

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

### 3. Crear la base de datos en MySQL

Conéctate a tu instancia de MySQL y crea la base de datos:

```sql
CREATE DATABASE socialmetrictec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Las tablas se crean automáticamente al arrancar la app por primera vez (SQLAlchemy con `create_all`).

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Base de datos
DATABASE_URL=mysql+pymysql://usuario:contraseña@localhost:3306/socialmetrictec

# JWT
SECRET_KEY=una-clave-secreta-larga-y-aleatoria
REFRESH_SECRET_KEY=otra-clave-secreta-diferente
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Usuario root (se crea automáticamente al iniciar)
ROOT_USERNAME=admin
ROOT_EMAIL=admin@ejemplo.com
ROOT_PASSWORD=contraseña-segura

# Supabase Storage
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SUPABASE_BUCKET_NAME=nombre-del-bucket
```

Para generar claves secretas seguras puedes usar:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5. Correr el servidor

```bash
uvicorn main:app --reload
```

La API queda disponible en `http://localhost:8000`.
Documentación interactiva en `http://localhost:8000/docs`.

---

## Estructura del proyecto

```
socialmetrictec-backend/
  main.py          — app FastAPI, CORS, routers
  models/          — modelos SQLAlchemy (ORM)
  schemas/         — schemas Pydantic para request/response
  routes/          — endpoints de la API
  services/        — lógica de negocio, auth, CRUD, storage
  db/database.py   — conexión a MySQL
```
