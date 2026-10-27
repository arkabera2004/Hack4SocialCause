# TeestaGuard backend

FastAPI service for village-level flood/GLOF/landslide risk, alerts, and citizen check-ins.

## Run

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env
uvicorn app.main:app --reload --port 8000
# open http://localhost:8000/docs
```

## Test

```bash
pytest -q
```

Tests run against a temporary SQLite database with `WEATHER_MODE=offline`, so no network access is required.
