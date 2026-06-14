# InfraDraw 🛸

> [!IMPORTANT]
> **AI AGENT NOTICE**: If you are an AI agent, you **MUST** read [AGENTS.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/AGENTS.md) and [PCA_INDEX.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/PCA_INDEX.md) first to understand the workspace operating rules, context limitations, and closure procedures before performing any task.

InfraDraw is a visual, Docker-first infrastructure design tool and compiler. It allows you to visually design your server topology (web servers, database nodes, load balancers, caching, and network segments) and compile them directly into production-ready IaC (Infrastructure as Code) configurations and automation scripts.

The project consists of two core components:
1.  **Visual Web Editor (`canvas.html`):** An interactive, drag-and-drop web application to visually model and align your server architecture, preview deployment costs, and export topology files.
2.  **Headless Compiler CLI (`cli/`):** A headless Node.js CLI to programmatically create, validate, and compile topology JSON configurations into deployment assets.

---

## 🚀 Quick Start for Humans & AI Agents

### 1. Running the Visual Web Editor
The web editor runs completely client-side. To run it locally with hot-reloading:
```bash
# Start a local web server (Vercel Dev or any static server)
npx vercel dev --listen 3100
```
Then open [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html) in your browser.

### 2. Installing the Headless CLI
To make the `infradraw` command globally available:
```bash
cd cli
npm install
npm link
```

---

## 🛠️ CLI Reference & Usage

Once linked, you can run `infradraw` anywhere in your terminal:

### A. Create an Architecture (`infradraw create`)
Can be run interactively or non-interactively (ideal for automation/AI agents).

**Interactive Wizard:**
```bash
infradraw create [outputFile.json]
```

**Non-Interactive Mode (Agentic CLI):**
Add the `--non-interactive` flag and specify your parameters:
```bash
infradraw create [outputFile.json] --non-interactive --provider hetzner --plan cx31 --region nbg1 --domain mi-app.com --traefik si --app nextjs --port 3000 --db postgres
```
*   Options:
    *   `--non-interactive`: Triggers non-interactive creation.
    *   `--provider <provider>`: `hetzner` | `digitalocean` | `contabo` | `vultr` | `linode`.
    *   `--plan <plan>`: Plan size matching the provider.
    *   `--region <region>`: VPS region.
    *   `--domain <domain>`: principal Cloudflare domain.
    *   `--traefik <si|no>`: Set Traefik SSL certificates.
    *   `--cert-email <email>`: Cert email.
    *   `--app <nextjs|vite|nodejs|python|go|ninguno>`: Application framework.
    *   `--port <port>`: Application running port.
    *   `--db <postgres|redis|ambas|ninguna>`: DB systems.
    *   `--json`: Output results in structured JSON.

### B. Validate Topology (`infradraw validate`)
Checks if your topology JSON is valid, reports critical architectural errors and warnings.
```bash
infradraw validate <file.json> [--json]
```
*   `--json`: Returns output in a machine-readable JSON object (e.g. `{ "valid": false, "errors": [...], "warnings": [...] }`).

### C. Compile to Production IaC (`infradraw compile`)
Compiles your topology design into a complete deployment package in the destination folder.
```bash
infradraw compile <file.json> [outDir] [--json]
```
*   `--json`: Outputs results in JSON (e.g. `{ "status": "success", "outDir": "dist/", "generatedFiles": [...] }`).

### D. Get Supported Meta-Schema (`infradraw schema`)
Outputs all supported providers, regions, plans, frameworks, and datastores in JSON format so AI agents can query constraints before creating configurations.
```bash
infradraw schema
```

## 📂 The Generated Deployment Package (`dist/`)

When you run `infradraw compile`, the compiler generates a fully structured environment ready to run on any VPS:

*   `docker-compose.yml`: Fully isolated networks (`public`, `internal`, `db`) mapping your services, ports, and volumes with integrated container healthchecks.
*   `config/traefik.yml` & `config/middlewares.yml`: Automatic Let's Encrypt SSL config and production security headers.
*   `config/postgresql.conf`: Custom PostgreSQL parameters (shared buffers, cache sizes) optimized dynamically based on your VPS node's RAM.
*   `scripts/setup.sh`: Shell script to install Docker, configure firewalls, and bootstrap the server.
*   `scripts/backup.sh` & `scripts/restore.sh`: Automatic PostgreSQL cron backup tools with support for S3/Wasabi/Cloudflare R2 backups.
*   `terraform/`: Terraform manifests (`main.tf`, `variables.tf`, `outputs.tf`) to provision the VPS servers and configure Cloudflare DNS records.
*   `Makefile`: Quick shortcut targets (`make deploy`, `make backup`, `make logs`) to manage the live environment.

---

## 🧠 Topology JSON Schema (For Developers & AIs)

InfraDraw topology files use a simple, structured JSON schema. An AI agent or script can generate these files programmatically to compile infrastructures.

### Schema Structure:
```json
{
  "version": 1,
  "nodes": [
    {
      "id": "n1",
      "type": "vps",
      "x": 0,
      "y": 0,
      "config": {
        "provider": "hetzner",
        "plan": "cx31",
        "region": "nbg1",
        "os": "ubuntu-24.04",
        "role": "app+db"
      }
    },
    {
      "id": "n2",
      "type": "traefik",
      "parentId": "a1",
      "x": 10,
      "y": 10,
      "config": {
        "version": "v3.0",
        "cert_email": "admin@example.com"
      }
    }
  ],
  "areas": [
    {
      "id": "a1",
      "type": "net-public",
      "x": -50,
      "y": -50,
      "w": 300,
      "h": 300
    }
  ],
  "conns": []
}
```

### Node Types & Configurations:
*   `vps`: Virtual Private Server.
    *   `provider`: `hetzner` | `digitalocean` | `contabo` | `vultr` | `linode`
    *   `plan`: Machine sizes matching the selected provider.
    *   `role`: `app` | `db` | `app+db`
*   `traefik`: Reverse proxy / SSL manager. Requires `cert_email`.
*   `frontend` / `backend`: App services.
    *   `framework`/`language`: `nextjs` | `vite` | `nodejs` | `python` | `go`
    *   `port`: Running port (e.g. `3000`, `8080`).
*   `postgres` / `redis`: Datastores. Optimized automatically.
*   `cloudflare`: Global DNS manager. Requires `domain` in config.

---

## 🔄 Bidirectional Synchronization & Auto-Layout Fallback

Since version 1.1, InfraDraw supports complete bidirectional editing. Developers can:
1. Export a topology JSON from the visual editor.
2. Manually edit, add, or delete nodes/areas in the JSON file using any code editor.
3. Import the updated JSON back into the visual web canvas.

### Auto-Layout Schema Fallback
If you write or edit a JSON topology file programmatically (or by hand) and omit the visual positioning properties (`x`, `y` for nodes; `x`, `y`, `w`, `h` for areas), the visual editor's **Auto-Layout Fallback** will automatically organize and place them on import:
*   **Areas:** Dynamically arranged in a horizontal grid layout with standard scaling.
*   **Nodes inside Areas (via `parentId`):** Automatically positioned inside their parent area bounds using a grid pattern.
*   **Orphan/Global Nodes:** Organized in a row below the main areas.
*   **Connections:** Preserved and drawn dynamically based on the resolved coordinates.

This prevents layout breakages (such as `NaN` positioning) and enables seamless Git-driven, CLI-driven, and manual text modifications.

