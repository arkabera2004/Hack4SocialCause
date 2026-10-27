"""Geo helpers: distance and nearest-N lookups, no DB or HTTP inside."""
import math
from typing import Protocol


class HasLatLng(Protocol):
    lat: float
    lng: float


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in km between two lat/lng points."""
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def nearest(lat: float, lng: float, items: list, limit: int = 3) -> list:
    """Return the `limit` closest items to (lat, lng), each annotated with distance_km."""
    scored = [(haversine_km(lat, lng, it.lat, it.lng), it) for it in items]
    scored.sort(key=lambda t: t[0])
    return scored[:limit]
