"""FastAPI app: CORS, routers, static uploads, startup seeding."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import Base, SessionLocal, engine
from app.routers import admin, alerts, citizen, risk, stats, villages
from app.seed import seed_if_empty

VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TeestaGuard API", version=VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = Path(settings.upload_dir)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

app.include_router(villages.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(citizen.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/api/health", tags=["stats"])
def health():
    from app.services import weather as weather_service

    cached = weather_service._cache
    return {
        "status": "ok",
        "weather_source": cached.source if cached else "sample",
        "weather_fetched_at": cached.fetched_at if cached else None,
        "version": VERSION,
    }
