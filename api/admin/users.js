const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'thequantpartners@gmail.com';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!auth) { res.status(401).json({ error: 'No token provided' }); return; }

  try {
    const firebaseUser = await verifyToken(auth);
    if (!firebaseUser) { res.status(401).json({ error: 'Invalid token' }); return; }

    if (!SUPERADMIN_EMAIL || firebaseUser.email !== SUPERADMIN_EMAIL) {
      res.status(403).json({ error: 'Forbidden: Access denied' });
      return;
    }

    let cursor = '0';
    let allKeys = [];
    do {
      const result = await redis(['SCAN', cursor, 'MATCH', 'user:*', 'COUNT', 100]);
      cursor = result[0];
      allKeys = allKeys.concat(result[1]);
    } while (cursor !== '0');

    // Filter out project keys
    const userKeys = allKeys.filter(key => !key.includes(':projects') && !key.includes(':project:'));

    if (userKeys.length === 0) {
      res.status(200).json([]);
      return;
    }

    const rawUsers = await redis(['MGET', ...userKeys]);

    const users = rawUsers.map(raw => {
      if (!raw) return null;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        uid: parsed.uid,
        name: parsed.name,
        email: parsed.email,
        plan: parsed.plan,
        createdAt: parsed.createdAt,
      };
    }).filter(Boolean);

    res.status(200).json(users);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
