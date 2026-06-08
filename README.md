# SocialMetricTec

Platform for managing social impact projects — metrics, milestones, testimonials, and photo galleries, with PDF report generation.

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Stack

**Backend** — FastAPI 0.136, SQLAlchemy, MySQL 8, JWT auth, Supabase Storage  
**Frontend** — React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7

## Requirements

- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- A [Supabase](https://supabase.com) project (file storage)

## Setup

### Backend

```bash
cd socialmetrictec-backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `socialmetrictec-backend/.env`:

```env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/socialmetrictec
SECRET_KEY=your-secret-key
REFRESH_SECRET_KEY=your-refresh-secret-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-api-key
ROOT_USERNAME=admin
ROOT_EMAIL=admin@example.com
ROOT_PASSWORD=your-admin-password
```

Create the database:

```sql
CREATE DATABASE socialmetrictec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Start the server (tables are created automatically):

```bash
python -m uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

### Frontend

```bash
cd socialmetrictec-frontend
npm install
```

Create `socialmetrictec-frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Project Structure

```
socialmetrictec/
├── socialmetrictec-backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── db/
│   │   ├── database.py
│   │   ├── database_setup.sql
│   │   └── admin_creation.py
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   └── services/
│       ├── auth/
│       ├── crud/
│       └── storage/
└── socialmetrictec-frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── pages/
        ├── components/
        ├── context/
        ├── services/
        └── lib/
```

## Routes

| Path | Description | Auth |
|------|-------------|------|
| `/` | Home | No |
| `/login` | Login | No |
| `/directory` | Project directory | Yes |
| `/admin-panel` | Admin panel | Admin |
| `/project/create` | Create project | Yes |
| `/project/:id` | Project detail | Yes |
| `/project/:id/editor` | Project editor | Yes |
| `/project/:id/report` | PDF report | Yes |
| `/profile` | User profile | Yes |

## License

MIT. See [LICENSE](./LICENSE).

## Authors

Juan Pablo Carrera, Arturo Gutierrez, Diego Sanchez, Shalom Israel Santiago
