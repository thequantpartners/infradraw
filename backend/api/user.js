// GET /api/user  → perfil del usuario (tier, geminiApiKey, etc.)
// PUT /api/user  → actualizar geminiApiKey
const { query } = require('../db');
const { getUser } = require('./_auth');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Mapea una fila de la tabla `users` al perfil que consume el frontend.
function toProfile(row) {
  return {
    uid: row.id,
    email: row.email,
    name: row.name,
    photoURL: row.picture,
    role: row.role,
    plan: row.tier,
    tier: row.tier,
    status: row.status,
    geminiApiKey: row.gemini_api_key || null,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const session = getUser(req);
  if (!session) { res.status(401).json({ error: 'Invalid or missing token' }); return; }
  const uid = session.sub;

  try {
    if (req.method === 'GET') {
      const { rows } = await query('SELECT * FROM users WHERE id = $1', [uid]);
      if (!rows[0]) { res.status(404).json({ error: 'User not found.' }); return; }
      res.status(200).json(toProfile(rows[0]));

    } else if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      // Solo se permite actualizar geminiApiKey.
      if (typeof body.geminiApiKey === 'undefined') {
        res.status(400).json({ error: 'Nothing to update' });
        return;
      }
      const { rows } = await query(
        `UPDATE users SET gemini_api_key = $2 WHERE id = $1 RETURNING *`,
        [uid, body.geminiApiKey || null]
      );
      if (!rows[0]) { res.status(404).json({ error: 'User not found.' }); return; }
      res.status(200).json(toProfile(rows[0]));

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
