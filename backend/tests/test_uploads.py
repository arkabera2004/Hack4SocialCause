import io

TINY_PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108020000009077"
    "53de0000000c4944415408d763f8ffff3f0005fe02fea74d6c4e0000000049454e44ae426082"
)


def test_valid_png_accepted(client):
    resp = client.post(
        "/api/incidents",
        data={"kind": "flooding", "description": "Water on road", "lat": "27.6", "lng": "88.64"},
        files={"photo": ("photo.png", io.BytesIO(TINY_PNG), "image/png")},
    )
    assert resp.status_code == 200
    assert resp.json()["photo_url"].endswith(".png")


def test_text_file_renamed_png_rejected(client):
    resp = client.post(
        "/api/incidents",
        data={"kind": "other", "description": "fake", "lat": "27.6", "lng": "88.64"},
        files={"photo": ("photo.png", io.BytesIO(b"not an image"), "image/png")},
    )
    assert resp.status_code == 400


def test_oversize_file_rejected(client):
    big = b"\x89PNG\r\n\x1a\n" + b"0" * (6 * 1024 * 1024)
    resp = client.post(
        "/api/incidents",
        data={"kind": "other", "description": "big", "lat": "27.6", "lng": "88.64"},
        files={"photo": ("photo.png", io.BytesIO(big), "image/png")},
    )
    assert resp.status_code == 400
