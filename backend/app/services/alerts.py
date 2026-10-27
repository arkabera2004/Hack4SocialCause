"""Alert message rendering and the simulated SMS outbox."""
import json
from pathlib import Path
from typing import Any

from app.services.geo import haversine_km, nearest
from app.services.risk_engine import LEVEL_TEXT

_TEMPLATES_PATH = Path(__file__).resolve().parent.parent / "i18n" / "alerts.json"
_TEMPLATES: dict[str, str] = json.loads(_TEMPLATES_PATH.read_text(encoding="utf-8"))

HAZARD_TEXT = {
    "flood": {"en": "flood", "hi": "बाढ़", "ne": "बाढी"},
    "glof": {"en": "glacial lake outburst flood", "hi": "हिमनद झील बाढ़", "ne": "हिमताल बाढी"},
    "landslide": {"en": "landslide", "hi": "भूस्खलन", "ne": "पहिरो"},
}


def render_message(lang: str, village: Any, hazard: str, level: str, shelters: list) -> str:
    """Render one alert message for one village in one language."""
    nearest_shelter = nearest(village.lat, village.lng, shelters, limit=1)
    if nearest_shelter:
        distance_km, shelter = nearest_shelter[0]
        shelter_name = shelter.name
        distance = round(distance_km, 1)
    else:
        shelter_name = "-"
        distance = 0.0

    return _TEMPLATES[lang].format(
        level=LEVEL_TEXT[level][lang],
        village=village.name,
        hazard=HAZARD_TEXT[hazard][lang],
        shelter=shelter_name,
        distance_km=distance,
    )


def render_all_languages(village: Any, hazard: str, level: str, shelters: list) -> dict[str, str]:
    return {lang: render_message(lang, village, hazard, level, shelters) for lang in ("en", "hi", "ne")}
