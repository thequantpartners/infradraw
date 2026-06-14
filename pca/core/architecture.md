# Architecture: InfraDraw

El proyecto InfraDraw se compone de una arquitectura distribuida y desacoplada, con un fuerte enfoque en velocidad y simplicidad local (Single Page Application auto-contenida).

## 1. Capa de Frontend (Cliente Canvas)
*   **Tecnología:** React SPA sin bundlers. Todo el código de interfaz, interacción y lógica se encuentra en [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html) e [index.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/index.html).
*   **Renderizado Visual:** El canvas interactivo utiliza elementos **SVG** nativos para renderizar las conexiones de nodos mediante cálculo de colisiones por bordes (`edgePoint`) y trazados cúbicos/rectos con flechas.
*   **Controles de Pan y Zoom:** Implementa manipulación directa del sistema de coordenadas y la matriz de transformación SVG usando eventos de ratón (arrastre con espacio o botón derecho) y scroll para el zoom dinámico.
*   **Gestión de Dependencias:** React, ReactDOM y JSZip se importan directamente desde CDNs de producción (`unpkg` y `cdnjs`), eliminando la necesidad de un proceso de compilación (`npm run build`) en local.

## 2. Capa de Backend (Vercel Serverless + Redis)
*   **Endpoints:**
    *   `GET /api/projects` y `POST /api/projects` en [projects.js](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/api/projects.js): Lista los proyectos existentes y crea nuevos registros base.
    *   `GET /api/project`, `PUT /api/project` y `DELETE /api/project` en [project.js](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/api/project.js): Obtiene el canvas detallado de un diagrama, guarda sus cambios de estado o lo elimina.
*   **Persistencia:** Utiliza **Vercel KV (Upstash Redis)** como base de datos de pares clave-valor estructurados:
    *   `projects_list`: JSON que almacena el índice general de diagramas (id, nombre, metadatos, conteos).
    *   `project:${id}`: JSON que contiene el objeto completo del canvas del proyecto (nodos, conexiones, posiciones y transformaciones).

## 3. Motor de Validación de Arquitectura (`validateArchitecture`)
El motor evalúa en tiempo real las reglas descritas en [CLAUDE.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/CLAUDE.md):
*   **Errores Críticos:**
    *   Bases de datos (Postgres, Redis) colocadas fuera de contenedores VPS.
    *   Servicios de Redis con contraseña deshabilitada (`password_required === false`).
    *   AI Service (`FastAPI`) conectado directamente a un nodo de Internet público.
    *   VPS sin proveedor de nube seleccionado.
*   **Advertencias (Warnings):**
    *   VPS pequeños (como el plan `cx21` de Hetzner) alojando más de 3 servicios simultáneos (riesgo de falta de RAM).
    *   Ausencia de `PgBouncer` cuando existen múltiples instancias del servicio `backend` conectadas a Postgres.
    *   Uso de múltiples servidores VPS con proveedores que no soportan red privada local (por ejemplo, Contabo), forzando tráfico público inseguro.
    *   Ausencia de un nodo de Storage configurado con propósito de copias de seguridad (`backups`) cuando hay Postgres activo.
    *   Sugerencia de migración a Kubernetes (K3s) cuando se detectan 3 o más VPS dedicados a la aplicación.

## 4. Pipeline de Exportación (Generación de ZIP)
Utilizando la biblioteca `JSZip`, el canvas compila un paquete de despliegue personalizado basado en el escenario detectado (VPS único, VPS de App + VPS de Base de Datos dedicada, o Swarm/Multinodo):
*   **docker-compose.yml:** Orquesta los contenedores con redes Docker aisladas (`public`, `internal`, `db`) y políticas de reinicio.
*   **Configuraciones optimizadas:** Archivos a medida como `traefik.yml` para proxy SSL, y configuraciones de memoria ajustadas en `postgresql.conf` o `redis.conf` según la RAM del plan del VPS elegido.
*   **Herramientas de Operación:** Scripts de Bash para aprovisionamiento (`setup.sh`), automatización de copias de seguridad de Postgres (`backup.sh`) y restauración de backups (`restore.sh`).
*   **Infraestructura como Código:** Configuración en Terraform (`main.tf`, `variables.tf`, `outputs.tf`) para desplegar los VPS en Hetzner u otros proveedores seleccionados, y configurar los registros DNS en Cloudflare.
