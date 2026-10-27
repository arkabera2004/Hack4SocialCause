"""Per-village risk endpoints: list, detail, and nearest-to-a-point."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import RiskPoint, Shelter, Village
from app.schemas import RiskAtOut, RiskDetailOut, RiskOut
from app.services import weather
from app.services.geo import haversine_km, nearest
from app.services.risk_engine import LEVEL_TEXT, compute_risk

router = APIRouter(tags=["risk"])


def compute_all_risk(db: Session) -> list[dict]:
    """Compute risk for every village; shared by risk/alerts/stats/citizen routers."""
    villages = db.query(Village).all()
    risk_points = db.query(RiskPoint).all()
    snapshot = weather.get_rainfall(villages)

    results = []
    for v in villages:
        hourly = snapshot.hourly.get(v.id, [0.0] * 72)
        r24 = weather.rain_24h(hourly)
        r72 = weather.rain_72h(hourly)
        result = compute_risk(v, risk_points, r24, r72)
        results.append({
            "village": v,
            "village_id": v.id,
            "name": v.name,
            "district": v.district,
            "lat": v.lat,
            "lng": v.lng,
            "population_est": v.population_est,
            "river_km": v.river_km,
            "score": result.score,
            "level": result.level,
            "level_text": LEVEL_TEXT[result.level],
            "components": result.components,
            "reasons": result.reasons,
            "rain_24h_mm": r24,
            "rain_72h_mm": r72,
            "hourly": hourly,
        })
    results.sort(key=lambda r: r["score"], reverse=True)
    return results


@router.get("/risk", response_model=list[RiskOut])
def get_risk(db: Session = Depends(get_db)):
    return compute_all_risk(db)


@router.get("/risk/at", response_model=RiskAtOut)
def get_risk_at(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    db: Session = Depends(get_db),
):
    villages = db.query(Village).all()
    nearest_result = nearest(lat, lng, villages, limit=1)
    if not nearest_result:
        raise HTTPException(status_code=404, detail="No villages configured")
    distance, village = nearest_result[0]

    all_risk = compute_all_risk(db)
    row = next(r for r in all_risk if r["village_id"] == village.id)
    return {**row, "distance_to_village_km": round(distance, 2)}


@router.get("/risk/{village_id}", response_model=RiskDetailOut)
def get_risk_detail(village_id: str, db: Session = Depends(get_db)):
    all_risk = compute_all_risk(db)
    row = next((r for r in all_risk if r["village_id"] == village_id), None)
    if row is None:
        raise HTTPException(status_code=404, detail="Unknown village")

    shelters = db.query(Shelter).all()
    nearest_shelters = nearest(row["lat"], row["lng"], shelters, limit=3)
    from app.schemas import ShelterOut, ShelterWithDistance

    nearest_out = [
        ShelterWithDistance(**ShelterOut.model_validate(s).model_dump(), distance_km=round(d, 2))
        for d, s in nearest_shelters
    ]

    buckets = weather.six_hour_buckets(row["hourly"])
    return {**row, "rainfall_series": buckets, "nearest_shelters": nearest_out}
