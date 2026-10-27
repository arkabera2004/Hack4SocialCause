def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["weather_source"] in ("live", "sample")


def test_villages_riskpoints_shelters(client):
    for path in ("/api/villages", "/api/riskpoints", "/api/shelters"):
        resp = client.get(path)
        assert resp.status_code == 200
        assert len(resp.json()) > 0


def test_shelters_nearest(client):
    resp = client.get("/api/shelters/nearest", params={"lat": 27.6, "lng": 88.64, "limit": 3})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    assert data[0]["distance_km"] <= data[1]["distance_km"]


def test_risk_list_and_detail(client):
    resp = client.get("/api/risk")
    assert resp.status_code == 200
    rows = resp.json()
    assert len(rows) > 0
    first = rows[0]
    for key in ("village_id", "score", "level", "level_text", "components", "reasons"):
        assert key in first

    detail = client.get(f"/api/risk/{first['village_id']}")
    assert detail.status_code == 200
    assert "rainfall_series" in detail.json()
    assert "nearest_shelters" in detail.json()

    assert client.get("/api/risk/not-a-real-village").status_code == 404


def test_risk_at(client):
    resp = client.get("/api/risk/at", params={"lat": 27.6, "lng": 88.64})
    assert resp.status_code == 200
    assert "distance_to_village_km" in resp.json()


def test_admin_requires_token(client):
    resp = client.post("/api/admin/simulate-surge", json={"gauge_id": "gauge-chungthang", "level_m": 7.5})
    assert resp.status_code == 401

    resp = client.post("/api/admin/reset", json={"clear_activity": False})
    assert resp.status_code == 401


def test_simulate_surge_and_reset(client, admin_headers):
    resp = client.post(
        "/api/admin/simulate-surge",
        json={"gauge_id": "gauge-chungthang", "level_m": 7.5},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    by_id = {r["village_id"]: r for r in resp.json()}
    assert by_id["chungthang"]["level"] == "Severe"

    reset_resp = client.post("/api/admin/reset", json={"clear_activity": False}, headers=admin_headers)
    assert reset_resp.status_code == 200
    after = {r["village_id"]: r for r in client.get("/api/risk").json()}
    assert after["chungthang"]["level"] != "Severe"


def test_checkin_gets_correct_nearest_village(client):
    resp = client.post("/api/checkins", json={"status": "safe", "lat": 27.603, "lng": 88.646})
    assert resp.status_code == 200
    assert resp.json()["village_id"] == "chungthang"

    listed = client.get("/api/checkins").json()
    assert len(listed) == 1


def test_stats(client):
    resp = client.get("/api/stats")
    assert resp.status_code == 200
    body = resp.json()
    for key in ("villages_total", "villages_high", "villages_severe", "alerts_sent"):
        assert key in body
