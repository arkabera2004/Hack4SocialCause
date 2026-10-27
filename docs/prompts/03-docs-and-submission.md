# TeestaGuard — Prompt 3 of 3: Documentation, polish and submission check

Run this in Claude Code from the ROOT of the `teestaguard` repository after Prompts 1 and 2 are done. Read the whole repo first (backend, frontend, sample-data, `docs/prompts/`). Then write the documents below, run the full verification, fix anything broken, commit and push to `origin main`.

The jury (Hack for Social Cause 2027, IIT Bombay knowledge partner) opens this repo cold. The README is the first thing they read. The rules require: complete source code, a detailed README with setup instructions, architecture documentation, sample data or test cases, licence information, and a disclosure of AI tool use. Everything must be accurate to the code as it actually is — read the code, never describe a feature that does not exist.

---

## 1. Root `README.md`

Sections, in this order. Plain, confident English; short paragraphs; no marketing fluff; no emoji.

1. **Title + one-line summary**: "TeestaGuard — last-mile flood and glacial-lake-outburst warning for Sikkim's Teesta valley." Under it one line: "Hack for Social Cause 2027 · Theme: Disaster Mitigation & Resilience · State: Sikkim".
2. **Screenshot**: `docs/screenshots/dashboard.png` at the top (see section 6).
3. **The problem** (≤ 120 words) with these facts and links:
   - 3–4 Oct 2023, South Lhonak GLOF; Teesta III (1,200 MW) dam at Chungthang destroyed; Government of Sikkim figures: 46 deaths, 77+ missing, 88,400 affected — https://iee.psu.edu/news/blog/glacier-lake-outburst-floods-loss-life-and-infrastructure
   - The lake's early-warning system was still being installed — https://gulfnews.com/world/asia/india/early-warning-system-for-indias-flooded-glacial-lake-was-delayed-by-a-year-1.1697025573287
   - Sikkim now monitors 16 high-risk glacial lakes — https://eastmojo.com/sikkim/2026/08/31/sikkim-monitoring-16-high-risk-glacial-lakes-offers-glof-expertise-to-nepal/
   - The gap: turning data into a village-level risk, a local-language alert and a live view of who is safe.
4. **What TeestaGuard does**: two short lists — Authority dashboard, Citizen app — matching what is built.
5. **How the risk score works**: one paragraph + a table of the four components, their weights (30/30/20/20), what feeds each, the override rule, and the level thresholds (Low < 30 ≤ Moderate < 55 ≤ High < 75 ≤ Severe). Say clearly: transparent formula, no AI model decides risk. Link to `backend/app/services/risk_engine.py`.
6. **Quick start** (copy-pasteable, Windows and macOS/Linux variants): prerequisites (Python 3.11+, Node 18+), backend commands, frontend commands, URLs (dashboard http://localhost:5173, citizen app http://localhost:5173/citizen, API docs http://localhost:8000/docs), default admin token note.
7. **Demo in 2 minutes**: the exact click path (surge → alert → citizen check-in → incident → reset).
8. **Architecture**: a Mermaid flowchart (data sources → FastAPI services → SQLite → React dashboard / citizen app) + link to `ARCHITECTURE.md`.
9. **API overview**: table of endpoints (method, path, purpose); note admin header.
10. **Tests**: how to run; what they cover; current count (run them and put the real number).
11. **Data and sources**: link to `DATA.md`; one line on approximate sample data.
12. **Limitations (honest)**: sample village data is approximate; gauge readings are simulated; SMS sending is simulated (outbox); admin token is a demo stand-in for real authentication; Hindi/Nepali text awaits native-speaker review; not a replacement for official warnings from SSDMA/IMD/CWC.
13. **Roadmap**: Nov 2026 validation with district disaster officials and real gauge data; Dec 2026–Jan 2027 SMS gateway, CAP-format alerts, offline mode, Nepali voice alerts, Mangan district pilot plan; later other Himalayan states.
14. **Team**: table with name, institution, role — use `[Team Name]`, Arka Bera (Team Lead, Sikkim Manipal Institute of Technology — backend, risk engine, architecture), `[Member 2]`, `[Member 3]` as placeholders exactly like that.
15. **AI tool use**: one sentence + link to `AI_DISCLOSURE.md`.
16. **Licence**: MIT, link to `LICENSE`.

---

## 2. `ARCHITECTURE.md`

- Component diagram (Mermaid flowchart) showing: Open-Meteo, sample-data fallback, simulated gauges, risk engine, alert service + outbox, citizen service, SQLite, REST API, dashboard, citizen app.
- **Sequence diagram** (Mermaid) of the core flow: gauge surge → risk recomputed → officer previews and sends alert → outbox (EN/HI/NE) → resident sees banner → "I'm safe" check-in → dashboard feed.
- Module map: one line per backend module and frontend folder saying what it owns.
- Key design decisions (3–6 bullets, each with the why): pure-function risk engine (testable, explainable); offline fallback (demo and field reliability); SQLite (zero setup, swap via DATABASE_URL); polling not websockets (simplicity, works on poor networks); reasons returned in three languages from the backend (one source of truth).
- **Scaling path**: PostgreSQL/PostGIS; real gauge and lake-sensor feeds from the state; SMS gateway and CAP-format alerts; new river basins added as data files, not code; containerised deployment.

---

## 3. `AI_DISCLOSURE.md` (required by the competition rules — be accurate)

- **Tools used:** Claude (Anthropic) via Claude Code for code generation, and Claude for drafting documentation, the presentation deck and the demo script.
- **What the AI did:** generated most of the source code from detailed prompts written by the team (the prompts are in `docs/prompts/`), wrote first drafts of the docs.
- **What the team did:** chose the problem and Sikkim focus, researched the 2023 disaster, designed the features and risk formula, wrote and refined the prompts, reviewed, ran and tested the code, fixed issues, prepared the data and the pitch.
- **Estimated share of AI-assisted work:** write exactly `[__% — to be filled in by the team]`. Do NOT invent a number.
- **Safeguard:** no AI model makes the risk decision at runtime; the score is a transparent formula.

---

## 4. `DATA.md`

Table of every dataset: file, what it contains, source, licence, accuracy note.
- `sample-data/villages.json` — approximate coordinates and river distances, illustrative population; prepared by the team for the prototype.
- `sample-data/risk_points.json` — South Lhonak lake (approximate location); gauges simulated; landslide zones illustrative.
- `sample-data/shelters.json` — sample shelters, not verified real facilities.
- `sample-data/rainfall_fallback.json` — synthetic 72-hour rainfall for offline demos.
- Live rainfall: Open-Meteo forecast API — https://open-meteo.com/ (licence CC BY 4.0; attribution required).
- Map tiles: OpenStreetMap contributors — https://www.openstreetmap.org/copyright (ODbL).
End with: "Before any real use, replace sample data with verified data from the Sikkim State Disaster Management Authority and district administrations."

---

## 5. Repository hygiene

- `LICENSE`: MIT, `Copyright (c) 2026 [Team Name] — Arka Bera and team`. If GitHub already created a LICENSE, keep it and only fix the copyright line.
- Root `.gitignore` covers Python, Node, `.env`, `*.db`, `backend/uploads/`, `frontend/dist/`, OS files.
- Move the three prompt files into `docs/prompts/` if they are not already there (they show our process for the AI disclosure).
- Add `docs/DEMO_SCRIPT.md`: the 4-minute video narration as a table (time, on screen, narration) — consistent with the README demo path.
- Remove dead code, stray `console.log`, unused files and unused dependencies. No TODOs left without an owner.
- Make sure no secret or real token is committed (search the history too). `.env.example` files only.

---

## 6. Screenshots (`docs/screenshots/`)

Try to capture them automatically with Playwright (`npx playwright install chromium` is allowed for this step only; do not add Playwright to the project dependencies):
- `dashboard.png` at 1440×900 after a surge at Chungthang with a Severe village selected.
- `alert-preview.png` with the composer open on the नेपाली tab.
- `citizen-mobile.png` at 390×844, language Nepali, showing the alert banner and the two buttons.
Start both servers, run the capture script from a temp folder (not committed), stop the servers, reset the demo afterwards. If Playwright cannot run here, create the folder with a `README.md` listing exactly which three screenshots to take manually, and tell me.

---

## 7. Full verification — do all of it, fix what fails, report results

1. Clone the repo into a temp directory and follow the README Quick start **exactly as written**. Fix the README or the code until it works from scratch.
2. `cd backend && pytest -q` — all pass.
3. `cd frontend && npm run lint && npm run build` — both pass.
4. With both servers running, `curl` smoke test: `/api/health`, `/api/risk`, `/api/stats`, preview an alert, simulate surge (with token), confirm Chungthang is Severe, post a check-in, reset.
5. Every link in README, ARCHITECTURE, DATA and AI_DISCLOSURE resolves to a file in the repo or a public URL.
6. Every feature the README claims exists in the code (grep for it). Remove any claim that is not true.
7. Repo size is reasonable (no `node_modules`, `.venv`, databases or uploads committed).

---

## 8. Commit and push

Commit messages:
1. `docs: README, architecture, data and AI disclosure`
2. `docs: screenshots and demo script`
3. `chore: repository cleanup`

Then `git push origin main`.

---

## 9. Final report to me (print this at the end)

- Repo URL and whether it is public (check with `gh repo view --json visibility` if `gh` is available).
- Test count and results; build and lint results.
- Screenshot status.
- **Placeholders I still must fill**: list every `[Team Name]`, `[Member 2]`, `[Member 3]`, `[__%...]` and native-speaker review note with file and line.
- The exact text to paste into the portal's repository field.
