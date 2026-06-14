# Active Decisions

## 1. Uso de PCA en Modo `local-only`
*   **Fecha:** 2026-06-13
*   **Estado:** Aprobado
*   **Contexto:** El proyecto no requiere actualmente indexación semántica en la nube ni tiene credenciales de OpenAI activas en local.
*   **Decisión:** Utilizar el modo offline `local-only` de PCA CLI para llevar el histórico de cambios de contexto sin dependencias externas de red o API keys.

## 2. Frontend Autocontenido en archivos HTML únicos
*   **Fecha:** 2026-06-13
*   **Estado:** Aprobado
*   **Contexto:** Se busca un despliegue rápido, simple y sin herramientas de compilación complejas.
*   **Decisión:** Todo el flujo interactivo de canvas se ejecuta en [canvas.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/canvas.html) e [index.html](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/index.html) cargando React y ReactDOM desde CDNs públicos.

## 3. Persistencia Serverless con Vercel KV (Redis)
*   **Fecha:** 2026-06-13
*   **Estado:** Aprobado
*   **Contexto:** Se requiere guardar los diagramas de los usuarios sin crear un backend pesado de base de datos ni manejar autenticación compleja.
*   **Decisión:** Utilizar Vercel KV en endpoints Serverless (`api/project` y `api/projects`) para leer y escribir estados directamente en formato JSON.

## 4. Adopción de Flujo de Trabajo PCA-First y Reporte Obligatorio de Fallos
*   **Fecha:** 2026-06-13
*   **Estado:** Aprobado
*   **Contexto:** Garantizar la consistencia del contexto del repositorio para cualquier agente que entre al espacio de trabajo.
*   **Decisión:** Obligar el uso por defecto de los comandos del CLI de PCA (status, commit, logs, doctor) en cada tarea y la detención inmediata con reporte detallado ante cualquier error del entorno o pruebas.

## 5. Simulador de Costos y Nodos como Parte del Frontend Nativo
*   **Fecha:** 2026-06-13
*   **Estado:** Aprobado
*   **Contexto:** Se solicitó evaluar e implementar mejoras en la experiencia de usuario (alineación, nuevos nodos y evaluación de costos).
*   **Decisión:** Mantener la implementación de estas mejoras puramente en el cliente (`canvas.html`), aprovechando el ciclo de renderizado nativo de la SPA para calcular estimaciones de precio sin agregar complejidad de dependencias externas.

## 6. Algoritmo de Auto-Layout (Fallback) para Sincronización Bidireccional
*   **Fecha:** 2026-06-13
*   **Estado:** Aprobado
*   **Contexto:** Para asegurar que un desarrollador o IA pueda editar a mano los archivos `infradraw.json` sin conocer las coordenadas X/Y de los nodos.
*   **Decisión:** En lugar de requerir posiciones absolutas en el JSON importado, el parser en `canvas.html` se ha dotado de un algoritmo de Auto-Layout en `sanitizeCanvas` que asume coordenadas por defecto y acomoda los nodos en forma de grid dentro de sus contenedores si detecta que faltan.

- [x] Evolución a Agentic CLI con Salidas JSON y Autodescubrimiento (Schema)
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** Facilitar que agentes autónomos de Inteligencia Artificial (IAs) integren y automaticen el ciclo de validación, compilación y generación de topologías de InfraDraw sin lidiar con formatos planos inconsistentes o wizards interactivos.
*   **Decisión:** Dotar a la CLI con flags `--json` para validar y compilar, implementar el comando interactivo/no-interactivo `create --non-interactive` y añadir el comando `schema` para autodescubrimiento de capacidades soportadas directamente como datos de salida estructurados.

## 8. Arquitectura del DevOps Bot y Notificaciones
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** Se requiere monitorear la infraestructura exportada e interactuar con ella desde Telegram de manera segura y sin SSH directo.
*   **Decisión:** Inyectar dinámicamente un bot nativo en Node.js en la carpeta `bot/` al compilar la arquitectura. El bot se enlaza a `/var/run/docker.sock` en modo solo lectura de eventos, y notifica proactivamente alertas con botones de reinicio interactivo inline.
