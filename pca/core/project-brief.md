# Project Brief: InfraDraw

## Propósito del Proyecto
InfraDraw es un canvas interactivo diseñado para modelar, visualizar y validar arquitecturas de infraestructura con un enfoque **Docker-first**. La herramienta ayuda a desarrolladores, arquitectos de soluciones y profesionales de DevOps a diseñar diagramas de infraestructura locales o distribuidos, asegurando la aplicación de mejores prácticas de configuración y despliegue técnico de manera automatizada.

## Audiencia
*   **Desarrolladores y DevOps** que necesitan planificar y documentar el despliegue de sus aplicaciones.
*   **Arquitectos de Soluciones** que buscan validar rápidamente si un diseño cumple con principios de seguridad y escalabilidad antes de aprovisionarlo.
*   **Creadores de Software (Indie Hackers)** que configuran stacks autosuficientes en VPS económicos y requieren archivos listos para producción.

## Criterios de Éxito
1.  **Interactividad fluida:** Permitir el diseño visual intuitivo a través de un canvas dinámico (pan, zoom, conexiones mediante flechas, agrupamiento en contenedores/VPS).
2.  **Validación en tiempo real:** Detectar e informar de inmediato sobre errores de seguridad críticos (por ejemplo, servicios de bases de datos expuestos o Redis sin contraseña) y advertencias de capacidad física (como sobrecargar un VPS pequeño).
3.  **Generación de código:** Exportar un paquete `.zip` completo y funcional que contenga la configuración de Docker Compose, scripts de aprovisionamiento en Bash (`setup.sh`, backups), configuración optimizada de bases de datos (`postgresql.conf`), y plantillas de aprovisionamiento con Terraform.
