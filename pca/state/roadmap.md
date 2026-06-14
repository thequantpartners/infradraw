# Roadmap: InfraDraw

## In Process

- [ ] Sincronizar el canvas interactivo con el CLI de PCA para permitir importación y exportación de metadatos directamente a los archivos de configuración local.
- [ ] Implementar soporte nativo para importar topologías de red desde archivos JSON o YAML de manera visual.

## Pending

- [ ] Agregar soporte para exportación directa a plantillas de EasyPanel.
- [ ] Implementar el historial de versiones (histórico de guardado) en el dashboard de proyectos usando Vercel KV.
- [ ] Desarrollar una interfaz de colaboración en vivo (WebSockets) compartiendo salas de diseño entre desarrolladores.

## Done

- [x] Canvas interactivo funcional con soporte de arrastre de nodos, zoom y redimensionamiento de áreas.
- [x] Motor de validación de arquitectura en tiempo real (`validateArchitecture`) con detección de riesgos de seguridad y cuellos de botella de RAM.
- [x] Exportación a paquete ZIP auto-contenido con configuraciones completas de Docker Compose, scripts de aprovisionamiento en Bash (`setup.sh`, backups) y aprovisionamiento con Terraform.
- [x] Capa de persistencia serverless integrada con Vercel KV.
- [x] Configuración inicial e integración de PCA (Project Context Architecture) para la gestión del contexto.
- [x] Implementación de mejoras de experiencia de usuario: Snap-to-Grid, expansión del catálogo (Supabase, Cron) y badge dinámico de simulación de costos.
- [x] Creación del CLI de InfraDraw desacoplado (`infradraw-cli`) con comandos de validación, compilación a IaC y creación interactiva de topologías desde la terminal.

