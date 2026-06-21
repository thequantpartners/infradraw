# CLAUDE.md — InfraDraw Developer Reference

This document outlines command references, project structure, and key coding constraints for developers and AI agents working on the InfraDraw codebase.

---

## 🚀 Key Commands

### Visual Web Canvas (InfraDraw v2 — DevOps Copilot)
The frontend is being migrated to a **Vite + React (JSX) + Tailwind v3** SPA (see constraint #1). `landing` (`/`) and `app` (`/app`) are React Router pages; `canvas` and `admin` are still legacy React-no-JSX HTML served from `frontend/public/`. Backend logic runs on an Express server (`server.js`) in a single port configuration for Railway.
*   **Run frontend dev server (Vite):**
    ```bash
    cd frontend && npm install && npm run dev
    ```
*   **Build frontend:** `cd frontend && npm run build` (outputs to `frontend/dist/`).
*   **Entry points:** `frontend/index.html` (Vite entry → `src/main.jsx`) for the React app; `frontend/public/canvas.html` and `frontend/public/admin.html` for the legacy pages.
*   **Syntax-check the legacy canvas script** (auth-gated, can't be loaded headless — validate JS by extracting the inline `<script>` and running `node --check`).

> The legacy headless `cli/` subproject was **removed in v2**. The end user is a non-technical operator, not a programmer, so the IaC-compiling CLI was dead weight. `getPlanRAM` / `getPlanCost` now live directly in [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html).

---

## 📂 Codebase Structure

*   [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html) — Core SVG drag & drop editor **plus** all v2 Copilot UI: onboarding wizard, AI Architect chat, cost simulator, live monitoring dashboard, and Telegram Autopilot. Single-file React-no-JSX SPA.
*   `api/ai-designer.js` — Serverless endpoint. Turns a natural-language prompt into a structured GCP topology (`nodes` + `conns`). Calls Gemini when `GEMINI_API_KEY` is set, otherwise a deterministic keyword mock.
*   `api/auth-sync.js`, `api/user.js`, `api/webhooks/lemonsqueezy.js` — Auth/profile/billing serverless functions.
*   [Walkthrough_V2.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/Walkthrough_V2.md) — Detailed map of all v2 data structures, functions, and which APIs are live vs. mocked.

---

## 🛠️ Codebase Constraints & Style Guidelines

1.  **Frontend stack — Vite + React (JSX) + Tailwind:** The `frontend/` app is being migrated to a Vite + React 18 SPA with JSX, React Router, and Tailwind CSS v3 (`tailwind.config.js` + `postcss.config.js`). New UI is authored as `.jsx` functional components with Tailwind utility classes — not the old `var h = React.createElement` pattern, and not vanilla `<style>` CSS.
    *   **Migration status (Phase 1):** `landing.html` → `pages/Landing.jsx`, `app.html` → `pages/Dashboard.jsx` (routed at `/` and `/app`). The pre-migration originals are kept in `frontend/legacy/`.
    *   **Still legacy (React-no-JSX, Phase 2 pending):** `canvas.html` and `admin.html` live in `frontend/public/` and are served intact at `/canvas.html` and `/admin.html` so direct URLs keep working. They still use the `h('div', {...}, [...])` pattern; do not convert them to JSX until Phase 2.
2.  **Backend in `/api/`:** Any server-side logic is written as an Express-compatible handler inside the `/api/` folder and registered as a route in `server.js`. Secrets are read from environment variables.
3.  **Secrets stay in env vars:** API keys (`GEMINI_API_KEY`, KV/Firebase creds) are read from `process.env` only — never hard-coded or shipped to the client.
4.  **Docker-First Architecture:** When generating deployable environments, prefer network-isolated setups (e.g. `public`, `internal`, `db` networks) with built-in healthchecks.
5.  **Cost and Plan Matching:** Keep plan specs and pricing aligned with `getPlanRAM` / `getPlanCost` in [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html), and GCP rates aligned with `GCP_PRICING` / `computeGcpCosts`.
6.  **Surgical, additive changes:** Premium dark/glassmorphic UX (Inter font, soft borders, micro-animations). Add features without breaking the existing editor; reuse existing helpers (`uid`, `pushHistory`, `addNodeAt`, `fitToScreen`, etc.).
