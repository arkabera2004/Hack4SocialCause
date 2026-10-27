"""Deterministic, pure-function risk scoring. No DB or HTTP calls inside."""
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.services.geo import haversine_km

_REASONS_PATH = Path(__file__).resolve().parent.parent / "i18n" / "reasons.json"
_REASONS: dict[str, dict[str, str]] = json.loads(_REASONS_PATH.read_text(encoding="utf-8"))

LEVEL_TEXT = {
    "Low": {"en": "Low", "hi": "कम", "ne": "कम"},
    "Moderate": {"en": "Moderate", "hi": "मध्यम", "ne": "मध्यम"},
    "High": {"en": "High", "hi": "उच्च", "ne": "उच्च"},
    "Severe": {"en": "Severe", "hi": "गंभीर", "ne": "गम्भीर"},
}


def clamp(x: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, x))


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


@dataclass
class Reason:
    code: str
    params: dict
    weight: float

    def render(self) -> dict[str, Any]:
        template = _REASONS[self.code]
        text = {lang: template[lang].format(**self.params) for lang in ("en", "hi", "ne")}
        return {"code": self.code, "params": self.params, "text": text}


@dataclass
class RiskResult:
    score: int
    level: str
    components: dict[str, float]
    reasons: list[dict[str, Any]]
    override_applied: bool


def _rain_component(rain_24h: float, rain_72h: float) -> float:
    return clamp((rain_24h / 100) * 60 + (rain_72h / 250) * 40)


def _river_component(village: Any, risk_points: list) -> tuple[float, dict | None]:
    """Returns (river score, the gauge that triggered a surge override, if any)."""
    if village.river_km is None:
        return 0.0, None

    gauges = [rp for rp in risk_points if rp.kind == "river_gauge" and rp.river_km is not None]
    upstream_gauges = [g for g in gauges if g.river_km <= village.river_km]

    base = 0.0
    if upstream_gauges:
        nearest_gauge = max(upstream_gauges, key=lambda g: g.river_km)
        rng = nearest_gauge.danger_level_m - nearest_gauge.normal_level_m
        if rng > 0:
            ratio = (nearest_gauge.current_level_m - nearest_gauge.normal_level_m) / rng
            base = clamp(ratio * 100)

    surge = 0.0
    surge_gauge = None
    for g in upstream_gauges:
        if g.current_level_m is not None and g.danger_level_m is not None and g.current_level_m >= g.danger_level_m:
            d = village.river_km - g.river_km
            if d <= 100:
                candidate = 100 * (1 - (d / 100) * 0.5)
                if candidate > surge:
                    surge = candidate
                    surge_gauge = g

    river = max(base, surge)
    return river, surge_gauge


def _glof_component(village: Any, risk_points: list) -> float:
    if village.river_km is None:
        return 0.0
    lakes = [
        rp for rp in risk_points
        if rp.kind == "glacial_lake" and rp.river_km is not None and rp.river_km <= village.river_km
    ]
    if not lakes:
        return 0.0
    return max(lake.hazard * 100 * clamp01(1 - village.river_km / 200) for lake in lakes)


_SLOPE_BASE = {"low": 15, "medium": 45, "high": 80}


def _landslide_component(village: Any, risk_points: list, rain_24h: float) -> float:
    base = _SLOPE_BASE.get(village.slope_class, 15)
    zones = [rp for rp in risk_points if rp.kind == "landslide_zone"]
    for z in zones:
        if haversine_km(village.lat, village.lng, z.lat, z.lng) <= 10:
            base += z.hazard * 20
    return clamp(base * (0.4 + 0.6 * rain_24h / 100))


def _level_for(score: float) -> str:
    if score < 30:
        return "Low"
    if score < 55:
        return "Moderate"
    if score < 75:
        return "High"
    return "Severe"


def compute_risk(village: Any, risk_points: list, rain_24h: float, rain_72h: float) -> RiskResult:
    """Compute the 0-100 risk score, level and explainable reasons for one village."""
    rain = _rain_component(rain_24h, rain_72h)
    river, surge_gauge = _river_component(village, risk_points)
    glof = _glof_component(village, risk_points)
    landslide = _landslide_component(village, risk_points, rain_24h)

    score = 0.30 * rain + 0.30 * river + 0.20 * glof + 0.20 * landslide

    override_applied = False
    if river >= 60:
        score = max(score, river * 0.85)
        override_applied = True

    score_int = round(clamp(score))
    level = _level_for(score_int)

    reasons: list[Reason] = []
    if override_applied and surge_gauge is not None:
        reasons.append(Reason("surge_upstream", {"gauge": surge_gauge.name}, weight=100))

    weighted = [
        (0.30 * rain, Reason("rain_heavy", {"rain_72h": round(rain_72h, 1)}, weight=0.30 * rain)),
        (0.30 * river, Reason(
            "river_high",
            {
                "gauge": _nearest_gauge_name(village, risk_points),
                "level": round(_nearest_gauge_level(village, risk_points) or 0, 1),
                "danger": round(_nearest_gauge_danger(village, risk_points) or 0, 1),
            },
            weight=0.30 * river,
        )),
        (0.20 * glof, Reason("glof_exposure", _glof_params(village, risk_points), weight=0.20 * glof)),
        (0.20 * landslide, Reason("landslide_slope", {}, weight=0.20 * landslide)),
    ]
    for contribution, reason in weighted:
        if contribution < 5:
            continue
        if reason.code == "river_high" and not _nearest_gauge_name(village, risk_points):
            continue
        if reason.code == "glof_exposure" and not reason.params.get("lake"):
            continue
        if any(r.code == reason.code for r in reasons):
            continue
        reasons.append(reason)

    reasons.sort(key=lambda r: (0 if r.code == "surge_upstream" else 1, -r.weight))
    top_reasons = reasons[:3]
    if not top_reasons:
        top_reasons = [Reason("low_all", {}, weight=0)]

    return RiskResult(
        score=score_int,
        level=level,
        components={"rain": round(rain, 1), "river": round(river, 1), "glof": round(glof, 1), "landslide": round(landslide, 1)},
        reasons=[r.render() for r in top_reasons],
        override_applied=override_applied,
    )


def _nearest_gauge(village: Any, risk_points: list):
    if village.river_km is None:
        return None
    gauges = [rp for rp in risk_points if rp.kind == "river_gauge" and rp.river_km is not None and rp.river_km <= village.river_km]
    if not gauges:
        return None
    return max(gauges, key=lambda g: g.river_km)


def _nearest_gauge_name(village: Any, risk_points: list) -> str:
    g = _nearest_gauge(village, risk_points)
    return g.name if g else ""


def _nearest_gauge_level(village: Any, risk_points: list) -> float | None:
    g = _nearest_gauge(village, risk_points)
    return g.current_level_m if g else None


def _nearest_gauge_danger(village: Any, risk_points: list) -> float | None:
    g = _nearest_gauge(village, risk_points)
    return g.danger_level_m if g else None


def _glof_params(village: Any, risk_points: list) -> dict:
    if village.river_km is None:
        return {"km": 0, "lake": ""}
    lakes = [rp for rp in risk_points if rp.kind == "glacial_lake" and rp.river_km is not None and rp.river_km <= village.river_km]
    if not lakes:
        return {"km": 0, "lake": ""}
    lake = lakes[0]
    return {"km": round(village.river_km - lake.river_km), "lake": lake.name}
