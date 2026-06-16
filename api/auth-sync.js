// POST /api/auth-sync — llamado tras el login con Firebase.
// Crea/actualiza el perfil del usuario en KV y devuelve su plan actual.
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!auth) { res.status(401).json({ error: 'No token provided' }); return; }

  try {
    const firebaseUser = await verifyToken(auth);
    if (!firebaseUser) { res.status(401).json({ error: 'Invalid token' }); return; }

    const uid = firebaseUser.localId;
    const key = `user:${uid}`;

    const existingRaw = await redis(['GET', key]);
    const existing = existingRaw ? JSON.parse(existingRaw) : null;

    const now = new Date().toISOString();
    const profile = {
      uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoUrl || '',
      plan: existing ? existing.plan : 'free',
      status: existing ? (existing.status || 'active') : 'active',
      geminiApiKey: existing ? existing.geminiApiKey : null,
      lsCustomerId: existing ? existing.lsCustomerId : null,
      lsSubscriptionId: existing ? existing.lsSubscriptionId : null,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await redis(['SET', key, JSON.stringify(profile)]);
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
