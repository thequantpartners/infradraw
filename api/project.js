// GET    /api/project?id=xxx  → proyecto completo (con canvas)
// PUT    /api/project?id=xxx  → guardar canvas / renombrar
// DELETE /api/project?id=xxx  → eliminar proyecto
const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

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

async function verifyToken(token) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }) }
  );
  const data = await res.json();
  if (data.error || !data.users || !data.users[0]) return null;
  return data.users[0];
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!KV_URL || !KV_TOKEN) {
    res.status(500).json({ error: 'KV no configurado.' });
    return;
  }

  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!auth) { res.status(401).json({ error: 'Authentication required.' }); return; }

  let uid;
  try {
    const firebaseUser = await verifyToken(auth);
    if (!firebaseUser) { res.status(401).json({ error: 'Invalid or expired token.' }); return; }
    uid = firebaseUser.localId;
  } catch (err) {
    res.status(401).json({ error: 'Token verification failed: ' + err.message });
    return;
  }

  const { id } = req.query;
  if (!id) { res.status(400).json({ error: 'Falta el parámetro id' }); return; }

  const projKey  = `project:${uid}:${id}`;
  const listKey  = `projects_list:${uid}`;

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', projKey]);
      if (!raw) { res.status(404).json({ error: 'Proyecto no encontrado' }); return; }
      res.status(200).json(JSON.parse(raw));

    } else if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const now  = new Date().toISOString();

      const existingRaw = await redis(['GET', projKey]);
      const prev = existingRaw ? JSON.parse(existingRaw) : {};

      const canvas     = body.canvas     || prev.canvas     || null;
      const name       = (body.name      || prev.name       || 'Sin nombre').trim();
      const nodeCount  = canvas ? (canvas.nodes  || []).length : (prev.nodeCount  || 0);
      const areaCount  = canvas ? (canvas.areas  || []).length : (prev.areaCount  || 0);

      const updated = { id, name, createdAt: prev.createdAt || now, updatedAt: now, nodeCount, areaCount, canvas };

      const listRaw = await redis(['GET', listKey]);
      const list    = listRaw ? JSON.parse(listRaw) : [];
      const idx     = list.findIndex(p => p.id === id);
      const meta    = { id, name, createdAt: updated.createdAt, updatedAt: now, nodeCount, areaCount };
      if (idx !== -1) list[idx] = meta; else list.unshift(meta);

      await Promise.all([
        redis(['SET', projKey, JSON.stringify(updated)]),
        redis(['SET', listKey, JSON.stringify(list)]),
      ]);

      res.status(200).json({ ok: true });

    } else if (req.method === 'DELETE') {
      const listRaw = await redis(['GET', listKey]);
      const list    = listRaw ? JSON.parse(listRaw).filter(p => p.id !== id) : [];

      await Promise.all([
        redis(['SET', listKey, JSON.stringify(list)]),
        redis(['DEL', projKey]),
      ]);

      res.status(200).json({ ok: true });

    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
