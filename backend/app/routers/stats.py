"""Aggregate dashboard stats."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Alert, CheckIn, Incident, Village
from app.routers.risk import compute_all_risk
from app.schemas import StatsOut
from app.services import weather as weather_service

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    all_risk = compute_all_risk(db)
    high_or_severe = [r for r in all_risk if r["level"] in ("High", "Severe")]

    return StatsOut(
        villages_total=db.query(Village).count(),
        villages_high=sum(1 for r in all_risk if r["level"] == "High"),
        villages_severe=sum(1 for r in all_risk if r["level"] == "Severe"),
        people_at_high_or_severe=sum(r["population_est"] for r in high_or_severe),
        alerts_sent=db.query(Alert).count(),
        checkins_safe=db.query(CheckIn).filter(CheckIn.status == "safe").count(),
        checkins_need_help=db.query(CheckIn).filter(CheckIn.status == "need_help").count(),
        incidents_total=db.query(Incident).count(),
        weather_source=weather_service._cache.source if weather_service._cache else "sample",
    )
