# CLAUDE.md — InfraDraw Developer Reference

This document outlines command references, project structure, and key coding constraints for developers and AI agents working on the InfraDraw codebase.

---

## 🚀 Key Commands

### 1. Visual Web Canvas
The frontend is a vanilla HTML/CSS/JS application.
*   **Run local dev server (Vercel Dev):**
    ```bash
    npx vercel dev --listen 3100
    ```
*   **Static Entry points:** [index.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/index.html) and [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html).

### 2. InfraDraw CLI (`cli/`)
Headless Node.js subproject that parses topology JSON configurations into IaC files.
*   **Setup / Install dependencies globally:**
    ```bash
    cd cli && npm install && npm link
    ```
*   **Create a new topology interactively:**
    ```bash
    infradraw create [outputFile.json]
    ```
*   **Validate a topology JSON:**
    ```bash
    infradraw validate <file.json>
    ```
*   **Compile a topology JSON to deployment files:**
    ```bash
    infradraw compile <file.json> [outDir]
    ```

---

## 📂 Codebase Structure

*   [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html) — Core interactive SVG-based drag & drop editor UI.
*   [cli/bin/infradraw.js](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/cli/bin/infradraw.js) — Entry point for CLI. Parses arguments and launches prompts/compilers.
*   [cli/src/compiler.js](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/cli/src/compiler.js) — Core compiler logic. Extracted from the web canvas to make it 100% headless and testable.
*   [cli/examples/basic-infra.json](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/cli/examples/basic-infra.json) — Reference JSON schema for architectures.

---

## 🛠️ Codebase Constraints & Style Guidelines

1.  **Browser & CLI Decoupling:** Keep `cli/src/compiler.js` 100% independent of browser globals (`window`, `document`, `navigator`, etc.). Any new generation logic or scenario detection must be added here first, then imported/shared by the frontend.
2.  **No Bulky Dependencies:** Keep the CLI lightweight and fast. Use built-in Node.js APIs where possible (like `readline/promises` for interactive flows).
3.  **Docker-First Architecture:** Always generate network-isolated environments (e.g. `public`, `internal`, `db` docker networks) with built-in healthchecks for services.
4.  **Cost and Plan Matching:** Keep plan specifications and pricing aligned with the logic inside `getPlanRAM` and `getPlanCost` within `compiler.js`.
5.  **Always Validate First:** Never compile a topology without first running the validator logic. Ensure all outputs are cleanly directed to the specified output folder without side-effects in the repository root.
