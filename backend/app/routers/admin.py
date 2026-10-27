"""Admin-only demo controls: simulate a gauge surge, reset the demo state."""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import Alert, CheckIn, Incident, OutboxMessage, RiskPoint
from app.routers.risk import compute_all_risk
from app.schemas import ResetIn, RiskOut, SurgeIn
from app.security import require_admin

router = APIRouter(tags=["admin"], dependencies=[Depends(require_admin)])

_NORMAL_LEVELS = {
    "gauge-chungthang": 2.0,
    "gauge-dikchu": 2.5,
    "gauge-singtam": 3.0,
    "gauge-rangpo": 3.0,
}


@router.post("/admin/simulate-surge", response_model=list[RiskOut])
def simulate_surge(body: SurgeIn, db: Session = Depends(get_db)):
    gauge = db.query(RiskPoint).filter(RiskPoint.id == body.gauge_id, RiskPoint.kind == "river_gauge").first()
    if gauge is None:
        raise HTTPException(status_code=422, detail="Unknown gauge")
    gauge.current_level_m = body.level_m
    db.commit()
    return compute_all_risk(db)


@router.post("/admin/reset")
def reset_demo(body: ResetIn, db: Session = Depends(get_db)):
    for gauge_id, normal in _NORMAL_LEVELS.items():
        gauge = db.query(RiskPoint).filter(RiskPoint.id == gauge_id).first()
        if gauge:
            gauge.current_level_m = normal
    if body.clear_activity:
        incident_photos = [i.photo_url for i in db.query(Incident).all() if i.photo_url]
        db.query(OutboxMessage).delete()
        db.query(Alert).delete()
        db.query(CheckIn).delete()
        db.query(Incident).delete()
        upload_dir = Path(settings.upload_dir)
        for photo_url in incident_photos:
            (upload_dir / Path(photo_url).name).unlink(missing_ok=True)
    db.commit()
    return {"status": "reset"}
