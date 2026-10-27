"""SQLAlchemy ORM models for TeestaGuard."""
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Village(Base):
    __tablename__ = "villages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    district: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    population_est: Mapped[int] = mapped_column(Integer)
    river_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    slope_class: Mapped[str] = mapped_column(String)


class RiskPoint(Base):
    __tablename__ = "risk_points"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    river_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    hazard: Mapped[float | None] = mapped_column(Float, nullable=True)
    normal_level_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    danger_level_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_level_m: Mapped[float | None] = mapped_column(Float, nullable=True)


class Shelter(Base):
    __tablename__ = "shelters"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    capacity: Mapped[int] = mapped_column(Integer)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    hazard: Mapped[str] = mapped_column(String)
    level: Mapped[str] = mapped_column(String)
    village_ids: Mapped[list] = mapped_column(JSON)
    message_en: Mapped[str] = mapped_column(String)
    message_hi: Mapped[str] = mapped_column(String)
    message_ne: Mapped[str] = mapped_column(String)
    recipients_est: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, default="sent")


class OutboxMessage(Base):
    __tablename__ = "outbox_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[int] = mapped_column(ForeignKey("alerts.id"))
    village_id: Mapped[str] = mapped_column(String)
    language: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="queued")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CheckIn(Base):
    __tablename__ = "checkins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    status: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    village_id: Mapped[str] = mapped_column(String)
    note: Mapped[str | None] = mapped_column(String, nullable=True)


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    kind: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    village_id: Mapped[str] = mapped_column(String)
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
