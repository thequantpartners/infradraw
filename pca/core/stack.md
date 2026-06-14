# Stack Tecnológico: InfraDraw

El sistema se compone de dos vertientes: el stack de la aplicación web y los stacks de infraestructura externa que la herramienta permite modelar.

## Stack de la Aplicación (Runtime)

### Frontend
*   **Lenguaje:** JavaScript ES6 moderno.
*   **Framework:** React 18 / ReactDOM 18 (Cargado en caliente mediante CDN de producción).
*   **Estilos:** Vanilla CSS3 con variables nativas (`:root`), flexbox, grid, y animaciones sutiles.
*   **Gráficos:** SVG (Scalable Vector Graphics) para elementos interactivos, cajas de nodos y flechas de interconexión.
*   **Compresión:** `JSZip` versión `3.10.1` (vía CDN) para empaquetado de archivos en el navegador.

### Backend & API
*   **Plataforma:** Vercel Serverless Functions.
*   **Runtime:** Node.js 20.x.
*   **Base de datos:** Vercel KV (Upstash Redis) conectado mediante HTTP REST API a través de fetch nativo.
*   **Librerías externas:** Ninguna. Se interactúa directamente con la API REST de Redis para simplificar el despliegue serverless y minimizar el tamaño del bundle de la función.

---

## Modelado de Infraestructura Soportada

### Proveedores Cloud (VPS)
*   **Hetzner:** Planes CX21 (4GB), CX31 (8GB), CX41 (16GB), CX51 (32GB), CCX13 (8GB), CCX23 (16GB).
*   **DigitalOcean:** Droplets de 2GB a 16GB.
*   **Contabo:** VPS S (8GB) a VPS L (30GB), VDS S.
*   **Vultr:** Instancias de 2GB a 8GB.
*   **Linode:** Nanodes (1GB) e instancias dedicadas.

### Redes y Proxies
*   **Traefik:** Utilizado como balanceador de carga interno e ingress en redes Docker, manejando SSL automático a través de Let's Encrypt.
*   **Hetzner LB & Cloudflare LB:** Balanceadores gestionados para arquitecturas multinodo.

### Bases de Datos y Almacenamiento
*   **PostgreSQL:** Con configuraciones automáticas de RAM y optimización de conexiones (`PgBouncer`).
*   **Redis:** Con persistencia en disco y requerimiento explícito de contraseña.
*   **Object Storage (S3 API):** Wasabi S3, Cloudflare R2, Hetzner Object Store, Backblaze B2.

### Orquestación y Aprovisionamiento
*   **Docker Compose:** Generación de manifiestos listos para levantar el stack localmente.
*   **Terraform:** Automatización para la creación de VPS en Hetzner y Cloudflare.
*   **Makefile & Bash scripts:** Herramientas para aprovisionamiento manual rápido (`setup.sh`) y copias de seguridad de bases de datos.
