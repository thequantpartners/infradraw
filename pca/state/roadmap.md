# Roadmap: InfraDraw

## In Process

- [ ] Conectar las APIs reales de aprovisionamiento de GCP (o ejecutar Terraform en el backend) a través del botón "Desplegar" en Railway.
- [ ] Implementar un backend dedicado para el DevOps Bot de Telegram en Railway para procesar comandos reales de GCP y enviar alertas de Cloud Monitoring.

## Pending

- [ ] Agregar soporte para exportación directa a plantillas de EasyPanel.
- [ ] Implementar el historial de versiones (histórico de guardado) en el dashboard de proyectos usando la base de datos de Railway.
- [ ] Desarrollar una interfaz de colaboración en vivo (WebSockets) en Railway compartiendo salas de diseño entre usuarios.

## Done

- [x] Evolución a InfraDraw v2 enfocado en una experiencia 100% visual y simplificada para usuarios no programadores.
- [x] Migración completa del backend a un servidor Express integrado en `server.js` y `package.json` para despliegue unificado en Railway.
- [x] Remoción del subproyecto CLI (`cli/`) obsoleto del repositorio para eliminar código duplicado y mantener el núcleo en la web.
- [x] Implementación de Wizard de Onboarding interactivo de 4 pasos con opción de omisión en el canvas.
- [x] Asistente de Diseño de IA (Gemini Architect Chat) que dibuja la topología de GCP automáticamente y responde con preguntas proactivas.
- [x] Live Dashboard de monitoreo simulado de CPU/RAM de servicios de GCP en el canvas.
- [x] DevOps Bot de Telegram (Autopilot) con alertas de remediación interactivas y parser de comandos de infraestructura por texto.
- [x] Panel de Calculadora y Simulador de Costes GCP con sliders dinámicos de tráfico y almacenamiento y proyecciones a 12 meses.
- [x] Corrección de condición de carrera en inicialización del canvas para proyectos autenticados con Firebase Auth.
- [x] Rediseño UX/UI premium del Dashboard de proyectos (`index.html`) con tipografía Inter y estética moderna dark-mode glassmorphic.
- [x] Migración completa a un modelo SaaS con autenticación Firebase (Google Sign-In), almacenamiento persistente por usuario con Vercel KV, y pasarela de pago Lemon Squeezy (Planes FREE y PRO).
- [x] Rediseño de interfaz responsiva móvil para el Landing Page de promoción de la plataforma y el dashboard de proyectos.
- [x] Validación y restricción en tiempo de ejecución de planes (GCP bloqueado para plan FREE, bot de Telegram con limitaciones en alertas) tanto en la web como en la CLI.
- [x] Implementar soporte nativo para importar topologías de red desde archivos JSON con algoritmo de Auto-Layout bidireccional de manera visual.
- [x] Canvas interactivo funcional con soporte de arrastre de nodos, zoom y redimensionamiento de áreas.
- [x] Motor de validación de arquitectura en tiempo real (`validateArchitecture`) con detección de riesgos de seguridad y cuellos de botella de RAM.
- [x] Exportación a paquete ZIP auto-contenido con configuraciones completas de Docker Compose, scripts de aprovisionamiento en Bash (`setup.sh`, backups) y aprovisionamiento con Terraform.
- [x] Capa de persistencia serverless integrada con Vercel KV.
- [x] Configuración inicial e integración de PCA (Project Context Architecture) para la gestión del contexto.
- [x] Implementación de mejoras de experiencia de usuario: Snap-to-Grid, expansión del catálogo (Supabase, Cron) y badge dinámico de simulación de costos.
- [x] Integración de Google Cloud (GCP) como proveedor principal con despliegue completo de Terraform.
- [x] Selector global de nube (Private Cloud vs GCP) en el canvas con equivalencias de servicios de GCP, locking de proveedores a 'gcloud' y Terraform nativo para Google Cloud Storage (GCS).
- [x] Implementación de un Superadmin Dashboard (`/admin.html`) para visualizar usuarios registrados, gestionar sus planes (FREE/PRO) y bloquear acceso a cuentas de forma segura.

