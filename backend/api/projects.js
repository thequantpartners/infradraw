// GET  /api/projects  → lista de proyectos del usuario (metadata)
// POST /api/projects  → crear nuevo proyecto
const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;
const FREE_PROJECT_LIMIT = 3;

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

async function getUserPlan(uid) {
  const raw = await redis(['GET', `user:${uid}`]);
  if (!raw) return 'free';
  return JSON.parse(raw).plan || 'free';
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const EMPTY_CANVAS = { nodes: [], areas: [], notes: [], conns: [], transform: { x: 0, y: 0, scale: 1 } };

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

  const listKey = `projects_list:${uid}`;

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', listKey]);
      res.status(200).json(raw ? JSON.parse(raw) : []);

    } else if (req.method === 'POST') {
      const plan = await getUserPlan(uid);
      const raw  = await redis(['GET', listKey]);
      const list = raw ? JSON.parse(raw) : [];

      if (plan === 'free' && list.length >= FREE_PROJECT_LIMIT) {
        res.status(403).json({ error: `Plan FREE: máximo ${FREE_PROJECT_LIMIT} proyectos. Actualiza a PRO para proyectos ilimitados.`, code: 'LIMIT_REACHED' });
        return;
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const name  = (body.name || 'Nuevo diagrama').trim();
      const id    = 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const now   = new Date().toISOString();

      const meta = { id, name, createdAt: now, updatedAt: now, nodeCount: 0, areaCount: 0 };
      list.unshift(meta);

      await Promise.all([
        redis(['SET', listKey, JSON.stringify(list)]),
        redis(['SET', `project:${uid}:${id}`, JSON.stringify({ ...meta, canvas: EMPTY_CANVAS })]),
      ]);

      res.status(200).json(meta);

    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
