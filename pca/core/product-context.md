# Product Context: InfraDraw

## Usuarios y Casos de Uso
Los usuarios de InfraDraw interactúan con la herramienta para diseñar y verificar topologías de red que utilicen tecnologías modernas de contenedores. Un flujo de trabajo típico consiste en:
1.  **Iniciar un diagrama:** Crear un nuevo proyecto desde el panel principal.
2.  **Modelar elementos:** Colocar nodos de infraestructura (Bases de datos, Backends, Frontends, Servicios de IA, Balanceadores de carga, Object Storage, etc.).
3.  **Contenerizar:** Agrupar los nodos en áreas lógicas que representen servidores virtuales (Hetzner VPS, DigitalOcean droplets, etc.) o redes Docker privadas.
4.  **Establecer relaciones:** Conectar los componentes a través de flechas dirigidas para modelar el flujo de datos e identificar si hay tráfico público/privado incorrecto.
5.  **Ajustar propiedades:** Configurar cada nodo mediante un modal interactivo (⚙) para establecer variables específicas como proveedor, plan de RAM, credenciales y opciones de redundancia.
6.  **Validar y Corregir:** Analizar las alertas en tiempo real generadas por el motor de análisis y ajustar el diseño según las sugerencias.
7.  **Exportar:** Descargar el zip con los archivos de configuración listos para desplegar.

## Restricciones del Producto
*   **Diseño Docker-First y Costo-Eficiente:** La herramienta promueve arquitecturas prácticas modelando Hetzner, EasyPanel, Traefik, Docker Swarm y Cloudflare como el estándar dorado para startups y proyectos medianos.
*   **Seguridad por diseño:** Los servicios internos (Base de datos, Redis, ai-service) nunca deben estar expuestos a internet directo.
*   **Sin almacenamiento complejo:** El MVP funciona de manera local-first y almacena diagramas en el navegador o a través de un backend serverless conectado a Vercel KV (Upstash Redis) sin requerir autenticación pesada de usuario en esta fase.
