import json
from dataclasses import dataclass
from pathlib import Path

import pytest

from app.services.risk_engine import _level_for, compute_risk

SAMPLE_DIR = Path(__file__).resolve().parent.parent.parent / "sample-data"


@dataclass
class V:
    id: str
    name: str
    lat: float
    lng: float
    river_km: float | None
    slope_class: str


@dataclass
class RP:
    id: str
    name: str
    kind: str
    lat: float
    lng: float
    river_km: float | None
    hazard: float | None
    normal_level_m: float | None
    danger_level_m: float | None
    current_level_m: float | None


def load_villages() -> dict[str, V]:
    items = json.loads((SAMPLE_DIR / "villages.json").read_text())["items"]
    return {i["id"]: V(i["id"], i["name"], i["lat"], i["lng"], i["river_km"], i["slope_class"]) for i in items}


def load_risk_points() -> list[RP]:
    items = json.loads((SAMPLE_DIR / "risk_points.json").read_text())["items"]
    return [RP(**i) for i in items]


@pytest.mark.parametrize(
    "score,expected",
    [(29, "Low"), (30, "Moderate"), (54, "Moderate"), (55, "High"), (74, "High"), (75, "Severe")],
)
def test_level_thresholds(score, expected):
    assert _level_for(score) == expected


def test_more_rain_never_lowers_score():
    villages = load_villages()
    risk_points = load_risk_points()
    v = villages["mangan"]
    low = compute_risk(v, risk_points, rain_24h=0, rain_72h=0).score
    high = compute_risk(v, risk_points, rain_24h=50, rain_72h=150).score
    assert high >= low


def test_calm_conditions_low_or_moderate():
    villages = load_villages()
    risk_points = load_risk_points()
    for v in villages.values():
        result = compute_risk(v, risk_points, rain_24h=0, rain_72h=0)
        assert result.level in ("Low", "Moderate")


def test_surge_at_chungthang_propagates_downstream():
    villages = load_villages()
    risk_points = load_risk_points()
    for rp in risk_points:
        if rp.id == "gauge-chungthang":
            rp.current_level_m = 7.5

    chungthang = compute_risk(villages["chungthang"], risk_points, rain_24h=0, rain_72h=0)
    toong = compute_risk(villages["toong"], risk_points, rain_24h=0, rain_72h=0)
    dikchu = compute_risk(villages["dikchu"], risk_points, rain_24h=0, rain_72h=0)
    lachen = compute_risk(villages["lachen"], risk_points, rain_24h=0, rain_72h=0)
    gangtok = compute_risk(villages["gangtok"], risk_points, rain_24h=0, rain_72h=0)

    assert chungthang.level == "Severe"
    assert chungthang.override_applied
    assert chungthang.reasons[0]["code"] == "surge_upstream"
    assert toong.level == "Severe"
    assert dikchu.level in ("High", "Severe")
    assert lachen.level in ("Low", "Moderate")
    assert gangtok.level in ("Low", "Moderate")


def test_every_reason_has_three_languages():
    villages = load_villages()
    risk_points = load_risk_points()
    result = compute_risk(villages["chungthang"], risk_points, rain_24h=10, rain_72h=50)
    for reason in result.reasons:
        assert set(reason["text"].keys()) == {"en", "hi", "ne"}
