// POST /api/ai-designer — Gemini Architect.
// Recibe un prompt en lenguaje natural y devuelve una topología GCP estructurada
// (nodos + conexiones) que el canvas dibuja automáticamente.
//
// Comportamiento:
//   1. Si GEMINI_API_KEY está configurada en el entorno, llama a la API real de
//      Gemini pidiéndole JSON estructurado.
//   2. Si no hay clave o la llamada falla, usa un parser determinista por
//      palabras clave (mock) para que la función sea 100% usable sin credenciales.
//
// El frontend (canvas.html → applyAITopology) consume este mismo formato y tiene
// además su propia copia del mock como fallback offline.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Catálogo de servicios GCP que el canvas sabe dibujar (debe coincidir con
// GCP_SERVICES en canvas.html).
const GCP_TYPES = [
  'internet', 'cloudflare', 'loadbalancer', 'vps', 'frontend', 'backend',
  'ai', 'cron', 'postgres', 'redis', 'supabase', 'storage', 'email',
  'meilisearch', 'bullmq', 'prometheus', 'grafana',
];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ---------- Mock determinista por palabras clave ----------
function mockDesign(prompt, answers) {
  const p = (prompt || '').toLowerCase();
  const a = answers || {};
  const has = (...words) => words.some((w) => p.includes(w));

  const nodes = [];
  const conns = [];
  const seen = {};
  const add = (id, type, label) => {
    if (seen[id]) return id;
    seen[id] = true;
    nodes.push({ id, type, label });
    return id;
  };
  const link = (from, to) => {
    if (from && to && seen[from] && seen[to]) conns.push({ from, to });
  };

  add('internet', 'internet', 'Usuarios');

  const wantsFrontend = has('frontend', 'next', 'react', 'vue', 'angular', 'web', 'spa', 'sitio', 'landing', 'app');
  const wantsBackend = has('backend', 'api', 'server', 'node', 'express', 'django', 'flask', 'rails', 'go', 'servidor', 'microservicio');
  const wantsDb = has('postgres', 'sql', 'mysql', 'database', 'base de datos', 'db', 'relacional');
  const wantsNoSql = has('firestore', 'nosql', 'mongo', 'documentos');
  const wantsRedis = has('redis', 'cache', 'caché', 'memoria', 'sesiones');
  const wantsStorage = has('storage', 'imagen', 'imágenes', 'image', 'archivo', 'file', 'subir', 'upload', 's3', 'bucket', 'media', 'video', 'fotos');
  const wantsAi = has('ia', ' ai', 'ml', 'gemini', 'llm', 'chatbot', 'modelo', 'inteligencia', 'embeddings');
  const wantsSearch = has('search', 'búsqueda', 'buscador', 'meili', 'elastic');
  const wantsQueue = has('queue', 'cola', 'worker', 'job', 'cron', 'tarea', 'background', 'batch');
  const wantsEmail = has('email', 'correo', 'mail', 'notificaci');

  // Tráfico / escala: bien por palabras, bien por la respuesta del usuario.
  const usersAnswer = parseInt(String(a.users || a.usuarios || '').replace(/[^0-9]/g, ''), 10) || 0;
  const highTraffic = has('millones', 'millón', 'alto tráfico', 'escala', 'masivo') || usersAnswer >= 100000;
  const wantsMultiRegion = has('multirregión', 'multiregion', 'redundancia', 'alta disponibilidad', 'ha') ||
    /s[ií]/.test(String(a.multiRegion || a.redundancia || ''));

  // Por defecto, todo SaaS tiene al menos frontend + backend.
  const fe = (wantsFrontend || !wantsBackend) ? add('frontend', 'frontend', 'Cloud Run (Frontend)') : null;
  const be = (wantsBackend || wantsDb || wantsStorage || wantsAi) ? add('backend', 'backend', 'Cloud Run (Backend)') : null;

  let lb = null;
  if (highTraffic || wantsMultiRegion) lb = add('loadbalancer', 'loadbalancer', 'Cloud Load Balancing');

  if (lb) {
    link('internet', 'loadbalancer');
    if (fe) link('loadbalancer', 'frontend');
    if (!fe && be) link('loadbalancer', 'backend');
  } else {
    if (fe) link('internet', 'frontend');
    else if (be) link('internet', 'backend');
  }
  if (fe && be) link('frontend', 'backend');

  if (wantsDb) { add('postgres', 'postgres', 'Cloud SQL (Postgres)'); link(be || fe, 'postgres'); }
  if (wantsNoSql) { add('supabase', 'supabase', 'Firestore (NoSQL)'); link(be || fe, 'supabase'); }
  if (wantsRedis) { add('redis', 'redis', 'Cloud Memorystore'); link(be || fe, 'redis'); }
  if (wantsStorage) { add('storage', 'storage', 'Cloud Storage (GCS)'); link(be || fe, 'storage'); }
  if (wantsAi) { add('ai', 'ai', 'Vertex AI / Gemini'); link(be || fe, 'ai'); }
  if (wantsSearch) { add('meilisearch', 'meilisearch', 'Cloud Search'); link(be || fe, 'meilisearch'); }
  if (wantsQueue) { add('bullmq', 'bullmq', 'Cloud Tasks'); link(be || fe, 'bullmq'); }
  if (wantsEmail) { add('email', 'email', 'SendGrid / SMTP'); link(be || fe, 'email'); }

  // Recomendaciones proactivas + pregunta de seguimiento.
  const assumptions = [];
  if (lb) assumptions.push('Añadí Cloud Load Balancing para repartir el tráfico y permitir réplicas.');
  if (wantsMultiRegion) assumptions.push('Recomiendo desplegar Cloud SQL con réplica de lectura en una 2ª región.');
  if (!wantsDb && !wantsNoSql) assumptions.push('No detecté base de datos; añade Cloud SQL o Firestore si la necesitas.');

  let followUp = null;
  if (!usersAnswer && !highTraffic) {
    followUp = { field: 'users', question: '¿Cuántos usuarios activos estimas al mes? Así dimensiono el balanceo y las réplicas.' };
  } else if ((wantsDb || wantsStorage) && !wantsMultiRegion && !a.multiRegion) {
    followUp = { field: 'multiRegion', question: '¿Necesitas redundancia multirregión (alta disponibilidad)?' };
  }

  const services = nodes.filter((n) => n.type !== 'internet').map((n) => n.label).join(', ');
  const message = 'He diseñado una arquitectura en Google Cloud con: ' + (services || 'Cloud Run') + '.' +
    (assumptions.length ? ' ' + assumptions.join(' ') : '');

  return { source: 'mock', message, followUp, assumptions, nodes, conns };
}

// ---------- Llamada real a Gemini ----------
async function geminiDesign(prompt, answers) {
  const sys = `Eres un arquitecto de Google Cloud Platform. A partir de la descripción del usuario, devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin explicación fuera del JSON) con esta forma:
{"message": string, "followUp": {"field": string, "question": string} | null, "assumptions": string[], "nodes": [{"id": string, "type": string, "label": string}], "conns": [{"from": string, "to": string}]}
Los "type" válidos son: ${GCP_TYPES.join(', ')}. Usa "internet" como punto de entrada. Mapea: frontend/backend->cloud run, postgres->cloud sql, storage->cloud storage, redis->memorystore, ai->vertex ai, loadbalancer->cloud load balancing. Conecta los nodos de forma lógica usando sus "id". Responde en español en los campos de texto.`;
  const userMsg = 'Descripción: ' + prompt + (answers && Object.keys(answers).length ? '\nRespuestas previas: ' + JSON.stringify(answers) : '');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts: [{ text: userMsg }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    }),
  });
  const data = await res.json();
  const text = data && data.candidates && data.candidates[0] &&
    data.candidates[0].content && data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini sin respuesta');
  const clean = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(clean);
  // Saneamos los tipos a los que el canvas conoce.
  parsed.nodes = (parsed.nodes || []).filter((n) => GCP_TYPES.indexOf(n.type) !== -1);
  const ids = {};
  parsed.nodes.forEach((n) => { ids[n.id] = true; });
  parsed.conns = (parsed.conns || []).filter((c) => ids[c.from] && ids[c.to]);
  parsed.source = 'gemini';
  return parsed;
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const prompt = (body.prompt || '').slice(0, 2000);
  const answers = body.answers || {};
  if (!prompt.trim()) { res.status(400).json({ error: 'prompt requerido' }); return; }

  try {
    if (GEMINI_API_KEY) {
      try {
        const out = await geminiDesign(prompt, answers);
        if (out.nodes && out.nodes.length) { res.status(200).json(out); return; }
      } catch (e) {
        // cae al mock
      }
    }
    res.status(200).json(mockDesign(prompt, answers));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
