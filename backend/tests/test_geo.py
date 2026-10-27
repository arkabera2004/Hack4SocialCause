from dataclasses import dataclass

from app.services.geo import haversine_km, nearest


def test_haversine_known_distance():
    assert abs(haversine_km(0, 0, 0, 1) - 111.19) < 0.1


@dataclass
class Point:
    lat: float
    lng: float


def test_nearest_sorted_and_limited():
    items = [Point(0, 0), Point(0, 5), Point(0, 1), Point(0, 2)]
    result = nearest(0, 0, items, limit=2)
    assert len(result) == 2
    assert result[0][1] is items[0]
    assert result[0][0] <= result[1][0]
