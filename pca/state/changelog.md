# Changelog

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

