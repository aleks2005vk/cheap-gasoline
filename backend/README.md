# Cheap Gasoline — Backend (FastAPI)

This folder contains a minimal FastAPI backend to support the Cheap Gasoline frontend.

Features
- SQLite or PostgreSQL persistence for stations and price updates (SQLModel)
- Endpoints:
  - GET /api/stations — list stations
  - GET /api/stations/{id} — get station
  - POST /api/auth/register — register a new user
  - POST /api/auth/login — login user (returns JWT token)
  - POST /api/stations — create a station (body: Station JSON)
  - POST /api/stations/{id}/prices — post a price update for a station (requires JWT)
  - POST /api/upload-photo — upload image, run OCR, return parsed text and price candidates

Requirements
- Python 3.10+
- Tesseract OCR binary installed on the host system (Windows: install from https://github.com/UB-Mannheim/tesseract/wiki)
- PostgreSQL 12+ (optional; defaults to SQLite if not configured)

Database Setup

By default, the backend uses SQLite. To use PostgreSQL instead:

1. Ensure PostgreSQL is running and you have a database created:
```sql
CREATE DATABASE cheap_gasoline;
```

2. Set the environment variable before running the backend:
```powershell
$env:BACKEND_DATABASE_URL = "postgresql://postgres:PASSWORD@localhost:5432/cheap_gasoline"
```

Or pass it directly in the command:
```powershell
$env:BACKEND_DATABASE_URL = "postgresql://postgres:PASSWORD@localhost:5432/cheap_gasoline"; python -m uvicorn backend.main:app --reload
```

The backend will auto-create tables on startup using SQLModel.

Setup (Windows PowerShell)

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

Run the server (development)

```powershell
# SQLite (default)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# PostgreSQL (with env var set)
$env:BACKEND_DATABASE_URL = "postgresql://postgres:PASSWORD@localhost:5432/cheap_gasoline"
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Or use npm scripts from project root (already configured):
```powershell
npm run backend:dev
```

Notes
- The OCR relies on the Tesseract binary. If pytesseract raises errors about the tesseract command not found, install the binary and ensure its path is on PATH.
- Uploaded images are stored in `backend/uploads/` by default.
- Auth tokens are JWT and expire after 1 week. Tokens are stored in the frontend's Redux store and localStorage.
- This is a minimal starting point. For production use, add input validation, schema separation, HTTPS, and rate limiting.

Import existing points from the frontend

If you want to import the existing `points.js` dataset into the backend DB, run the exporter + importer (Node + Python):

```powershell
node backend/export_points.cjs > backend/points.json
python backend/import_points.py
```

Or run the importer directly (it runs the Node exporter internally):

```powershell
python backend/import_points.py
```

NPM helper scripts

From the project root you can use npm scripts that call the backend venv python on Windows:

```powershell
# start backend in dev mode (with reload)
npm run backend:dev

# start backend without reload (foreground)
npm run backend:start

# run the importer (calls Node exporter and imports points into SQLite)
npm run backend:import
```

These scripts assume you already created the Python venv at `backend/.venv` and installed requirements (see Setup above). If you didn't, run the Setup steps first.
