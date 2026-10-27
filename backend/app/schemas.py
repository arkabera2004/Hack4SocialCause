"""Pydantic v2 request/response models."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Lang = Literal["en", "hi", "ne"]
Hazard = Literal["flood", "glof", "landslide"]
CheckInStatus = Literal["safe", "need_help"]
IncidentKind = Literal["flooding", "landslide", "road_blocked", "other"]


class LangText(BaseModel):
    en: str
    hi: str
    ne: str


class VillageOut(BaseModel):
    id: str
    name: str
    district: str
    lat: float
    lng: float
    population_est: int
    river_km: float | None
    slope_class: str

    model_config = {"from_attributes": True}


class RiskPointOut(BaseModel):
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

    model_config = {"from_attributes": True}


class ShelterOut(BaseModel):
    id: str
    name: str
    kind: str
    lat: float
    lng: float
    capacity: int

    model_config = {"from_attributes": True}


class ShelterWithDistance(ShelterOut):
    distance_km: float


class Reason(BaseModel):
    code: str
    params: dict
    text: LangText


class RiskComponents(BaseModel):
    rain: float
    river: float
    glof: float
    landslide: float


class RiskOut(BaseModel):
    village_id: str
    name: str
    district: str
    lat: float
    lng: float
    population_est: int
    river_km: float | None
    score: int
    level: str
    level_text: LangText
    components: RiskComponents
    reasons: list[Reason]
    rain_24h_mm: float
    rain_72h_mm: float


class RainfallBucket(BaseModel):
    hour_offset: int
    mm: float


class RiskDetailOut(RiskOut):
    rainfall_series: list[RainfallBucket]
    nearest_shelters: list[ShelterWithDistance]


class RiskAtOut(RiskOut):
    distance_to_village_km: float


class AlertPreviewOut(BaseModel):
    en: str
    hi: str
    ne: str
    recipients_est: int
    level: str


class AlertCreate(BaseModel):
    village_ids: list[str]
    hazard: Hazard
    level: str | None = None


class AlertOut(BaseModel):
    id: int
    created_at: datetime
    hazard: str
    level: str
    village_ids: list[str]
    message_en: str
    message_hi: str
    message_ne: str
    recipients_est: int
    status: str

    model_config = {"from_attributes": True}


class ActiveAlertOut(BaseModel):
    id: int
    created_at: datetime
    hazard: str
    level: str
    message: LangText


class CheckInCreate(BaseModel):
    status: CheckInStatus
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    note: str | None = Field(default=None, max_length=280)


class CheckInOut(BaseModel):
    id: int
    created_at: datetime
    status: str
    lat: float
    lng: float
    village_id: str
    village_name: str
    note: str | None

    model_config = {"from_attributes": True}


class IncidentOut(BaseModel):
    id: int
    created_at: datetime
    kind: str
    description: str
    lat: float
    lng: float
    village_id: str
    photo_url: str | None

    model_config = {"from_attributes": True}


class SurgeIn(BaseModel):
    gauge_id: str
    level_m: float


class ResetIn(BaseModel):
    clear_activity: bool = False


class HealthOut(BaseModel):
    status: str
    weather_source: str
    weather_fetched_at: datetime | None
    version: str


class StatsOut(BaseModel):
    villages_total: int
    villages_high: int
    villages_severe: int
    people_at_high_or_severe: int
    alerts_sent: int
    checkins_safe: int
    checkins_need_help: int
    incidents_total: int
    weather_source: str
