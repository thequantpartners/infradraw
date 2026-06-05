\# InfraDraw — Contexto del Proyecto



\## Qué es esto

Canvas interactivo para diseñar diagramas de infraestructura Docker-first.

El usuario describe su sistema y el canvas lo renderiza visualmente.

Herramienta interna, sin backend, sin auth.



\## Stack del proyecto

\- React (SPA, sin framework)

\- SVG para canvas y conexiones

\- Sin dependencias externas

\- Todo en un solo `index.html` autocontenido



\## Stack de infraestructura que modela esta herramienta

Docker + Hetzner + EasyPanel + Traefik + Cloudflare



\*\*Servicios soportados como nodos:\*\*

Traefik, Frontend (Next.js), Backend (Node.js), AI Service (FastAPI),

PostgreSQL, Redis, Cloudflare, Hetzner VPS, Load Balancer, Wasabi,

Prometheus, Grafana, Loki, PgBouncer, BullMQ



\## Niveles de infraestructura de referencia

\- Nivel 0 MVP: 1× CX31 (\~$20/mes)

\- Nivel 1 Tracción: CX41 + CX21 DB (\~$70/mes)

\- Nivel 2 Crecimiento: 2× CX41 + LB + DB dedicada (\~$140/mes)

\- Nivel 3 Escala: K3s multi-nodo (\~$300+/mes)



\## Principios de arquitectura (aplicar siempre)

\- Servicios internos NUNCA expuestos públicamente (ai-service, Redis, PostgreSQL)

\- Redes Docker separadas: public / internal / db

\- Siempre healthchecks en todos los servicios

\- Redis siempre con contraseña, incluso en red interna

\- Escalar solo cuando hay síntomas sostenidos 72h+

\- Nunca escalar backend horizontal sin resolver WebSockets (Redis pub/sub)

\- Migrations siempre backward-compatible (3 fases)



\## Decisiones técnicas del canvas

\- Pan: espacio+drag o click derecho

\- Zoom: scroll

\- Conexiones: click nodo origen → click nodo destino → flecha SVG

\- Editar etiqueta: doble click sobre el nodo

\- Eliminar: tecla Delete o botón



\## Archivos clave

\- `index.html` — toda la app

\- `CLAUDE.md` — este archivo



\## Lo que NO hace (por ahora)

\- No guarda estado

\- No exporta

\- No tiene backend

