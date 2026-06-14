# InfraDraw 🛸

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

### A. Create an Architecture Interactively (`infradraw create`)
Launches a terminal wizard that guides you through selecting a cloud provider, sizing your virtual machines, setting up Traefik SSL certificates, configuring apps/APIs, and choosing databases.
```bash
infradraw create [outputFile.json]
```
*(Generates `infradraw.json` by default)*

### B. Validate Topology (`infradraw validate`)
Checks if your topology JSON is valid, reports critical architectural errors (e.g. missing VPS, network separation errors) and security warnings.
```bash
infradraw validate <file.json>
```

### C. Compile to Production IaC (`infradraw compile`)
Compiles your topology design into a complete deployment package in the destination folder.
```bash
infradraw compile <file.json> [outDir]
```
*(Compiles to `./dist` by default)*

---

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
