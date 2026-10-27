# TeestaGuard — Prompt 2 of 3: Frontend

Run this in Claude Code from the ROOT of the `teestaguard` repository, AFTER the backend (Prompt 1) exists. Read `backend/app/schemas.py` and the routers first so the frontend types match the real API exactly. Build everything below, run `npm run build` and `npm run lint`, fix all errors, then commit. Do not push unless I ask.

---

## 1. Context

TeestaGuard is a last-mile flood / glacial-lake-outburst (GLOF) / landslide warning system for Sikkim's Teesta valley, built for **Hack for Social Cause 2027** (Government of India). The jury watches a 3-minute demo and reads the code. The frontend must **look polished, calm and trustworthy (government-tech, not a startup toy), demo smoothly, and work on a cheap Android phone.**

Two users:
1. **District disaster officer** → Authority Dashboard (`/`).
2. **Resident** → Citizen App (`/citizen`), in English, Hindi or Nepali.

The deck promises exactly these features — build all of them, nothing more:
- Map of villages coloured AND labelled Low → Severe
- Plain-language reasons behind every score
- One-click alert, previewed in three languages
- Live feed of check-ins and incident reports
- Citizen: my risk for my location in my language; "I'm safe" / "Need help"; nearest three shelters with directions; report flooding/landslide with a photo
- The demo "wow moment": **Simulate surge** turns villages downstream red one by one

**Do NOT add:** Redux/Zustand, React Query, a UI kit (MUI/Chakra/AntD), websockets, auth screens, dark mode, i18n libraries, analytics. Keep dependencies to the list below.

---

## 2. Stack and setup (in `frontend/`)

- Vite + React 18 + TypeScript (strict), from the official Vite `react-ts` template.
- Tailwind CSS (follow the current official Tailwind + Vite setup).
- `react-router-dom`, `leaflet` + `react-leaflet` (+ `@types/leaflet`), `recharts`, `lucide-react`.
- Fonts in `index.html` via Google Fonts: **Source Serif 4** (headings) and **Public Sans** (body).
- `frontend/.env.example`:
  ```
  VITE_API_URL=http://localhost:8000
  VITE_ADMIN_TOKEN=change-me-demo   # demo only; a real deployment needs proper authentication
  ```
- Page `<title>`: "TeestaGuard — Sikkim flood early warning". Add a simple SVG favicon (a water-drop shape in teal).

---

## 3. Structure

```
frontend/src/
├── main.tsx, App.tsx           # router: "/" Dashboard, "/citizen" Citizen, * → Dashboard
├── api/
│   ├── client.ts               # fetch wrapper: base URL, JSON, errors → ApiError, admin header helper
│   └── types.ts                # TypeScript types mirroring backend schemas exactly
├── hooks/
│   ├── usePolling.ts           # (fn, intervalMs) → {data, error, loading, refresh}; pauses when tab hidden
│   └── useLanguage.ts          # "en" | "hi" | "ne", persisted in localStorage inside try/catch
├── i18n/strings.ts             # UI strings for en / hi / ne (section 7)
├── lib/
│   ├── risk.ts                 # level → colors, labels, ordering
│   └── format.ts               # numbers (en-IN), relative time, km
├── components/
│   ├── Header.tsx              # brand, nav, "Sample data" badge, weather-source pill
│   ├── RiskMap.tsx             # Leaflet map (section 4)
│   ├── Legend.tsx
│   ├── KpiCards.tsx
│   ├── VillagePanel.tsx        # selected village: score, reasons, components, rainfall chart, shelters
│   ├── AlertComposer.tsx       # modal: select villages, hazard, EN/HI/NE preview tabs, send
│   ├── AlertLog.tsx
│   ├── ActivityFeed.tsx        # check-ins + incidents merged, newest first
│   ├── DemoControls.tsx        # surge + reset
│   ├── LevelBadge.tsx          # colored pill WITH text (never color alone)
│   ├── Toast.tsx
│   └── BackendDown.tsx         # friendly screen with the exact command to start the backend
└── pages/
    ├── Dashboard.tsx
    └── Citizen.tsx
```

---

## 4. Authority Dashboard (`/`)

**Layout (desktop ≥ 1024px):** header on top; below, map on the left (≈ 65% width, full remaining height); right panel (≈ 35%, scrollable). On screens < 1024px stack: KPIs, map (60vh), panel.

**Header:** "TeestaGuard" in Source Serif 4 + subtitle "Teesta valley early warning · Sikkim"; nav links Dashboard / Citizen app; an amber "Sample data" badge with tooltip "Village data is approximate; gauge readings are simulated"; a pill showing weather source from `/api/stats` ("Live forecast · Open-Meteo" or "Offline sample forecast").

**KPI cards (top of right panel, 2×2):** villages at High, villages at Severe, people in High/Severe areas (formatted en-IN, labelled "approx."), alerts sent; plus a check-in line "Safe: N · Needs help: M" with lucide icons beside the words.

**Map (`RiskMap.tsx`):**
- OpenStreetMap tiles with the required attribution. Fit bounds to all villages + South Lhonak with padding.
- **Teesta river line:** a polyline from South Lhonak through the villages that have `river_km`, sorted by `river_km` (teal, 3px, 60% opacity). Label it "Teesta (approximate)" in a tooltip.
- **Villages:** `CircleMarker`, radius by population on a log scale (8–22px), fill = level color, 2px white border. Permanent small label under each marker on zoom ≥ 10, tooltip on hover: "Chungthang — Severe (86)". Click selects the village.
- **Severe** villages get a pulsing ring (CSS animation on a divIcon behind the marker; respect `prefers-reduced-motion`).
- **Risk points:** glacial lake = blue droplet divIcon; gauge = small gauge icon with its current level in the tooltip ("Chungthang gauge: 7.5 m · danger 6.0 m", turns red when ≥ danger); landslide zone = amber triangle. Shelters = small green squares (toggle via a "Show shelters" checkbox in the legend).
- **Legend** (bottom-left overlay): the four levels with color swatch + word, plus icons for lake, gauge, landslide zone, shelter.

**Right panel tabs:** "Village" | "Alerts" | "Activity".
- **Village tab (`VillagePanel`):** empty state "Select a village on the map". When selected: name + district, big score (Source Serif 4, 64px) + `LevelBadge`, "Why this score" = the reasons in English, a horizontal bar per component (Rain, River, Glacial lake, Landslide; 0–100, each labelled with its number), a Recharts bar chart of the 12 six-hour rainfall buckets (x: "+6h"…"+72h", y: mm, axis titles), nearest 3 shelters with distance, and a primary button **"Send alert for this village"** that opens the composer pre-filled.
- **Alerts tab:** button **"New alert"** (opens composer pre-selecting all High/Severe villages) + `AlertLog` (time, level badge, hazard, villages, recipients approx.).
- **Activity tab:** `ActivityFeed` — check-ins (green "Safe" / red "Needs help" with text, village, relative time) and incidents (kind, description, thumbnail if photo, village, time), newest first.

**Alert composer (modal):** multi-select village checklist (sorted by score, showing level badges), hazard select (Flood / Glacial lake outburst / Landslide), live preview from `GET /api/alerts/preview` in three tabs **English | हिन्दी | नेपाली** (debounced 300ms), "Reaches approx. N people", **Send alert** → `POST /api/alerts` with the admin token → close, success toast "Alert sent to N villages in 3 languages", refresh alerts + KPIs. Disabled while sending; error toast on failure. Esc closes; focus trapped while open.

**Demo controls (collapsible card at the bottom of the right panel, collapsed by default, titled "Demo controls"):** gauge select (default Chungthang), level slider from normal to danger + 3 m (default 7.5), **Simulate surge** and **Reset demo** (reset sends `clear_activity: true` after a confirm dialog). After a surge:
1. Fetch the new risk list.
2. Animate the update **in order of `river_km`**, 250ms apart, so the red visibly travels downstream (villages without `river_km` update at the end).
3. Toast "Surge at Chungthang gauge: N villages now High or Severe".
4. Auto-select the most severe village.

**Data refresh:** risk + stats every 15s, activity + alerts every 5s (`usePolling`, paused when the tab is hidden).

---

## 5. Citizen App (`/citizen`) — mobile-first

Centered column, max width 28rem, large type (body 18px), tap targets ≥ 48px, light background. Works at 360px width.

1. **Top bar:** "TeestaGuard" + language switcher (EN / हिन्दी / नेपाली) — changes every string and the reasons/level text from the API.
2. **Active alert banner** (if `GET /api/alerts/active` returns any): red, icon, the message in the chosen language, time sent.
3. **Location:** on load ask `navigator.geolocation` (timeout 8s). If denied/unavailable/outside Sikkim (> 50 km from every village), show a village dropdown ("Choose your village"). Remember the choice in localStorage (try/catch). Show "Using your location" or "Showing: Mangan" with a "Change" link.
4. **My risk card:** village name, big level word in the chosen language + colored bar, score, and the top reasons from the API in the chosen language.
5. **Two big buttons:** green **"I'm safe"** and red/orange **"I need help"** → `POST /api/checkins` with location (village center if no GPS). Then a confirmation screen: "Sent. Disaster teams can see this." with a "Done" button. Prevent double submits.
6. **Nearest shelters:** 3 cards with name, distance, capacity, and **"Directions"** link to `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` (opens a new tab).
7. **Report an incident:** kind select (Flooding / Landslide / Road blocked / Other), description (max 500, counter), photo input `accept="image/*" capture="environment"` with preview and client-side check ≤ 5 MB, submit as multipart. Success message; clear form.
8. Footer: "Emergency: 112" as a `tel:112` link, and "Prototype · sample data".

---

## 6. Design system (match the presentation deck)

```
--dark:      #0F2A2E   (header, primary text on light)
--paper:     #F5F6F1   (page background)
--mist:      #E7EEEC   (panels)
--teal:      #1F7A78   (primary actions, river)
--orange:    #B44A17   (accent, alert actions)
--text-soft: #3E5459
Risk levels (always shown WITH their word):
  Low      #2E7D32
  Moderate #B8860B
  High     #E06A1B
  Severe   #B3261E
```
Put these in Tailwind theme config. Headings Source Serif 4; everything else Public Sans. Cards: white, 1px `#D6DFDC` border, 12–16px radius, subtle shadow. Numbers use tabular figures. Keep generous whitespace; no gradients; no emoji in the UI.

**Accessibility (judged under presentation/UX — do not skip):** color never carries meaning alone; contrast ≥ 4.5:1 for text; every button and icon-only control has an accessible name; visible focus rings; modal focus trap and Esc; form labels tied to inputs; `lang` attribute switches with the citizen language; respects `prefers-reduced-motion`.

---

## 7. UI strings (`i18n/strings.ts`)

Typed object `Record<Lang, Strings>` with en, hi, ne. Cover every citizen-app string (title, alert banner heading, location messages, "Change", "Choose your village", "Your risk now", level words, "Why", "I'm safe", "I need help", confirmation text, "Done", "Nearest shelters", "Directions", "capacity", "Report an incident", kinds, "Description", "Add photo", "Submit", success/error messages, "Emergency", "Prototype · sample data"). Write simple, everyday Hindi and Nepali (Devanagari), short sentences. Level words must match the backend: hi कम/मध्यम/उच्च/गंभीर, ne कम/मध्यम/उच्च/गम्भीर. Add a comment at the top: `// Hindi and Nepali reviewed by: [name] — native-speaker review pending` so we remember to get them checked. The dashboard stays in English.

---

## 8. Errors and loading

- Skeleton placeholders while loading; never a blank screen.
- If `/api/health` fails: render `BackendDown` with "Backend not reachable at <VITE_API_URL>" and the exact commands from `backend/README.md`, plus a Retry button.
- API errors show a toast with the server message; forms keep the user's input on error.
- Leaflet default marker icon fix for Vite (or avoid default markers entirely).

---

## 9. Commits (small, in this order)

1. `frontend: scaffold Vite React app with Tailwind and routing`
2. `frontend: API client, types and polling hook`
3. `frontend: risk map with legend and river line`
4. `frontend: village panel, KPIs and rainfall chart`
5. `frontend: alert composer with three-language preview`
6. `frontend: activity feed and demo surge animation`
7. `frontend: citizen app in English, Hindi and Nepali`
8. `frontend: accessibility and error states`

Add `frontend/README.md`: `npm install`, `cp .env.example .env`, `npm run dev` → http://localhost:5173 (backend must be running on :8000), `npm run build`.

---

## 10. Definition of done

- [ ] `npm install && npm run dev` works with the backend running; no console errors or warnings.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] Demo path works end to end: open dashboard → click Chungthang → Simulate surge → red travels downstream → New alert → preview in 3 languages → Send → open `/citizen` (choose Toong) → banner shows the alert in Nepali → tap "I'm safe" → check-in appears on the dashboard within 5s → report an incident with a photo → it appears with a thumbnail → Reset demo.
- [ ] Citizen app usable at 360px width; dashboard usable at 1366×768 (typical projector).
- [ ] Print a short summary: pages, components, how to run, anything not finished.
