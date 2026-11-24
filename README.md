# SERTOS Backend

Django REST API for authentication, emergency incidents, hospitals, police operations, notifications, and traffic preemption.

## Requirements

- Python 3.12 or newer
- SQLite for local development
- Optional Google Maps Routes API key

## Local setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Health check: http://127.0.0.1:8000/api/health/

## Environment

```text
DEBUG=True
DB_ENGINE=sqlite
SECRET_KEY=<unique-development-secret>
ALLOWED_HOSTS=127.0.0.1,localhost,testserver
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
DB_ENGINE=sqlite
SQLITE_DB_NAME=db.sqlite3
GOOGLE_MAPS_API_KEY=
```

Never commit real secrets or API keys.

## Tests

```powershell
python manage.py check
python manage.py test --verbosity 1
```
