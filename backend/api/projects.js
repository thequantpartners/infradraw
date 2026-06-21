// GET  /api/projects  → lista de proyectos del usuario (metadata)
// POST /api/projects  → crear nuevo proyecto
const { query } = require('../db');
const { getUser } = require('./_auth');

const FREE_PROJECT_LIMIT = 3;
const EMPTY_CANVAS = { nodes: [], areas: [], notes: [], conns: [], transform: { x: 0, y: 0, scale: 1 } };

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function toMeta(row) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nodeCount: row.node_count,
    areaCount: row.area_count,
  };
}

async function getUserTier(uid) {
  const { rows } = await query('SELECT tier FROM users WHERE id = $1', [uid]);
  return rows[0] ? rows[0].tier : 'free';
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const session = getUser(req);
  if (!session) { res.status(401).json({ error: 'Invalid or missing token' }); return; }
  const uid = session.sub;

  try {
    if (req.method === 'GET') {
      const { rows } = await query(
        `SELECT id, name, created_at, updated_at, node_count, area_count
           FROM projects WHERE uid = $1 ORDER BY updated_at DESC`,
        [uid]
      );
      res.status(200).json(rows.map(toMeta));

    } else if (req.method === 'POST') {
      const tier = await getUserTier(uid);
      if (tier === 'free') {
        const { rows } = await query('SELECT COUNT(*)::int AS c FROM projects WHERE uid = $1', [uid]);
        if (rows[0].c >= FREE_PROJECT_LIMIT) {
          res.status(403).json({ error: `Plan FREE: máximo ${FREE_PROJECT_LIMIT} proyectos. Actualiza a PRO para proyectos ilimitados.`, code: 'LIMIT_REACHED' });
          return;
        }
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const name = (body.name || 'Nuevo diagrama').trim();
      const id = 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

      const { rows } = await query(
        `INSERT INTO projects (id, uid, name, node_count, area_count, canvas)
           VALUES ($1, $2, $3, 0, 0, $4)
         RETURNING id, name, created_at, updated_at, node_count, area_count`,
        [id, uid, name, EMPTY_CANVAS]
      );
      res.status(200).json(toMeta(rows[0]));

    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
