"""Shared pytest fixtures: temp SQLite DB, offline weather, FastAPI TestClient."""
import os

os.environ["WEATHER_MODE"] = "offline"
os.environ["DATABASE_URL"] = "sqlite:///./test_teestaguard.db"
os.environ["UPLOAD_DIR"] = "./test_uploads"

import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import Base, SessionLocal, engine
from app.main import app
from app.seed import seed_if_empty


@pytest.fixture(autouse=True)
def _fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    shutil.rmtree(settings.upload_dir, ignore_errors=True)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin_headers():
    return {"X-Admin-Token": settings.admin_token}


def pytest_sessionfinish(session, exitstatus):
    for p in (Path("test_teestaguard.db"),):
        p.unlink(missing_ok=True)
