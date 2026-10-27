# AI tool use disclosure

**Tools used:** Claude (Anthropic) via Claude Code for code generation, and Claude for drafting documentation, the presentation deck and the demo script.

**What the AI did:** Generated most of the source code from detailed prompts written by the team (the prompts are in `docs/prompts/`), and wrote first drafts of the documentation (this file, `README.md`, `ARCHITECTURE.md`, `DATA.md`, `docs/DEMO_SCRIPT.md`).

**What the team did:** Chose the problem and the Sikkim focus, researched the 2023 South Lhonak disaster, designed the features and the risk-scoring formula, wrote and refined the prompts in `docs/prompts/`, reviewed, ran and tested the generated code, fixed issues, prepared the sample data, and prepared the pitch.

**Estimated share of AI-assisted work:** `[__% — to be filled in by the team]`

**Safeguard:** No AI model makes the risk decision at runtime. The village risk score is a transparent, deterministic formula (`backend/app/services/risk_engine.py`) — the same inputs always produce the same score, and every score comes with a plain-language explanation.
