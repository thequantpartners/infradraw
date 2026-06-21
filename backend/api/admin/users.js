// GET /api/admin/users — lista de todos los usuarios (solo superadmin).
const { query } = require('../../db');
const { getUser } = require('../_auth');

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'thequantpartners@gmail.com';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const session = getUser(req);
  if (!session) { res.status(401).json({ error: 'Invalid or missing token' }); return; }

  const isAdmin = session.role === 'admin' || session.email === SUPERADMIN_EMAIL;
  if (!isAdmin) { res.status(403).json({ error: 'Forbidden: Access denied' }); return; }

  try {
    const { rows } = await query(
      `SELECT id, name, email, tier, status, created_at FROM users ORDER BY created_at DESC`
    );
    const users = rows.map((r) => ({
      uid: r.id,
      name: r.name,
      email: r.email,
      plan: r.tier,
      status: r.status || 'active',
      createdAt: r.created_at,
    }));
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
