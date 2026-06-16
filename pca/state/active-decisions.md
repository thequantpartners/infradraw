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

## 8. Arquitectura del DevOps Bot y Notificaciones (Con IA y Auto-Remediación)
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** Se requiere monitorear la infraestructura exportada e interactuar con ella desde Telegram de manera segura y sin SSH directo, diagnosticando errores con IA y ejecutando auto-remediación según la nube.
*   **Decisión:** Inyectar dinámicamente un bot en Node.js (`bot/index.js`) con soporte de Gemini (`gemini-2.5-flash`), monitoreo de recursos del VPS (disco, RAM, carga de CPU) y eventos Docker. En Private Cloud el bot asiste diagnósticamente y ofrece botones para operación manual (`Solucionar yo mismo`). En GCP (`gcloud`), el bot integra el SDK `@google-cloud/compute` permitiendo realizar auto-escalado interactivo de la instancia (`Aplicar Solución Sugerida`). Adicionalmente, el bot responde dudas y consultas técnicas en chat abierto y envía un reporte de heartbeat `"Todo OK"` cada hora.

## 9. Selector Global de Nube y Nodos Equivalentes de GCP
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** Se necesita facilitar al usuario el diseño de topologías enfocadas a Google Cloud Platform (GCP) mostrando nombres, iconos y herramientas nativas de este proveedor sin distorsionar el motor original de Docker-first ni perder soporte de Cloudflare.
*   **Decisión:** Implementar un selector dinámico en el canvas React que modifica la paleta de componentes para mostrar las equivalencias nativas de GCP (Compute Engine, Cloud SQL, Cloud Storage). Al usar este modo, los VPS/Compute Engine quedan automáticamente bloqueados con el proveedor `gcloud` en su panel de configuración. Adicionalmente, el compilador genera Terraform nativo para buckets de Google Cloud Storage (`google_storage_bucket`) si se añade almacenamiento.

## 10. Integración de Autenticación de Firebase (Google Sign-In)
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** Necesitamos un método seguro y rápido para autenticar usuarios en la landing page y en la SPA sin gestionar contraseñas ni hashes propios.
*   **Decisión:** Integrar Firebase Auth SDK (v10.12) con el proveedor de Google tanto para la web como para el inicio de sesión del CLI.

## 11. Base de Datos Aislada por Usuario en Vercel KV (Redis)
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** Para soportar un esquema multi-inquilino (SaaS), los proyectos guardados deben estar asociados a cada usuario específico y aislados del resto.
*   **Decisión:** Almacenar los diagramas y configuraciones en Vercel KV utilizando claves con el prefijo `user:{uid}:projects` y `user:{uid}:project:{id}`, verificando siempre el token de Firebase en cada petición.

## 12. Pasarela de Pagos (Lemon Squeezy) y Restricción de Planes
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** Se quiere comercializar InfraDraw con un plan FREE (nubes privadas) y un plan PRO de $99 USD (con soporte GCP y alertas avanzadas del bot DevOps en Telegram).
*   **Decisión:** Conectar un webhook serverless a Lemon Squeezy para escuchar actualizaciones de suscripciones. En el compilador web y la CLI se restringe la generación de IaC de GCP y opciones avanzadas si el plan del usuario no es PRO.

## 13. Autenticación Local de CLI mediante Servidor Temporal (OAuth Device Flow)
*   **Fecha:** 2026-06-14
*   **Estado:** Aprobado
*   **Contexto:** El CLI debe autenticarse contra la base de datos de InfraDraw de forma segura sin pedirle al usuario que escriba manualmente sus tokens Firebase.
*   **Decisión:** Implementar un flujo donde `infradraw login` inicia un servidor HTTP local en un puerto aleatorio alto, abre el navegador apuntando a `/cli-auth?port={port}`, y tras el login con Google de Firebase, el navegador envía los tokens vía POST localmente al CLI. Las credenciales se guardan en `~/.infradraw/auth.json`.

## 14. Refactorización del Bot DevOps para Zero-Cost Monitoring y Self-Healing
*   **Fecha:** 2026-06-15
*   **Estado:** Aprobado
*   **Contexto:** Se detectó que el monitoreo de recursos en el host usando comandos shell como subprocesos consumía ciclos innecesarios. Adicionalmente, el bot requería interacción manual para comandos repetitivos.
*   **Decisión:** Reemplazar el chequeo de CPU/RAM por APIs nativas de Node.js (`os`). Cambiar el prompt de Gemini a salida JSON estricta y dotar al bot de memoria local (`playbooks.json`) para habilitar capacidades de "Ejecutar y Recordar" (Auto-Healing). Se mantiene soporte heurístico dual sin API Key.

## 15. Superadmin Dashboard y Control de Acceso (Ban)
*   **Fecha:** 2026-06-16
*   **Estado:** Aprobado
*   **Contexto:** Se necesitaba una forma de gestionar los usuarios, asignar planes PRO y bloquear acceso a usuarios problemáticos, sin tener que usar el CLI de Vercel manualmente.
*   **Decisión:** Implementar `admin.html` validando el correo del superadministrador vía variable de entorno en el backend (`SUPERADMIN_EMAIL`). Se agregó el estado `status` ('active' o 'blocked') a KV para revocar el acceso desde el `onAuthStateChanged` principal (`index.html`) cuando una cuenta es suspendida, impidiendo su auto-bloqueo.
