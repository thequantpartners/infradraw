// GET /api/user       → perfil del usuario (plan, geminiApiKey, etc.)
// PUT /api/user       → actualizar geminiApiKey
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!auth) { res.status(401).json({ error: 'No token provided' }); return; }

  try {
    const firebaseUser = await verifyToken(auth);
    if (!firebaseUser) { res.status(401).json({ error: 'Invalid token' }); return; }

    const uid = firebaseUser.localId;
    const key = `user:${uid}`;

    if (req.method === 'GET') {
      const raw = await redis(['GET', key]);
      if (!raw) { res.status(404).json({ error: 'User not found. Call /api/auth-sync first.' }); return; }
      res.status(200).json(JSON.parse(raw));

    } else if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const raw = await redis(['GET', key]);
      if (!raw) { res.status(404).json({ error: 'User not found.' }); return; }

      const profile = JSON.parse(raw);
      // Only allow updating geminiApiKey
      if (typeof body.geminiApiKey !== 'undefined') {
        profile.geminiApiKey = body.geminiApiKey || null;
      }
      profile.updatedAt = new Date().toISOString();

      await redis(['SET', key, JSON.stringify(profile)]);
      res.status(200).json(profile);

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
