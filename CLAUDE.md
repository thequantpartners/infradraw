# CLAUDE.md — InfraDraw Developer Reference

This document outlines command references, project structure, and key coding constraints for developers and AI agents working on the InfraDraw codebase.

---

## 🚀 Key Commands

### Visual Web Canvas (InfraDraw v2 — DevOps Copilot)
The product is a single-page **vanilla HTML/CSS/JS** application. The canvas is a React 18 SPA loaded from CDN with **no build step and no JSX** (see constraint #1). Backend logic runs on an Express server (`server.js`) in a single port configuration for Railway.
*   **Run local dev server:**
    ```bash
    npm start
    ```
*   **Static Entry points:** [index.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/index.html) and [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html).
*   **Syntax-check the inline canvas script** (the app is auth-gated, so it can't be loaded headless — validate JS by extracting the inline `<script>` and running `node --check`).

> The legacy headless `cli/` subproject was **removed in v2**. The end user is a non-technical operator, not a programmer, so the IaC-compiling CLI was dead weight. `getPlanRAM` / `getPlanCost` now live directly in [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html).

---

## 📂 Codebase Structure

*   [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html) — Core SVG drag & drop editor **plus** all v2 Copilot UI: onboarding wizard, AI Architect chat, cost simulator, live monitoring dashboard, and Telegram Autopilot. Single-file React-no-JSX SPA.
*   `api/ai-designer.js` — Serverless endpoint. Turns a natural-language prompt into a structured GCP topology (`nodes` + `conns`). Calls Gemini when `GEMINI_API_KEY` is set, otherwise a deterministic keyword mock.
*   `api/auth-sync.js`, `api/user.js`, `api/webhooks/lemonsqueezy.js` — Auth/profile/billing serverless functions.
*   [Walkthrough_V2.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/Walkthrough_V2.md) — Detailed map of all v2 data structures, functions, and which APIs are live vs. mocked.

---

## 🛠️ Codebase Constraints & Style Guidelines

1.  **React, no JSX:** All canvas UI uses `var h = React.createElement;` with the `h('div', { className: '...' }, [ ... ])` pattern. Hooks are destructured from `React`. Never introduce a build step or `.jsx`.
2.  **Backend in `/api/`:** Any server-side logic is written as an Express-compatible handler inside the `/api/` folder and registered as a route in `server.js`. Secrets are read from environment variables.
3.  **Secrets stay in env vars:** API keys (`GEMINI_API_KEY`, KV/Firebase creds) are read from `process.env` only — never hard-coded or shipped to the client.
4.  **Docker-First Architecture:** When generating deployable environments, prefer network-isolated setups (e.g. `public`, `internal`, `db` networks) with built-in healthchecks.
5.  **Cost and Plan Matching:** Keep plan specs and pricing aligned with `getPlanRAM` / `getPlanCost` in [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html), and GCP rates aligned with `GCP_PRICING` / `computeGcpCosts`.
6.  **Surgical, additive changes:** Premium dark/glassmorphic UX (Inter font, soft borders, micro-animations). Add features without breaking the existing editor; reuse existing helpers (`uid`, `pushHistory`, `addNodeAt`, `fitToScreen`, etc.).
