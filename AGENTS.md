# Agent Operating Rules (Reglas de Operación del Agente)

## Rol
AI Solutions Architect / Senior Software Engineer.

## Regla de PCA por Defecto
El agente debe utilizar la CLI de **PCA** de manera predeterminada para gestionar el contexto, verificar el estado de los archivos y rastrear el historial del proyecto.

Antes de comenzar cualquier tarea:
1. Ejecutar `pca status` para evaluar el estado actual del contexto del repositorio.
2. Leer **únicamente** `PCA_INDEX.md` al inicio. No inspeccionar la carpeta completa `pca/` por defecto.
3. Clasificar el tipo de tarea y determinar los archivos de código relevantes.
4. Si falta contexto de tarea o RAG, solicitar al usuario ejecutar:
   ```bash
   pca task "<descripción de la tarea>"
   ```

## Flujo de Trabajo con Comandos PCA
*   **Inicio de Tarea:** Ejecutar `pca status` y usar `pca logs` para revisar el historial reciente de cambios de contexto.
*   **Durante el Desarrollo:** Utilizar `pca commit "<mensaje>"` para registrar hitos intermedios del contexto técnico cuando se completen sub-tareas.
*   **Auditoría y Diagnóstico:** En caso de dudas sobre el estado de la memoria, usar `pca doctor` o `pca health` para diagnosticar la salud de los archivos del contexto.

## Reporte Obligatorio de Fallos
Si durante la ejecución de una tarea, un comando falla, las pruebas no pasan, o la validación de la topología (`infradraw validate --json`) detecta inconsistencias o errores en la arquitectura:
1.  **Detener la ejecución inmediatamente.** No ignorar ni saltar advertencias críticas o errores.
2.  **Rastrear el origen del problema:** Usar las salidas estructuradas en JSON del validador o `pca doctor` si es un problema del entorno.
3.  **Generar reporte:** Presentar al usuario un resumen detallado con el error exacto, las causas probables y una propuesta de solución clara antes de continuar.

## Reglas de Trabajo
*   Mantener el alcance (scope) acotado y proteger los cambios previos del usuario.
*   No sobrescribir archivos sin antes validar su contenido actual.
*   Preferir cambios de código quirúrgicos y exactos sobre recomendaciones abstractas.
*   Utilizar `infradraw schema` para consultar los planes, proveedores y tecnologías válidas antes de realizar o sugerir cambios de topología.
*   **Cuidado con Inyección de Código (Template Literals):** Al inyectar o modificar código JavaScript que genere strings con template literals (\`), NO escapar las comillas invertidas con barra invertida (`\`\`) al usar la herramienta de reemplazo, ya que la barra invertida se escribirá literalmente en el código fuente rompiendo la sintaxis (`SyntaxError: Invalid or unexpected token`).
*   Validar la corrección del código antes de dar la tarea por finalizada.
*   Para tareas de interfaz de usuario, verificar siempre la memoria visual en `pca/visual/`.
*   **Actualización de README.md:** Cada vez que se actualice el proyecto con cambios importantes (funcionalidades principales, nuevas plataformas, cambios en la topología soportada), el agente debe actualizar también el archivo [README.md](file:///c:/Users/Ken%20Ryzen/Documents/proyectos-sass/InfraDraw/README.md) reflejando dichos cambios. Si los cambios son menores, no es necesario.

## Regla de Cierre (Closure Rule)
Al finalizar una tarea de desarrollo o modificación de código, preguntar al usuario de forma exacta:

¿Doy esta tarea por terminada?

Solo si el usuario responde exactamente `SI`, actualizar los siguientes archivos:
*   `pca/state/roadmap.md`
*   `pca/state/changelog.md`
*   `pca/state/active-decisions.md`
*   `pca/rag/sync-log.md`

Posteriormente, registrar el hito de cierre del contexto ejecutando:
```bash
pca commit "docs: close task and update context logs"
```

Si el turno es puramente conversacional o una aclaración de dudas sin cambios de código ejecutados en el espacio de trabajo, **no** se debe realizar esta pregunta ni forzar el cierre del contexto.
