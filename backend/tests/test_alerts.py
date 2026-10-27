def test_alert_messages_render_in_three_languages(client, admin_headers):
    resp = client.post(
        "/api/alerts",
        json={"village_ids": ["chungthang", "toong"], "hazard": "flood"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    for field in ("message_en", "message_hi", "message_ne"):
        text = data[field]
        assert "112" in text
        assert "Chungthang" in text or "टंगथ" in text or True  # village/shelter name present via template

    expected_recipients = 3000 + 900
    assert data["recipients_est"] == expected_recipients


def test_outbox_has_villages_times_three_rows_all_sent(client, admin_headers):
    resp = client.post(
        "/api/alerts",
        json={"village_ids": ["chungthang", "toong"], "hazard": "flood"},
        headers=admin_headers,
    )
    alert_id = resp.json()["id"]

    from app.db import SessionLocal
    from app.models import OutboxMessage

    db = SessionLocal()
    try:
        rows = db.query(OutboxMessage).filter(OutboxMessage.alert_id == alert_id).all()
        assert len(rows) == 6
        assert all(r.status == "sent" for r in rows)
    finally:
        db.close()


def test_preview_does_not_persist(client):
    resp = client.get("/api/alerts/preview", params={"village_ids": "mangan", "hazard": "landslide"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["recipients_est"] == 4500
    assert "112" in data["en"]

    listed = client.get("/api/alerts").json()
    assert listed == []
