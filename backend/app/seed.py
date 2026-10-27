"""Load sample-data/*.json into an empty database."""
import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models import RiskPoint, Shelter, Village


def _sample_path(filename: str) -> Path:
    base = Path(__file__).resolve().parent.parent / settings.sample_data_dir
    return (base / filename).resolve()


def seed_if_empty(db: Session) -> None:
    """Populate villages/risk_points/shelters from sample-data if the DB is empty."""
    if db.query(Village).first() is not None:
        return

    villages = json.loads(_sample_path("villages.json").read_text())["items"]
    for v in villages:
        db.add(Village(**v))

    risk_points = json.loads(_sample_path("risk_points.json").read_text())["items"]
    for rp in risk_points:
        db.add(RiskPoint(**rp))

    shelters = json.loads(_sample_path("shelters.json").read_text())["items"]
    for s in shelters:
        db.add(Shelter(**s))

    db.commit()
