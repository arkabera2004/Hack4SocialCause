"""Alert preview, creation, listing and the per-village active-alert lookup."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Alert, OutboxMessage, Shelter, Village
from app.routers.risk import compute_all_risk
from app.schemas import ActiveAlertOut, AlertCreate, AlertOut, AlertPreviewOut
from app.security import require_admin
from app.services.alerts import render_all_languages

router = APIRouter(tags=["alerts"])


def _highest_level(db: Session, village_ids: list[str]) -> str:
    order = {"Low": 0, "Moderate": 1, "High": 2, "Severe": 3}
    all_risk = {r["village_id"]: r["level"] for r in compute_all_risk(db)}
    levels = [all_risk.get(vid, "Low") for vid in village_ids]
    return max(levels, key=lambda lvl: order[lvl]) if levels else "Low"


@router.get("/alerts/preview", response_model=AlertPreviewOut)
def preview_alert(village_ids: str, hazard: str, db: Session = Depends(get_db)):
    ids = village_ids.split(",")
    villages = db.query(Village).filter(Village.id.in_(ids)).all()
    if not villages:
        raise HTTPException(status_code=422, detail="Unknown village")
    shelters = db.query(Shelter).all()
    level = _highest_level(db, ids)

    first_village = next(v for v in villages if v.id == ids[0])
    messages = render_all_languages(first_village, hazard, level, shelters)
    recipients_est = sum(v.population_est for v in villages)
    return {**messages, "recipients_est": recipients_est, "level": level}


@router.post("/alerts", response_model=AlertOut, dependencies=[Depends(require_admin)])
def create_alert(body: AlertCreate, db: Session = Depends(get_db)):
    villages = db.query(Village).filter(Village.id.in_(body.village_ids)).all()
    if len(villages) != len(set(body.village_ids)):
        raise HTTPException(status_code=422, detail="Unknown village")

    shelters = db.query(Shelter).all()
    level = body.level or _highest_level(db, body.village_ids)
    first_village = villages[0]
    first_messages = render_all_languages(first_village, body.hazard, level, shelters)
    recipients_est = sum(v.population_est for v in villages)

    alert = Alert(
        hazard=body.hazard,
        level=level,
        village_ids=body.village_ids,
        message_en=first_messages["en"],
        message_hi=first_messages["hi"],
        message_ne=first_messages["ne"],
        recipients_est=recipients_est,
        status="sent",
    )
    db.add(alert)
    db.flush()

    # shortcut: simulated SMS gateway; a real deployment plugs an SMS/CAP provider in here
    for village in villages:
        messages = render_all_languages(village, body.hazard, level, shelters)
        for lang in ("en", "hi", "ne"):
            db.add(OutboxMessage(
                alert_id=alert.id, village_id=village.id, language=lang,
                body=messages[lang], status="queued",
            ))
    db.flush()
    db.query(OutboxMessage).filter(OutboxMessage.alert_id == alert.id).update({"status": "sent"})
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).limit(50).all()


@router.get("/alerts/active", response_model=list[ActiveAlertOut])
def active_alerts(village_id: str = Query(...), db: Session = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    alerts = db.query(Alert).filter(Alert.created_at >= cutoff).order_by(Alert.created_at.desc()).all()
    village = db.query(Village).filter(Village.id == village_id).first()
    if village is None:
        raise HTTPException(status_code=404, detail="Unknown village")

    shelters = db.query(Shelter).all()
    out = []
    for alert in alerts:
        if village_id not in alert.village_ids:
            continue
        messages = render_all_languages(village, alert.hazard, alert.level, shelters)
        out.append({
            "id": alert.id, "created_at": alert.created_at, "hazard": alert.hazard,
            "level": alert.level, "message": messages,
        })
    return out
