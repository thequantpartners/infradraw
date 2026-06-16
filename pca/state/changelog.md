# Changelog

## [Unreleased] - 2026-06-14

### Added
- Superadmin Dashboard (`/admin.html`) protegido bajo Vercel KV y Firebase Auth, permitiendo la visualización de usuarios, modificación de planes (FREE/PRO) y bloqueo de cuentas (ban) con seguridad estricta para la cuenta maestra.
- Refactorización de la arquitectura del DevOps Bot en Telegram para usar el módulo nativo `os` en lugar de `child_process`, optimizando drásticamente la carga de CPU y memoria en el VPS.
- Implementación del modo Self-Healing ("Ejecutar y Recordar") en el bot de Telegram, generando memoria local persistente en `playbooks.json` para auto-corregir contenedores.
- Soporte para Modo Dual en el bot DevOps: Operación por heurística básica sin requerir API key, o modo inteligente estructurado en JSON con la API de Gemini activada.
- Rediseño UX/UI premium del dashboard de proyectos (`index.html`) con efectos glassmorphic, brillo radial de fondo, tipografía Inter, micro-animaciones y soporte responsivo móvil completo.
- Solución a condición de carrera en inicialización del canvas (`canvas.html`) agregando un callback `__INFRADRAW_READY` para evitar llamadas a la API sin token de Firebase Auth.
- Migración completa de InfraDraw a modelo SaaS con autenticación Firebase (Google Sign-In) y persistencia en base de datos aislada por usuario usando Vercel KV.
- Integración de pasarela de pago Lemon Squeezy a través de webhooks para gestionar suscripciones FREE y PRO ($99 USD).
- Landing page (`landing.html`) responsiva adaptada a móviles con navegación adaptada, carrusel táctil simulado y modal bottom-sheet.
- Autenticación OAuth Device Flow en la CLI (`infradraw login`, `logout`, `whoami`) utilizando un servidor local HTTP temporal para recibir los tokens desde el navegador.
- Validación y restricción de planes en compilador y CLI, bloqueando el uso de Google Cloud Platform (GCP) y limitando alertas del bot DevOps de Telegram si el usuario está en el plan FREE.
- Evolución del CLI a **Agentic CLI** en `cli/bin/infradraw.js` mediante la adición de flags `--json` para los comandos `compile` y `validate`.
- Creación de topologías de arquitectura de manera no interactiva usando `infradraw create --non-interactive` y flags de configuración.
- Nuevo comando `infradraw schema` para imprimir las plataformas, planes, regiones, frameworks y bases de datos soportados en formato JSON.
- Banner de redirección en `README.md` y guías actualizadas en `AGENTS.md` para instruir a agentes de IA sobre el uso de la CLI y reglas del entorno.
- Integración nativa de Google Cloud (GCP) en el compilador web y CLI, incluyendo soporte de planes e2, red VPC y generación de `google_compute_instance`.
- Inclusión del nuevo nodo 'DevOps Bot' (Telegram) para la gestión y monitorización activa de contenedores Docker mediante comandos interactivos en chat.
- Exportación automatizada del bot en Node.js dentro del subdirectorio `bot/` al compilar la arquitectura.
- Asistente Virtual DevOps interactivo en Telegram con soporte para monitoreo de recursos del VPS (disco, RAM, carga de CPU), heartbeat por hora y diagnóstico profundo de caídas de contenedores usando la API de Gemini (SDK `@google/genai`).
- Diferenciación de auto-remediación en el bot: en GCP permite auto-escalar y redimensionar instancias de Compute Engine de forma interactiva ("Aplicar Solución Sugerida" con SDK `@google-cloud/compute`), mientras que en nubes privadas se limita a sugerencias informativas y acciones manuales.
- Respuestas dinámicas DevOps a mensajes directos del operador humano utilizando prompts de sistema de Gemini en chat abierto.
- Selector global de nube "Private Cloud vs GCP" en la barra lateral del canvas para el filtrado inteligente de nodos y preconfiguración/bloqueo de proveedores VPS/Compute Engine a `gcloud` en modo GCP.
- Soporte en compilador (web y CLI) para aprovisionar buckets de Google Cloud Storage (GCS) mediante `google_storage_bucket` en Terraform si hay un nodo `storage` en modo GCP.
- Exportación/importación del modo de nube persistido en formato JSON.

## [Unreleased] - 2026-06-13

### Added
- Implementación de Auto-Alineamiento Magnético (Snap-to-Grid) para los nodos en `canvas.html`.
- Ampliación del catálogo de nodos con herramientas clave (Cron / Worker, Supabase, PocketBase).
- Inyección de motor de precios y Simulador de Costos interactivo para VPS en la interfaz gráfica.
- Inicialización y configuración completa de **PCA (Project Context Architecture)** en el repositorio.
- Creación de documentación técnica de arquitectura, stack tecnológico, contexto de negocio y hoja de ruta inicial en `pca/core/` y `pca/state/`.
- Adición de reglas operativas para agentes en [AGENTS.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/AGENTS.md) y [PCA_INDEX.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/PCA_INDEX.md).
- Refinamiento de [AGENTS.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/AGENTS.md) para establecer el uso predeterminado de PCA CLI y la política de reporte obligatorio de fallos.
- Extracción de la lógica de compilación y generación de IaC (Docker Compose, Terraform, Traefik, scripts de backup) a `cli/src/compiler.js`.
- Creación del ejecutable `cli/bin/infradraw.js` con soporte para validación e inicio interactivo de proyectos mediante un asistente en terminal.
- Reescritura y optimización de [README.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/README.md) y [CLAUDE.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/CLAUDE.md) con enfoque 100% centrado en la arquitectura de InfraDraw para humanos e Inteligencias Artificiales.
- Implementación de Sincronización Bidireccional (Opción A) inyectando un algoritmo de Auto-Layout Fallback en `canvas.html` para permitir importar archivos JSON editados manualmente sin coordenadas.

