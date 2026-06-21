# Walkthrough_V2.md — InfraDraw v2 (DevOps Copilot en GCP)

> Guía técnica de la evolución de InfraDraw a un **Copiloto de DevOps 100% Google Cloud** para usuarios no técnicos.
> Pensado para el siguiente desarrollador/IA que conecte las APIs reales (Gemini / GCP / Telegram).

---

## 1. Resumen de la entrega

InfraDraw v2 añade, de forma **aditiva y quirúrgica** sobre el canvas existente, cuatro grandes funcionalidades:

1. **Wizard de onboarding** en 4 pasos (Conectar GCP → Arquitecto IA → Autopilot → Presupuesto) con botón *“Omitir configuración por ahora”*.
2. **Arquitecto IA (chat Gemini)** que dibuja la topología de GCP a partir de lenguaje natural y refina con preguntas, más un botón **“Desplegar en GCP”**.
3. **Optimizador + Autopilot (bot de Telegram)**: dashboard de monitorización en vivo (CPU/RAM simuladas) y alertas interactivas con `[Ejecutar Solución]` / `[Hacerlo yo mismo]`, además de control por lenguaje natural (`/infra levanta otra instancia…`).
4. **Simulador de costes de GCP (Pricing Engine)** con selector de periodo (día/mes/año), sliders de tráfico y almacenamiento, desglose por servicio y recomendaciones de escalado.

Todo el frontend respeta la restricción **React 18 vía CDN, sin JSX** (`var h = React.createElement;`, patrón `h('tag', {props}, [hijos])`). El backend nuevo es una **Vercel Serverless Function** en `/api/`.

---

## 2. Archivos modificados / creados / eliminados

| Acción | Archivo | Descripción |
|---|---|---|
| **Eliminado** | `cli/` (carpeta completa) | Subproyecto CLI headless. El usuario final no programa; era código muerto. Sus funciones de coste (`getPlanRAM`/`getPlanCost`) ya existían de forma independiente en `canvas.html`, así que la eliminación es segura. |
| **Creado** | `api/ai-designer.js` | Endpoint del Arquitecto IA. Convierte un prompt en una topología GCP `{nodes, conns}`. Usa Gemini si hay `GEMINI_API_KEY`, si no un mock determinista por palabras clave. |
| **Creado** | `Walkthrough_V2.md` | Este documento. |
| **Modificado** | `canvas.html` | Toda la UI v2 (onboarding, chat IA, simulador, dashboard, Autopilot, overlay de despliegue) + motor v2 (pricing, IA local, métricas, parser de comandos). |
| **Modificado** | `CLAUDE.md` | Actualizado para reflejar la eliminación del CLI y las nuevas restricciones (React-sin-JSX, backend en `/api/`, alineación con `GCP_PRICING`). |
| **Sin cambios** | `vercel.json` | Verificado: los endpoints nuevos de `/api/*.js` se enrutan automáticamente; no hizo falta añadir rewrites. |

---

## 3. Backend — `api/ai-designer.js`

**Ruta:** `POST /api/ai-designer`
**Entrada:** `{ prompt: string, answers?: object }`
**Salida:** `{ source, message, followUp, assumptions, nodes:[{id,type,label}], conns:[{from,to}] }`

| Función | Rol |
|---|---|
| `setCors(res)` | Cabeceras CORS + manejo de `OPTIONS`. |
| `mockDesign(prompt, answers)` | Parser determinista por palabras clave (ES/EN). Detecta frontend, backend, BD, NoSQL, Redis, storage, IA, search, colas, email; deduce alto tráfico / multirregión (por palabras o por `answers.users`/`answers.multiRegion`); arma nodos + conexiones con layered linking; genera `assumptions` y un `followUp` proactivo. **`source: 'mock'`**. |
| `geminiDesign(prompt, answers)` | Llamada real a `generativelanguage.googleapis.com/.../{GEMINI_MODEL}:generateContent` con `responseMimeType: 'application/json'` y una *system instruction* que fuerza el esquema y el catálogo de `type` válidos. Limpia ```` ```json ````, hace `JSON.parse`, y **sanea**: descarta nodos cuyo `type` no esté en `GCP_TYPES` y conexiones cuyos `from`/`to` no existan. **`source: 'gemini'`**. |
| `handler(req, res)` | Si hay `GEMINI_API_KEY` intenta Gemini; ante error o respuesta vacía cae al mock. Trunca el prompt a 2000 chars y exige prompt no vacío (400). |

**Variables de entorno:** `GEMINI_API_KEY` (opcional), `GEMINI_MODEL` (por defecto `gemini-1.5-flash`).
**Catálogo `GCP_TYPES`** (debe coincidir con `GCP_SERVICES` en el canvas): `internet, cloudflare, loadbalancer, vps, frontend, backend, ai, cron, postgres, redis, supabase, storage, email, meilisearch, bullmq, prometheus, grafana`.

---

## 4. Frontend — motor v2 en `canvas.html` (funciones de módulo, fuera de `App()`)

Todo el motor v2 es **browser-only y sin dependencias**, ubicado justo antes de `function App()`.

### 4.1 Pricing Engine (Simulador de costes)

| Símbolo | Descripción |
|---|---|
| `GCP_PRICING` | Objeto con tarifas aproximadas de `us-central1` en USD (Cloud Run req/vCPU·s/GiB·s, Cloud SQL, Memorystore, GCS + ops clase A/B, egress, Load Balancing, Scheduler, Search, Tasks, email, Vertex AI). |
| `fmtMoney(n)` | Formatea importes (`$1,234` / `$25` / `$0.40`). |
| `fmtVisits(v)` | Formatea visitas (`5M`, `250k`, `900`). |
| `computeGcpCosts(nodes, visits, storageGB)` | **Núcleo del simulador.** Modela `requests = visits*8` y `egressGB = visits*0.0015`. Recorre los nodos y produce una fila de coste **mensual** por servicio (`{type,icon,label,qty,amount}`). Devuelve `{ rows, monthlyTotal, recommendations }`. Reusa `getPlanCost('gcloud', plan)` para Compute Engine (alineación con `CLAUDE.md`). **Recomendaciones proactivas** según umbrales: ≥500k visitas → Load Balancer + réplicas; ≥1M → réplica de lectura Cloud SQL; ≥2M sin Redis → Memorystore; ≥200 GB → reglas de ciclo de vida Nearline/Coldline. |

El periodo (día/mes/año) se aplica en la UI multiplicando por `factor` (`day = 1/30.4`, `month = 1`, `year = 12`).

### 4.2 Arquitecto IA (fallback offline)

| Símbolo | Descripción |
|---|---|
| `aiDesignLocal(prompt, answers)` | **Espejo cliente de `mockDesign`.** Misma heurística de palabras clave y mismo formato de salida (`source: 'local'`). Garantiza que el chat funcione aunque `/api/ai-designer` falle o exceda el timeout. |

### 4.3 Simulador de monitorización (datos deterministas)

| Símbolo | Descripción |
|---|---|
| `hashStr(s)` | Hash FNV-1a → entero sin signo (semilla por nodo). |
| `mulberry32(a)` | PRNG determinista a partir de la semilla. |
| `METRIC_BASE` | Carga base por tipo de servicio (backend 60, ai 68, postgres 54…). |
| `simulateMetrics(node, boostMap)` | Genera serie de 20 puntos (seno + ruido determinista) y devuelve `{cpu, ram, series}`. `boostMap[node.id]` permite **bajar** la carga tras autoescalar. |
| `metricLevel(v)` / `metricColor(v)` | Umbrales `ok < 70 ≤ warn < 90 ≤ crit` y color GCP (verde/ámbar/rojo). |

### 4.4 Autopilot (parser de comandos NL)

| Símbolo | Descripción |
|---|---|
| `parseInfraCommand(text)` | Normaliza (quita prefijo `/infra`), mapea servicio por regex y acción por verbo. Devuelve `{action: 'add'\|'scale'\|'remove'\|'unknown', type?, label?, reply}`. Verbos: *levanta/crea/añade* → add, *escala/autoescala* → scale, *elimina/borra/apaga* → remove. |

---

## 5. Frontend — estado, lógica y render v2 dentro de `App()`

### 5.1 Estado nuevo (`useState`)

- **Onboarding:** `showOnboarding`, `onbStep`, `gcpConnected`, `gcpConnecting`, `gcpProject`, `tgConfig{enabled,token,chatId}`, `budget{daily,monthly}`.
- **Chat IA:** `showAI`, `chat[]`, `chatInput`, `aiThinking`, `aiAnswers`, `pendingField` (+ refs `aiMsgsRef`, `chatRef`, `aiAnswersRef`, `lastPromptRef`).
- **Simulador:** `showSim`, `simPeriod`, `simVisits`, `simStorage`.
- **Dashboard/Autopilot:** `showDash`, `showBot`, `tick`, `alerts[]`, `botLog[]`, `botCmd`, `boostMap`.
- **Despliegue:** `deploy` (`{step, steps, done}` o `null`).

El wizard se dispara una sola vez vía `localStorage('infradraw_onboarded_v2')`.

### 5.2 Lógica (handlers y efectos)

| Función / efecto | Rol |
|---|---|
| `finishOnboarding()` | Marca el flag en localStorage y cierra el wizard. |
| `connectGcp()` | **Simula** el OAuth de Google (1400 ms) y autoasigna un `gcpProject` aleatorio (`infradraw-prod-NNNN`). |
| `openAI()` | Abre el panel y siembra el saludo + chips de ejemplo. |
| `applyAITopology(topo)` | **Auto-dibujo.** Coloca los nodos en niveles (internet/cloudflare=0, loadbalancer=1, frontend=2, backend=3, datos=4), reasigna IDs con `uid()`, recrea conexiones, cambia a modo `gcp`, reemplaza el canvas y hace `fitToScreen()`. Usa `pushHistory()` para deshacer. |
| `sendChat(textOverride?)` | Hace `POST /api/ai-designer` con **timeout de 4.5 s** que cae a `aiDesignLocal`; gestiona la respuesta a un `followUp` previo (`pendingField`). |
| `handleAIResult(out, basePrompt)` | Aplica la topología, muestra el mensaje y, si hay `followUp`, añade chips de respuesta rápida. |
| `runDeploy()` | Overlay de despliegue **simulado** en 5 pasos animados (validar → Terraform → aprovisionar → VPC/healthchecks → Cloud Run). |
| `useEffect` *tick* | Cada 2600 ms incrementa `tick` (solo si dashboard/bot/Autopilot activos). |
| `useEffect` *alertas* | Si el Autopilot está activo y algún nodo supera **CPU ≥ 90%**, crea una alerta crítica (sin duplicar). |
| `fixAlert(a)` | `[Ejecutar Solución]`: aplica `boostMap[node] = -40` (autoescala), marca la alerta `resolved` y registra en el log. |
| `selfAlert(a)` | `[Hacerlo yo mismo]`: marca la alerta como gestión manual. |
| `runBotCommand()` | Ejecuta `parseInfraCommand` y materializa la acción en el canvas (`addCommandNode` / `removeCommandNode` / autoescalado vía `boostMap`). |

### 5.3 Render (componentes, todos con `h(...)`)

`metricBar`, `sparkPath` (helpers), `renderOnboarding`, `renderAIPanel`, `renderSimulator`, `renderDashboard`, `renderBot`, `renderDeploy`, y el lanzador flotante `v2Dock` (FABs: Simulador 🧮, Monitor, Autopilot 🚁 con badge de alertas, Arquitecto IA 🤖).

**Cableado final:**
```js
var stage = h('div', {className:'stage', ref:stageRef, onDrop, onDragOver},
  [svg, toolbar, connectBadge, emptyHint, hints, fileInput, v2Dock, loadingOverlay]);
return h('div', {className:'app'},
  [sidebar, stage, configPanel, validationModal, migrationModal,
   onboardingEl, aiPanelEl, simEl, dashEl, botEl, deployEl]);
```

---

## 6. ¿Qué es funcional vs. mock / listo-para-conectar?

| Área | Estado | Cómo conectar la API real |
|---|---|---|
| **Arquitecto IA** | ✅ **Funcional** (mock determinista) y ✅ **listo para Gemini real** | Define `GEMINI_API_KEY` (y opcional `GEMINI_MODEL`) en las env vars de Vercel. `api/ai-designer.js` ya llama a Gemini y sanea la salida. El cliente cae a `aiDesignLocal` si el endpoint falla. |
| **Simulador de costes** | ✅ **100% funcional** (cálculo local) | Tarifas en `GCP_PRICING`. Para precios exactos en tiempo real, sustituir por la **Cloud Billing Catalog API**; mantener el formato de filas de `computeGcpCosts`. |
| **Monitorización (dashboard)** | ⚠️ **Simulado** (determinista por nodo) | Reemplazar `simulateMetrics` por lecturas de la **Cloud Monitoring API** (métricas `run.googleapis.com/...`); conservar la forma `{cpu, ram, series}`. |
| **Autopilot / Telegram** | ⚠️ **Simulado en cliente** | La UI envía alertas y ejecuta comandos sobre el canvas. Falta: (a) un endpoint `/api/telegram-webhook` que reciba updates del bot, (b) usar `tgConfig.token`/`chatId` para enviar mensajes con botones inline vía la **Telegram Bot API**, (c) ejecutar las acciones reales en GCP. `parseInfraCommand` es reutilizable tal cual en el backend. |
| **Conexión a Google Cloud** | ⚠️ **Simulada** (`connectGcp`) | Implementar **OAuth real de Google** + selección de proyecto vía la **Cloud Resource Manager API**; rellenar `gcpProject` con el Project ID real. |
| **Desplegar en GCP** | ⚠️ **Simulado** (`runDeploy`, overlay animado) | Sustituir los pasos por un pipeline real: generar Terraform/Deployment Manager y aplicarlo (p. ej. Cloud Build), reportando progreso a `setDeploy`. |
| **Persistencia / Auth** | ✅ **Funcional** (preexistente) | Firebase Auth + Vercel KV ya operativos; el estado v2 (`tgConfig`, `budget`, `gcpProject`) puede persistirse extendiendo `api/user.js` cuando se requiera. |

---

## 7. Notas para el siguiente desarrollador

- **No introducir build step ni JSX.** Cualquier UI nueva debe seguir `var h = React.createElement` y el patrón `h('tag', {props}, [hijos])`.
- **Secretos solo en `process.env`** (Vercel env vars). Nunca enviarlos al cliente.
- **El canvas está protegido por auth** (redirige a `landing.html` sin sesión), por lo que no se puede verificar headless cargándolo en un navegador. Para validar el JS, extraer el `<script>` inline y ejecutar `node --check`.
- **Mantener el catálogo sincronizado:** `GCP_TYPES` (en `api/ai-designer.js`) debe coincidir con `GCP_SERVICES` (en `canvas.html`); si añades un servicio, actualiza ambos, `METRIC_BASE` y `computeGcpCosts`.
- **Alineación de costes:** los planes de Compute Engine siguen pasando por `getPlanCost('gcloud', plan)`; el resto de GCP por `GCP_PRICING`. Mantener ambos coherentes (constraint de `CLAUDE.md`).

---

## 8. Despliegue en Railway (migración desde Vercel)

A partir de v2.0, el backend deja de ser un conjunto de **Vercel Serverless Functions** y pasa a ser una **única app Node.js/Express** (`server.js`) que sirve las APIs **y** el frontend estático en el mismo puerto. El motivo es aprovechar el plan de pago de Railway ($5) y preparar la plataforma para operaciones de larga duración en segundo plano (despliegues reales en GCP, integración persistente del bot de Telegram) que el modelo serverless de Vercel no permite.

### 8.1 Cómo funciona la migración

Los handlers de `/api/*.js` ya usaban la firma de Vercel `module.exports = async (req, res) => { … }`, que es **directamente compatible con Express** (leen `req.headers` / `req.query` / `req.body` y responden con `res.status().json()` / `res.setHeader()`). Por eso **no se reescribió la lógica de las APIs**: `server.js` simplemente las importa y las monta con `app.all(ruta, require('./api/…'))`. Cada handler sigue despachando por método y validando internamente (devuelve `401` sin token, `405` para métodos no soportados, etc.), igual que en Vercel.

- `express.json({ limit: '10mb' })` reemplaza el parseo automático de body de Vercel (límite alto para diagramas grandes del canvas).
- El middleware `cors()` responde a los preflight `OPTIONS` (los handlers también ponen sus cabeceras CORS, es redundante pero inocuo).
- La persistencia sigue siendo **Upstash Redis vía REST** (`KV_REST_API_URL` / `KV_REST_API_TOKEN`), sin cambios: la función `redis()` de cada handler usa `fetch` global (Node 20+), que funciona idéntico en Railway.
- El ruteo estático replica los `rewrites` de `vercel.json`; ya **no se usa `vercel.json`** en Railway.

### 8.2 Archivos cambiados en esta migración

| Acción | Archivo | Descripción |
|---|---|---|
| **Creado** | `package.json` (raíz) | Define deps (`express`, `cors`, `dotenv`, `fs-extra`), script `start: node server.js` y `engines.node: 20.x`. Antes no existía un `package.json` en la raíz. |
| **Creado** | `server.js` (raíz) | Servidor Express unificado. Monta todas las APIs de `/api/` y sirve el frontend estático. Punto de entrada de Railway (`npm start`). |
| **Sin cambios (lógica)** | `api/*.js` (incl. `api/admin/*.js`, `api/webhooks/lemonsqueezy.js`) | Reutilizados tal cual; son compatibles con Express. No asumen variables específicas de Vercel. |
| **Obsoleto en Railway** | `vercel.json` | Su comportamiento (rewrites + headers) lo asume ahora `server.js`. Se conserva en el repo por si se mantiene un despliegue paralelo en Vercel, pero Railway lo ignora. |

**Tabla de rutas (equivalencia con `vercel.json`):**

| Ruta | Sirve |
|---|---|
| `GET /` | `landing.html` |
| `GET /canvas` | `canvas.html` |
| `GET /app` | `index.html` |
| `GET /cli-auth` | `cli-auth.html` |
| `POST /api/auth-sync` | `api/auth-sync.js` |
| `GET·PUT /api/user` | `api/user.js` |
| `GET·POST /api/projects` | `api/projects.js` |
| `GET·PUT·DELETE /api/project` | `api/project.js` |
| `POST /api/ai-designer` | `api/ai-designer.js` |
| `POST /api/webhooks/lemonsqueezy` | `api/webhooks/lemonsqueezy.js` |
| `GET /api/admin/users` | `api/admin/users.js` |
| `PUT /api/admin/user` | `api/admin/user.js` |
| resto (`admin.html`, assets…) | `express.static(__dirname)` (dotfiles ignorados → `.env` nunca se sirve) |

### 8.3 Pasos para desplegar en Railway

1. **Crear el proyecto en Railway:** en [railway.app](https://railway.app) → *New Project* → *Deploy from GitHub repo* y selecciona el repositorio de InfraDraw. Railway detecta Node automáticamente.
2. **Build & Start:** sin configuración extra. Railway ejecuta `npm install` y luego `npm start` (= `node server.js`). El `engines.node: 20.x` del `package.json` fija la versión de Node.
3. **Configurar variables de entorno** (pestaña *Variables* del servicio) — ver §8.4.
4. **Puerto:** no configures `PORT` a mano; Railway lo inyecta y `server.js` lo lee con `const PORT = process.env.PORT || 3000`.
5. **Dominio:** en *Settings → Networking → Generate Domain* para obtener una URL pública (`*.up.railway.app`).
6. **Webhook de Lemon Squeezy:** apunta la URL del webhook en el panel de Lemon Squeezy a `https://TU-DOMINIO.up.railway.app/api/webhooks/lemonsqueezy`.
7. **Firebase:** añade el dominio de Railway a *Authentication → Settings → Authorized domains* en la consola de Firebase para que el login funcione desde producción.

### 8.4 Variables de entorno requeridas

| Variable | Obligatoria | Para qué |
|---|---|---|
| `PORT` | No (auto) | Railway la inyecta; `server.js` la usa. No definirla manualmente. |
| `KV_REST_API_URL` | Sí | Endpoint REST de Upstash Redis (persistencia de usuarios/proyectos). |
| `KV_REST_API_TOKEN` | Sí | Token REST de Upstash Redis. |
| `FIREBASE_WEB_API_KEY` | Sí | Verificación de los ID tokens de Firebase en los endpoints autenticados. |
| `GEMINI_API_KEY` | No | Activa el Arquitecto IA real; sin ella, `api/ai-designer.js` usa el mock determinista. |
| `GEMINI_MODEL` | No | Modelo de Gemini (por defecto `gemini-1.5-flash`). |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Sí (para pagos) | Verifica la firma `x-signature` del webhook de Lemon Squeezy. |
| `SUPERADMIN_EMAIL` | No | Email con acceso al panel `/admin.html` (por defecto `thequantpartners@gmail.com`). |

### 8.5 Verificación local

```bash
npm install
# Opcional: crea un .env en la raíz con las variables de §8.4 (dotenv lo carga)
npm start            # = node server.js  → http://localhost:3000
```

Comprobaciones rápidas (con el server arriba): `GET /` debe devolver `landing.html`; `GET /api/user` sin token debe devolver `401`; `POST /api/ai-designer` con `{"prompt":"..."}` debe devolver una topología `{nodes, conns}` (mock si no hay `GEMINI_API_KEY`).

### 8.6 Notas para el siguiente desarrollador IA

- **El punto de entrada en producción es `server.js`**, no Vercel. Cualquier endpoint nuevo se añade en dos pasos: crea el handler en `/api/` (firma `(req, res)`) y móntalo en `server.js` con `app.all('/api/tu-ruta', require('./api/tu-ruta'))`.
- **`fs-extra`** está declarado en `package.json` para la futura capa de despliegues reales/persistencia en disco; aún no se usa en `server.js`.
- **Las APIs no se modificaron**; si algo falla en producción, es casi seguro una **variable de entorno** mal configurada (revisa §8.4) y no la lógica.
- **El frontend no necesita cambios**: sigue llamando a rutas relativas `/api/...`, que ahora resuelve el mismo servidor Express.
