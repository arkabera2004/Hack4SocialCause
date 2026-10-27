"""Villages, risk points and shelters read endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import RiskPoint, Shelter, Village
from app.schemas import RiskPointOut, ShelterOut, ShelterWithDistance, VillageOut
from app.services.geo import nearest

router = APIRouter(tags=["villages"])


@router.get("/villages", response_model=list[VillageOut])
def list_villages(db: Session = Depends(get_db)):
    return db.query(Village).all()


@router.get("/riskpoints", response_model=list[RiskPointOut])
def list_risk_points(db: Session = Depends(get_db)):
    return db.query(RiskPoint).all()


@router.get("/shelters", response_model=list[ShelterOut])
def list_shelters(db: Session = Depends(get_db)):
    return db.query(Shelter).all()


@router.get("/shelters/nearest", response_model=list[ShelterWithDistance])
def nearest_shelters(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    limit: int = Query(default=3, ge=1, le=10),
    db: Session = Depends(get_db),
):
    shelters = db.query(Shelter).all()
    results = nearest(lat, lng, shelters, limit=limit)
    return [
        ShelterWithDistance(**ShelterOut.model_validate(s).model_dump(), distance_km=round(d, 2))
        for d, s in results
    ]
