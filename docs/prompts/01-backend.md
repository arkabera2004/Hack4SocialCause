# TeestaGuard — Prompt 1 of 3: Backend

Run this in Claude Code from the ROOT of the `teestaguard` git repository. Build everything below, then run the tests and fix failures before you stop. Commit in small steps. Do not push unless I ask.

---

## 1. Context — why this exists and how it is judged

TeestaGuard is our entry for **Hack for Social Cause 2027** (Government of India, Ministry of Youth Affairs & Sports; IIT Bombay is knowledge partner). Theme: **Disaster Mitigation & Resilience**, State: **Sikkim**.

**The problem.** On the night of 3–4 October 2023, South Lhonak glacial lake in North Sikkim burst. The flood destroyed the 1,200 MW Teesta III dam at Chungthang and ran down the Teesta into West Bengal. The Government of Sikkim reported 46 deaths, 77+ missing and 88,400 people affected. The lake's early-warning system was still being installed. Sikkim now monitors its 16 high-risk lakes with sensors, but the **last mile** is missing: data is not turned into a risk level per village, alerts must reach people in Nepali/Hindi within minutes, and responders cannot see who is safe.

**What TeestaGuard does.** An authority dashboard (village risk map, plain-language reasons, one-click alerts in English/Hindi/Nepali, live check-ins) plus a citizen web app (my risk in my language, "I'm safe"/"Need help", nearest shelters, photo incident reports). Our presentation deck already promises exactly these features — build all of them, nothing more.

**The jury scores:** relevance, technical strength (code quality, architecture, scalability), functionality (working prototype), creativity, social impact, presentation, teamwork. The repo is public and judges will read the code.

**Priorities, in order:**
1. Runs first time from a fresh clone by following the README.
2. The demo never breaks: works fully offline with bundled sample data.
3. Clean, typed, tested, readable code with an obvious structure.

**Do NOT add:** Docker, user accounts/login system, message queues, Celery, Redis, Alembic, websockets, any paid API, any ML model. Keep it small and solid.

---

## 2. Repository layout (this prompt creates `backend/` and `sample-data/` only)

```
teestaguard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, CORS, routers, static /uploads, startup seeding
│   │   ├── config.py            # Settings via pydantic-settings, read from .env
│   │   ├── db.py                # SQLAlchemy engine, SessionLocal, Base, get_db dependency
│   │   ├── models.py            # ORM models (section 5)
│   │   ├── schemas.py           # Pydantic v2 request/response models
│   │   ├── security.py          # require_admin dependency (X-Admin-Token header)
│   │   ├── seed.py              # loads sample-data/*.json into an empty DB
│   │   ├── routers/
│   │   │   ├── villages.py      # villages, risk points, shelters
│   │   │   ├── risk.py
│   │   │   ├── alerts.py
│   │   │   ├── citizen.py       # check-ins, incidents
│   │   │   ├── admin.py         # simulate surge, reset
│   │   │   └── stats.py
│   │   ├── services/
│   │   │   ├── geo.py           # haversine, nearest-N helpers
│   │   │   ├── weather.py       # Open-Meteo client + cache + offline fallback
│   │   │   ├── risk_engine.py   # pure functions, no DB or HTTP inside
│   │   │   └── alerts.py        # message rendering + outbox
│   │   └── i18n/
│   │       ├── alerts.json      # EN/HI/NE alert templates (section 8)
│   │       └── reasons.json     # EN/HI/NE reason templates (section 7)
│   ├── tests/
│   │   ├── conftest.py          # temp SQLite DB, WEATHER_MODE=offline, TestClient
│   │   ├── test_geo.py
│   │   ├── test_risk_engine.py
│   │   ├── test_alerts.py
│   │   ├── test_api.py
│   │   └── test_uploads.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md                # short: how to run the backend and tests
└── sample-data/
    ├── villages.json
    ├── risk_points.json
    ├── shelters.json
    └── rainfall_fallback.json
```

Also add/extend a root `.gitignore`: `.venv/`, `__pycache__/`, `*.db`, `backend/uploads/`, `.env`, `.pytest_cache/`.

---

## 3. Tech stack

Python 3.11+. `requirements.txt` (use `>=` lower bounds, nothing else):
`fastapi`, `uvicorn[standard]`, `sqlalchemy>=2.0`, `pydantic>=2`, `pydantic-settings`, `httpx`, `python-multipart`, `pytest`.

Type hints everywhere. Docstrings on every service function (one or two lines: what and why). No commented-out code.

---

## 4. Configuration — `backend/.env.example`

```
DATABASE_URL=sqlite:///./teestaguard.db
WEATHER_MODE=live            # live | offline  (offline = always use sample-data/rainfall_fallback.json)
WEATHER_CACHE_MINUTES=30
WEATHER_TIMEOUT_SECONDS=8
ADMIN_TOKEN=change-me-demo   # required in X-Admin-Token for alerts and admin routes
CORS_ORIGINS=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5
SAMPLE_DATA_DIR=../sample-data
```

`config.py` loads these with sensible defaults so the app runs even without a `.env`.

---

## 5. Data model (SQLAlchemy 2.0 typed `Mapped[...]` style)

- **Village**: `id` (str slug, PK), `name`, `district`, `lat`, `lng`, `population_est` (int, illustrative), `river_km` (float | None — km downstream of South Lhonak lake along the Teesta; None = not on the main river), `slope_class` ("low" | "medium" | "high").
- **RiskPoint**: `id` (str slug), `name`, `kind` ("glacial_lake" | "river_gauge" | "landslide_zone"), `lat`, `lng`, `river_km` (float | None), `hazard` (float 0–1, lakes and landslide zones), `normal_level_m`, `danger_level_m`, `current_level_m` (floats, gauges only, else None).
- **Shelter**: `id`, `name`, `kind` ("school" | "community_hall" | "monastery" | "govt_building"), `lat`, `lng`, `capacity` (int).
- **Alert**: `id` (int PK), `created_at` (UTC), `hazard` ("flood" | "glof" | "landslide"), `level`, `village_ids` (JSON list), `message_en`, `message_hi`, `message_ne`, `recipients_est` (int), `status` ("sent").
- **OutboxMessage** (simulated SMS): `id`, `alert_id` (FK), `village_id`, `language` ("en" | "hi" | "ne"), `body`, `status` ("queued" → "sent"), `created_at`.
- **CheckIn**: `id`, `created_at`, `status` ("safe" | "need_help"), `lat`, `lng`, `village_id` (nearest village, computed server-side), `note` (≤ 280 chars, optional).
- **Incident**: `id`, `created_at`, `kind` ("flooding" | "landslide" | "road_blocked" | "other"), `description` (≤ 500 chars), `lat`, `lng`, `village_id` (nearest, computed), `photo_url` (str | None).

Create tables on startup (`Base.metadata.create_all`), then seed if the villages table is empty.

---

## 6. Sample data — write these JSON files

Every file has a top-level object: `{"note": "Approximate sample data for a hackathon prototype. Verify before real use.", "items": [...]}`.

### `villages.json` (coordinates and river_km are approximate; population is an illustrative estimate)

| id | name | district | lat | lng | river_km | slope | population_est |
|---|---|---|---|---|---|---|---|
| lachen | Lachen | Mangan | 27.716 | 88.556 | 35 | high | 1500 |
| lachung | Lachung | Mangan | 27.690 | 88.745 | null | high | 2000 |
| chungthang | Chungthang | Mangan | 27.603 | 88.646 | 65 | high | 3000 |
| toong | Toong | Mangan | 27.575 | 88.605 | 72 | high | 900 |
| singhik | Singhik | Mangan | 27.540 | 88.555 | 78 | high | 800 |
| mangan | Mangan | Mangan | 27.509 | 88.529 | 85 | medium | 4500 |
| dikchu | Dikchu | Gangtok | 27.400 | 88.520 | 110 | medium | 2500 |
| singtam | Singtam | Gangtok | 27.234 | 88.497 | 135 | medium | 6000 |
| rangpo | Rangpo | Pakyong | 27.177 | 88.531 | 150 | low | 8000 |
| melli | Melli | Namchi | 27.093 | 88.452 | 165 | low | 4000 |
| teesta-bazar | Teesta Bazar (WB) | Kalimpong | 27.068 | 88.433 | 175 | low | 3000 |
| gangtok | Gangtok | Gangtok | 27.330 | 88.612 | null | medium | 100000 |
| pakyong | Pakyong | Pakyong | 27.236 | 88.590 | null | medium | 4000 |
| namchi | Namchi | Namchi | 27.165 | 88.364 | null | medium | 13000 |

### `risk_points.json`

| id | name | kind | lat | lng | river_km | hazard | normal / danger / current (m) |
|---|---|---|---|---|---|---|---|
| south-lhonak | South Lhonak Lake | glacial_lake | 27.912 | 88.198 | 0 | 0.9 | – |
| gauge-chungthang | Chungthang gauge | river_gauge | 27.600 | 88.643 | 65 | – | 2.0 / 6.0 / 2.0 |
| gauge-dikchu | Dikchu gauge | river_gauge | 27.398 | 88.518 | 110 | – | 2.5 / 7.0 / 2.5 |
| gauge-singtam | Singtam gauge | river_gauge | 27.232 | 88.495 | 135 | – | 3.0 / 8.0 / 3.0 |
| gauge-rangpo | Rangpo gauge | river_gauge | 27.175 | 88.529 | 150 | – | 3.0 / 8.5 / 3.0 |
| slide-toong-mangan | Toong–Mangan slide zone | landslide_zone | 27.555 | 88.580 | null | 0.8 | – |
| slide-lachung-road | Lachung road slide zone | landslide_zone | 27.660 | 88.700 | null | 0.7 | – |
| slide-nh10-rangpo | NH10 Rangpo–Singtam zone | landslide_zone | 27.205 | 88.512 | null | 0.7 | – |

Gauge readings are simulated (no public live feed is used).

### `shelters.json`
Create one or two shelters near each village (about 0.005–0.015° away, uphill-ish), 18 to 22 in total, mixed kinds, capacity 100–800. Name pattern: `"<Place> Govt. School (sample)"`, `"<Place> Community Hall (sample)"`, `"<Place> Monastery (sample)"`. The "(sample)" suffix is mandatory — these are not verified real shelters.

### `rainfall_fallback.json`
`{"note": ..., "generated_for": "demo", "hourly_mm": {"<village_id>": [72 floats], ...}}` — 72 hourly values per village. Generate once with a small deterministic script (seeded random), commit only the JSON (not the script). Shape: mostly 0–3 mm/h; northern villages (lachen, lachung, chungthang, toong, singhik, mangan) get a heavier band of 6–12 mm/h between hours 18 and 36 so the 72-hour total is roughly 120–180 mm there and 20–60 mm elsewhere. Values rounded to 1 decimal.

---

## 7. Risk engine — `services/risk_engine.py` (pure functions, fully deterministic)

Inputs per village: `rain_24h`, `rain_72h` (mm), the village, all risk points. Output:
`RiskResult(score: int 0–100, level: str, components: {rain, river, glof, landslide} each 0–100, reasons: list[Reason], override_applied: bool)`.

Use `clamp(x, 0, 100)` everywhere.

1. **rain** = clamp( (rain_24h / 100) × 60 + (rain_72h / 250) × 40 )
2. **river** (only villages with `river_km`; others 0):
   - Find gauges with `river_km ≤ village.river_km`; take the most downstream one (largest `river_km`).
   - ratio = (current − normal) / (danger − normal); base = clamp(ratio × 100).
   - **Surge propagation:** for every gauge with `current ≥ danger` and `gauge.river_km ≤ village.river_km`, let d = village.river_km − gauge.river_km. If d ≤ 100: surge = 100 × (1 − (d / 100) × 0.5). river = max(base, surge).
3. **glof** (only villages with `river_km`): for each glacial lake upstream (`lake.river_km ≤ village.river_km`): lake.hazard × 100 × clamp01(1 − village.river_km / 200). Take the max.
4. **landslide**: slope base low=15, medium=45, high=80. Add `hazard × 20` for each landslide zone within 10 km (haversine). Multiply by (0.4 + 0.6 × rain / 100). Clamp.
5. **score** = 0.30·rain + 0.30·river + 0.20·glof + 0.20·landslide.
6. **Imminent-flood override:** if river ≥ 60, score = max(score, river × 0.85) and `override_applied = True`.
   (Worked check, surge 7.5 m at Chungthang: Chungthang/Toong/Singhik/Mangan → Severe, Dikchu/Singtam → High, Rangpo → Low or Moderate (score rises but stays below High), Teesta Bazar unaffected. Use this as a test.)
7. **level**: score < 30 → "Low"; < 55 → "Moderate"; < 75 → "High"; else "Severe". Round score to int.

**Reasons** (top 3 by weighted contribution; if override applied, `surge_upstream` comes first). Each reason is `{"code": str, "params": dict, "text": {"en": str, "hi": str, "ne": str}}`, rendered from `i18n/reasons.json`. Include a reason only if its weighted contribution ≥ 5 points. If none qualify, return the single reason `low_all`.

`i18n/reasons.json` (use exactly these; a native speaker will review later):

```json
{
  "rain_heavy": {
    "en": "Heavy rain forecast: {rain_72h} mm in the next 72 hours",
    "hi": "भारी बारिश का पूर्वानुमान: अगले 72 घंटों में {rain_72h} मिमी",
    "ne": "भारी वर्षाको पूर्वानुमान: अर्को 72 घण्टामा {rain_72h} मि.मी."
  },
  "river_high": {
    "en": "River at {gauge} is {level} m (danger level {danger} m)",
    "hi": "{gauge} पर नदी का स्तर {level} मीटर है (खतरे का स्तर {danger} मीटर)",
    "ne": "{gauge} मा नदीको सतह {level} मिटर छ (खतराको सतह {danger} मिटर)"
  },
  "surge_upstream": {
    "en": "Flood surge detected upstream at {gauge}",
    "hi": "{gauge} पर ऊपर की ओर बाढ़ की लहर दर्ज",
    "ne": "माथि {gauge} मा बाढीको छाल देखियो"
  },
  "glof_exposure": {
    "en": "{km} km downstream of {lake}, a high-risk glacial lake",
    "hi": "{lake} (उच्च जोखिम वाली हिमनद झील) से {km} किमी नीचे",
    "ne": "{lake} (उच्च जोखिमयुक्त हिमताल) बाट {km} कि.मी. तल"
  },
  "landslide_slope": {
    "en": "Steep slopes with a known landslide zone nearby",
    "hi": "खड़ी ढलान और पास में भूस्खलन-संभावित क्षेत्र",
    "ne": "भिरालो जमिन र नजिकै पहिरो जाने क्षेत्र"
  },
  "low_all": {
    "en": "No major hazard signals right now",
    "hi": "अभी कोई बड़ा खतरा संकेत नहीं",
    "ne": "अहिले कुनै ठूलो खतराको संकेत छैन"
  }
}
```

Level names translated (used in reasons, alerts and API `level_text`):
`Low/Moderate/High/Severe` → hi `कम/मध्यम/उच्च/गंभीर`, ne `कम/मध्यम/उच्च/गम्भीर`.

---

## 8. Alerts — `services/alerts.py` and `i18n/alerts.json`

Templates (hazard words: flood → बाढ़ / बाढी, glof → हिमनद झील बाढ़ / हिमताल बाढी, landslide → भूस्खलन / पहिरो):

```json
{
  "en": "TeestaGuard ALERT ({level}) for {village}: {hazard} risk is {level}. Move to higher ground now. Nearest shelter: {shelter} ({distance_km} km). Emergency: 112.",
  "hi": "TeestaGuard चेतावनी ({level}) – {village}: {hazard} का खतरा {level} है। तुरंत ऊँचे स्थान पर जाएँ। निकटतम आश्रय: {shelter} ({distance_km} किमी)। आपातकालीन नंबर: 112।",
  "ne": "TeestaGuard चेतावनी ({level}) – {village}: {hazard} को जोखिम {level} छ। तुरुन्तै अग्लो ठाउँमा जानुहोस्। नजिकको आश्रयस्थल: {shelter} ({distance_km} कि.मी.)। आपतकालीन नम्बर: 112।"
}
```

Render one message per village per language (village-specific shelter and distance). `Alert.message_en/hi/ne` store the message for the first selected village (used for preview/log). Sending: create an `OutboxMessage` per village × language with status "queued", then mark all "sent" in the same transaction (simulated SMS gateway — leave a one-line `# shortcut:` comment saying a real SMS/CAP gateway plugs in here). `recipients_est` = sum of `population_est` of selected villages. `level` defaults to the highest current level among the selected villages.

---

## 9. Weather — `services/weather.py`

- Live mode: ONE batched request to Open-Meteo for all villages:
  `https://api.open-meteo.com/v1/forecast?latitude=<comma list>&longitude=<comma list>&hourly=precipitation&forecast_days=3&timezone=Asia%2FKolkata`
  (multiple coordinates return a JSON list in the same order). Take the first 72 hourly values per village.
- Cache in memory for `WEATHER_CACHE_MINUTES`.
- Fallback to `rainfall_fallback.json` when mode is offline, on timeout (`WEATHER_TIMEOUT_SECONDS`), on any HTTP/parse error, or if counts don't match. Log a warning; never raise to the caller.
- Expose `get_rainfall() -> RainfallSnapshot(source: "live" | "sample", fetched_at, hourly: dict[village_id, list[float]])` and helpers `rain_24h(hourly)`, `rain_72h(hourly)`, `six_hour_buckets(hourly) -> list[{"hour_offset": int, "mm": float}]` (12 buckets).

---

## 10. API (all JSON, prefix `/api`; admin routes need header `X-Admin-Token: <ADMIN_TOKEN>`, else 401)

| Method & path | Purpose / shape |
|---|---|
| `GET /api/health` | `{status:"ok", weather_source:"live"/"sample", weather_fetched_at, version:"0.1.0"}` |
| `GET /api/villages` | list of villages |
| `GET /api/riskpoints` | list of risk points (include gauge levels) |
| `GET /api/shelters` | list of shelters |
| `GET /api/shelters/nearest?lat=&lng=&limit=3` | `[{...shelter, distance_km}]` sorted, limit 1–10 |
| `GET /api/risk` | per village: `{village_id, name, district, lat, lng, population_est, river_km, score, level, level_text:{en,hi,ne}, components, reasons, rain_24h_mm, rain_72h_mm}` sorted by score desc |
| `GET /api/risk/{village_id}` | the above + `rainfall_series` (12 six-hour buckets) + `nearest_shelters` (3) ; 404 if unknown |
| `GET /api/risk/at?lat=&lng=` | risk of the nearest village + `distance_to_village_km` (for the citizen app) |
| `GET /api/alerts/preview?village_ids=a,b&hazard=flood` | rendered messages `{en,hi,ne}` for the first village + `recipients_est` + `level`, nothing saved |
| `POST /api/alerts` (admin) | body `{village_ids:[...], hazard, level?}` → created alert; 422 on unknown village |
| `GET /api/alerts` | newest first, limit 50 |
| `GET /api/alerts/active?village_id=` | alerts in the last 24 h that include this village, with that village's messages in all 3 languages |
| `POST /api/checkins` | body `{status, lat, lng, note?}` → created check-in with `village_id` and `village_name` |
| `GET /api/checkins?limit=50` | newest first |
| `POST /api/incidents` | multipart: `kind, description, lat, lng, photo?` → created incident |
| `GET /api/incidents?limit=50` | newest first |
| `POST /api/admin/simulate-surge` (admin) | body `{gauge_id, level_m}` → updated gauge + new `GET /api/risk` payload |
| `POST /api/admin/reset` (admin) | body `{clear_activity: bool}` → gauges back to normal; optionally delete alerts, outbox, check-ins, incidents and uploaded photos |
| `GET /api/stats` | `{villages_total, villages_high, villages_severe, people_at_high_or_severe, alerts_sent, checkins_safe, checkins_need_help, incidents_total, weather_source}` |

Static: mount `UPLOAD_DIR` at `/uploads`.

**Validation at the trust boundary (do not skip):**
- lat −90..90, lng −180..180; note ≤ 280; description ≤ 500; enums validated by Pydantic.
- Photos: accept only JPEG/PNG/WEBP, verified by **magic bytes** (not just the content-type header), ≤ `MAX_UPLOAD_MB`, saved as `<uuid4>.<ext>` — never use the client's filename. Reject others with 400.
- Admin token compared with `secrets.compare_digest`.

OpenAPI docs at `/docs` must show clean titles, tags (villages, risk, alerts, citizen, admin, stats) and example bodies.

---

## 11. Tests (pytest, all run with `WEATHER_MODE=offline` against a temp SQLite DB)

At minimum:
- `test_geo.py`: haversine (0,0)→(0,1) ≈ 111.19 km (±0.1); nearest shelters sorted and limited.
- `test_risk_engine.py`: level thresholds at 29/30/54/55/74/75; more rain never lowers the score; calm conditions → every village Low or Moderate; a surge at the Chungthang gauge (level 7.5) makes Chungthang and Toong "Severe", Dikchu at least "High", and leaves Lachen (upstream) and Gangtok (off-river) unchanged; override puts `surge_upstream` first in reasons; every reason has en/hi/ne text.
- `test_alerts.py`: messages render in all 3 languages with village, shelter and "112"; recipients_est sums population; outbox has villages × 3 rows, all "sent".
- `test_api.py`: every GET endpoint returns 200 and the documented keys; admin routes return 401 without the token and 200 with it; reset restores gauges; check-in gets the correct nearest village.
- `test_uploads.py`: a real tiny PNG is accepted; a text file renamed `.png` is rejected; an oversize file is rejected.

All tests must pass: `cd backend && pytest -q`.

---

## 12. Run commands (put these in `backend/README.md`)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env
uvicorn app.main:app --reload --port 8000
# open http://localhost:8000/docs
pytest -q
```

---

## 13. Commits (small, in this order, plain messages)

1. `backend: scaffold FastAPI app, config and database`
2. `data: add approximate Sikkim sample data`
3. `backend: risk engine with explainable reasons`
4. `backend: weather service with offline fallback`
5. `backend: alerts in English, Hindi and Nepali`
6. `backend: citizen check-ins and incident reports`
7. `backend: admin surge simulation, stats, tests`

---

## 14. Definition of done — check each before you stop

- [ ] Fresh venv + `pip install -r requirements.txt` + `uvicorn ...` starts with no errors and seeds the DB.
- [ ] `/docs` lists every endpoint in section 10.
- [ ] With `WEATHER_MODE=live` and no internet, the app still works (falls back to sample, `weather_source:"sample"`).
- [ ] Surge at Chungthang (7.5 m) turns downstream villages High/Severe; reset brings them back.
- [ ] `pytest -q` passes.
- [ ] No secrets committed; `.env` ignored.
- [ ] Print a short summary: endpoints, how to run, test count, anything you could not finish.
