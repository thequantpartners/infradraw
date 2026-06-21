// GET    /api/project?id=xxx  → proyecto completo (con canvas)
// PUT    /api/project?id=xxx  → guardar canvas / renombrar
// DELETE /api/project?id=xxx  → eliminar proyecto
const { query } = require('../db');
const { getUser } = require('./_auth');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const session = getUser(req);
  if (!session) { res.status(401).json({ error: 'Authentication required.' }); return; }
  const uid = session.sub;

  const { id } = req.query;
  if (!id) { res.status(400).json({ error: 'Falta el parámetro id' }); return; }

  try {
    if (req.method === 'GET') {
      const { rows } = await query(
        `SELECT id, name, created_at, updated_at, node_count, area_count, canvas
           FROM projects WHERE id = $1 AND uid = $2`,
        [id, uid]
      );
      if (!rows[0]) { res.status(404).json({ error: 'Proyecto no encontrado' }); return; }
      const r = rows[0];
      res.status(200).json({
        id: r.id,
        name: r.name,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        nodeCount: r.node_count,
        areaCount: r.area_count,
        canvas: r.canvas,
      });

    } else if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

      // Cargar fila previa para conservar canvas/name si la petición es parcial.
      const prevRes = await query(
        'SELECT name, canvas FROM projects WHERE id = $1 AND uid = $2',
        [id, uid]
      );
      if (!prevRes.rows[0]) { res.status(404).json({ error: 'Proyecto no encontrado' }); return; }
      const prev = prevRes.rows[0];

      const canvas = body.canvas || prev.canvas || null;
      const name = (body.name || prev.name || 'Sin nombre').trim();
      const nodeCount = canvas ? (canvas.nodes || []).length : 0;
      const areaCount = canvas ? (canvas.areas || []).length : 0;

      await query(
        `UPDATE projects
            SET name = $3, canvas = $4, node_count = $5, area_count = $6, updated_at = now()
          WHERE id = $1 AND uid = $2`,
        [id, uid, name, canvas, nodeCount, areaCount]
      );
      res.status(200).json({ ok: true });

    } else if (req.method === 'DELETE') {
      await query('DELETE FROM projects WHERE id = $1 AND uid = $2', [id, uid]);
      res.status(200).json({ ok: true });

    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
