// GET  /api/projects  → lista de proyectos (metadata)
// POST /api/projects  → crear nuevo proyecto
const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function redis(cmd) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const EMPTY_CANVAS = { nodes: [], areas: [], notes: [], conns: [], transform: { x: 0, y: 0, scale: 1 } };

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!KV_URL || !KV_TOKEN) {
    res.status(500).json({ error: 'KV no configurado. Agrega KV_REST_API_URL y KV_REST_API_TOKEN.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', 'projects_list']);
      res.status(200).json(raw ? JSON.parse(raw) : []);

    } else if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const name  = (body.name || 'Nuevo diagrama').trim();
      const id    = 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const now   = new Date().toISOString();

      const raw  = await redis(['GET', 'projects_list']);
      const list = raw ? JSON.parse(raw) : [];

      const meta = { id, name, createdAt: now, updatedAt: now, nodeCount: 0, areaCount: 0 };
      list.unshift(meta);

      await Promise.all([
        redis(['SET', 'projects_list', JSON.stringify(list)]),
        redis(['SET', `project:${id}`, JSON.stringify({ ...meta, canvas: EMPTY_CANVAS })]),
      ]);

      res.status(200).json(meta);

    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
