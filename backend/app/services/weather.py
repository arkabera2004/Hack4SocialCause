"""Weather data: live Open-Meteo batch fetch with in-memory cache and offline fallback."""
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_FALLBACK_PATH = Path(__file__).resolve().parent.parent.parent / settings.sample_data_dir / "rainfall_fallback.json"


@dataclass
class RainfallSnapshot:
    source: str  # "live" | "sample"
    fetched_at: datetime
    hourly: dict[str, list[float]]


_cache: RainfallSnapshot | None = None


def _load_fallback() -> dict[str, list[float]]:
    data = json.loads(_FALLBACK_PATH.read_text(encoding="utf-8"))
    return data["hourly_mm"]


def _fetch_live(villages: list) -> dict[str, list[float]] | None:
    lats = ",".join(str(v.lat) for v in villages)
    lngs = ",".join(str(v.lng) for v in villages)
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lats}&longitude={lngs}&hourly=precipitation&forecast_days=3&timezone=Asia%2FKolkata"
    )
    try:
        resp = httpx.get(url, timeout=settings.weather_timeout_seconds)
        resp.raise_for_status()
        payload = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Open-Meteo request failed, falling back to sample data: %s", exc)
        return None

    entries = payload if isinstance(payload, list) else [payload]
    if len(entries) != len(villages):
        logger.warning("Open-Meteo returned %d entries for %d villages, falling back", len(entries), len(villages))
        return None

    hourly: dict[str, list[float]] = {}
    for village, entry in zip(villages, entries):
        values = entry.get("hourly", {}).get("precipitation")
        if not values or len(values) < 72:
            logger.warning("Open-Meteo missing precipitation data for %s, falling back", village.id)
            return None
        hourly[village.id] = [float(v) for v in values[:72]]
    return hourly


def get_rainfall(villages: list) -> RainfallSnapshot:
    """Return cached or freshly fetched rainfall; never raises, always falls back cleanly."""
    global _cache
    now = datetime.now(timezone.utc)
    if _cache is not None and now - _cache.fetched_at < timedelta(minutes=settings.weather_cache_minutes):
        return _cache

    if settings.weather_mode == "offline":
        hourly = _load_fallback()
        _cache = RainfallSnapshot(source="sample", fetched_at=now, hourly=hourly)
        return _cache

    hourly = _fetch_live(villages)
    if hourly is None:
        hourly = _load_fallback()
        _cache = RainfallSnapshot(source="sample", fetched_at=now, hourly=hourly)
    else:
        _cache = RainfallSnapshot(source="live", fetched_at=now, hourly=hourly)
    return _cache


def reset_cache() -> None:
    global _cache
    _cache = None


def rain_24h(hourly: list[float]) -> float:
    return round(sum(hourly[:24]), 1)


def rain_72h(hourly: list[float]) -> float:
    return round(sum(hourly[:72]), 1)


def six_hour_buckets(hourly: list[float]) -> list[dict]:
    """12 buckets of 6 hours each, labelled by hour offset (+6h ... +72h)."""
    buckets = []
    for i in range(12):
        chunk = hourly[i * 6:(i + 1) * 6]
        buckets.append({"hour_offset": (i + 1) * 6, "mm": round(sum(chunk), 1)})
    return buckets
