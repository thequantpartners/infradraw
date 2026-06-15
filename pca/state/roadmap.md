# Roadmap: InfraDraw

## In Process

- [ ] Sincronizar el canvas interactivo con el CLI de PCA para permitir importación y exportación de metadatos directamente a los archivos de configuración local.

## Pending

- [ ] Agregar soporte para exportación directa a plantillas de EasyPanel.
- [ ] Implementar el historial de versiones (histórico de guardado) en el dashboard de proyectos usando Vercel KV.
- [ ] Desarrollar una interfaz de colaboración en vivo (WebSockets) compartiendo salas de diseño entre desarrolladores.

## Done

- [x] Migración completa a un modelo SaaS con autenticación Firebase (Google Sign-In), almacenamiento persistente por usuario con Vercel KV, y pasarela de pago Lemon Squeezy (Planes FREE y PRO).
- [x] Rediseño de interfaz responsiva móvil para el Landing Page de promoción de la plataforma y el dashboard de proyectos.
- [x] Autenticación local mediante OAuth Device Flow en la CLI (`infradraw login`, `logout`, `whoami`), abriendo automáticamente el navegador para inicio de sesión seguro y persistencia local de credenciales en `~/.infradraw/auth.json`.
- [x] Validación y restricción en tiempo de ejecución de planes (GCP bloqueado para plan FREE, bot de Telegram con limitaciones en alertas) tanto en la web como en la CLI.
- [x] Evolucionar el CLI de InfraDraw a una Agentic CLI agregando soporte para salidas JSON, comandos de autodescubrimiento (schema) y creación no interactiva.
- [x] Implementar soporte nativo para importar topologías de red desde archivos JSON con algoritmo de Auto-Layout bidireccional de manera visual.
- [x] Canvas interactivo funcional con soporte de arrastre de nodos, zoom y redimensionamiento de áreas.
- [x] Motor de validación de arquitectura en tiempo real (`validateArchitecture`) con detección de riesgos de seguridad y cuellos de botella de RAM.
- [x] Exportación a paquete ZIP auto-contenido con configuraciones completas de Docker Compose, scripts de aprovisionamiento en Bash (`setup.sh`, backups) y aprovisionamiento con Terraform.
- [x] Capa de persistencia serverless integrada con Vercel KV.
- [x] Configuración inicial e integración de PCA (Project Context Architecture) para la gestión del contexto.
- [x] Implementación de mejoras de experiencia de usuario: Snap-to-Grid, expansión del catálogo (Supabase, Cron) y badge dinámico de simulación de costos.
- [x] Creación del CLI de InfraDraw desacoplado (`infradraw-cli`) con comandos de validación, compilación a IaC y creación interactiva de topologías desde la terminal.
- [x] Integración de Google Cloud (GCP) como proveedor principal con despliegue completo de Terraform.
- [x] Creación de un asistente DevOps interactivo en Telegram embebido en la topología con diagnóstico de salud de contenedores y recursos (CPU/RAM/Disco) usando Gemini AI y soporte para auto-escalado interactivo en GCP.
- [x] Selector global de nube (Private Cloud vs GCP) en el canvas con equivalencias de servicios de GCP, locking de proveedores a 'gcloud' y Terraform nativo para Google Cloud Storage (GCS).

