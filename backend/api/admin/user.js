// PUT /api/admin/user — cambiar plan/estado de un usuario (solo superadmin).
const { query } = require('../../db');
const { getUser } = require('../_auth');

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'thequantpartners@gmail.com';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'PUT') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const session = getUser(req);
  if (!session) { res.status(401).json({ error: 'Invalid or missing token' }); return; }

  const isAdmin = session.role === 'admin' || session.email === SUPERADMIN_EMAIL;
  if (!isAdmin) { res.status(403).json({ error: 'Forbidden: Access denied' }); return; }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { uid, newPlan, newStatus } = body;

    if (!uid || (!newPlan && !newStatus)) {
      res.status(400).json({ error: 'Missing uid, newPlan or newStatus' });
      return;
    }
    if (newPlan && !['free', 'pro'].includes(newPlan)) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }
    if (newStatus && !['active', 'blocked'].includes(newStatus)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const { rows } = await query('SELECT id, email, tier, status FROM users WHERE id = $1', [uid]);
    if (!rows[0]) { res.status(404).json({ error: 'User not found' }); return; }

    if (newStatus === 'blocked' && rows[0].email === SUPERADMIN_EMAIL) {
      res.status(403).json({ error: 'Cannot block the superadmin' });
      return;
    }

    const updated = await query(
      `UPDATE users
          SET tier = COALESCE($2, tier),
              status = COALESCE($3, status)
        WHERE id = $1
      RETURNING id, name, email, tier, status, created_at`,
      [uid, newPlan || null, newStatus || null]
    );
    const r = updated.rows[0];
    res.status(200).json({
      uid: r.id,
      name: r.name,
      email: r.email,
      plan: r.tier,
      status: r.status,
      createdAt: r.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
