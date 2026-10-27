"""Citizen-facing endpoints: check-ins and incident reports with photo uploads."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import CheckIn, Incident, Village
from app.schemas import CheckInCreate, CheckInOut, IncidentOut
from app.services.geo import nearest

router = APIRouter(tags=["citizen"])

_MAGIC_BYTES = {
    b"\xff\xd8\xff": "jpg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",  # followed by size then "WEBP"; checked more precisely below
}


def _detect_image_ext(header: bytes) -> str | None:
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return "webp"
    return None


def _nearest_village_id(db: Session, lat: float, lng: float) -> str:
    villages = db.query(Village).all()
    if not villages:
        raise HTTPException(status_code=422, detail="No villages configured")
    _, village = nearest(lat, lng, villages, limit=1)[0]
    return village.id


@router.post("/checkins", response_model=CheckInOut)
def create_checkin(body: CheckInCreate, db: Session = Depends(get_db)):
    villages = db.query(Village).all()
    distance_pairs = nearest(body.lat, body.lng, villages, limit=1)
    if not distance_pairs:
        raise HTTPException(status_code=422, detail="No villages configured")
    _, village = distance_pairs[0]

    checkin = CheckIn(status=body.status, lat=body.lat, lng=body.lng, village_id=village.id, note=body.note)
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return CheckInOut(
        id=checkin.id, created_at=checkin.created_at, status=checkin.status,
        lat=checkin.lat, lng=checkin.lng, village_id=village.id, village_name=village.name,
        note=checkin.note,
    )


@router.get("/checkins", response_model=list[CheckInOut])
def list_checkins(limit: int = Query(default=50, ge=1, le=200), db: Session = Depends(get_db)):
    rows = db.query(CheckIn).order_by(CheckIn.created_at.desc()).limit(limit).all()
    villages = {v.id: v.name for v in db.query(Village).all()}
    return [
        CheckInOut(
            id=r.id, created_at=r.created_at, status=r.status, lat=r.lat, lng=r.lng,
            village_id=r.village_id, village_name=villages.get(r.village_id, r.village_id), note=r.note,
        )
        for r in rows
    ]


@router.post("/incidents", response_model=IncidentOut)
async def create_incident(
    kind: str = Form(...),
    description: str = Form(..., max_length=500),
    lat: float = Form(..., ge=-90, le=90),
    lng: float = Form(..., ge=-180, le=180),
    photo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
):
    if kind not in ("flooding", "landslide", "road_blocked", "other"):
        raise HTTPException(status_code=422, detail="Invalid incident kind")

    village_id = _nearest_village_id(db, lat, lng)

    photo_url = None
    if photo is not None:
        contents = await photo.read()
        max_bytes = settings.max_upload_mb * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(status_code=400, detail="Photo too large")
        ext = _detect_image_ext(contents[:16])
        if ext is None:
            raise HTTPException(status_code=400, detail="Unsupported or invalid image file")

        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4()}.{ext}"
        (upload_dir / filename).write_bytes(contents)
        photo_url = f"/uploads/{filename}"

    incident = Incident(kind=kind, description=description, lat=lat, lng=lng, village_id=village_id, photo_url=photo_url)
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/incidents", response_model=list[IncidentOut])
def list_incidents(limit: int = Query(default=50, ge=1, le=200), db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).limit(limit).all()
