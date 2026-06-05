// GET    /api/project?id=xxx  → proyecto completo (con canvas)
// PUT    /api/project?id=xxx  → guardar canvas / renombrar
// DELETE /api/project?id=xxx  → eliminar proyecto
const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!KV_URL || !KV_TOKEN) {
    res.status(500).json({ error: 'KV no configurado.' });
    return;
  }

  const { id } = req.query;
  if (!id) { res.status(400).json({ error: 'Falta el parámetro id' }); return; }

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', `project:${id}`]);
      if (!raw) { res.status(404).json({ error: 'Proyecto no encontrado' }); return; }
      res.status(200).json(JSON.parse(raw));

    } else if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const now  = new Date().toISOString();

      // Leer proyecto existente para preservar campos no enviados
      const existingRaw = await redis(['GET', `project:${id}`]);
      const prev = existingRaw ? JSON.parse(existingRaw) : {};

      const canvas     = body.canvas     || prev.canvas     || null;
      const name       = (body.name      || prev.name       || 'Sin nombre').trim();
      const nodeCount  = canvas ? (canvas.nodes  || []).length : (prev.nodeCount  || 0);
      const areaCount  = canvas ? (canvas.areas  || []).length : (prev.areaCount  || 0);

      const updated = {
        id,
        name,
        createdAt : prev.createdAt || now,
        updatedAt : now,
        nodeCount,
        areaCount,
        canvas,
      };

      // Actualizar proyecto + lista de metadatos
      const listRaw = await redis(['GET', 'projects_list']);
      const list    = listRaw ? JSON.parse(listRaw) : [];
      const idx     = list.findIndex(p => p.id === id);
      const meta    = { id, name, createdAt: updated.createdAt, updatedAt: now, nodeCount, areaCount };
      if (idx !== -1) list[idx] = meta; else list.unshift(meta);

      await Promise.all([
        redis(['SET', `project:${id}`, JSON.stringify(updated)]),
        redis(['SET', 'projects_list', JSON.stringify(list)]),
      ]);

      res.status(200).json({ ok: true });

    } else if (req.method === 'DELETE') {
      const listRaw = await redis(['GET', 'projects_list']);
      const list    = listRaw ? JSON.parse(listRaw).filter(p => p.id !== id) : [];

      await Promise.all([
        redis(['SET', 'projects_list', JSON.stringify(list)]),
        redis(['DEL', `project:${id}`]),
      ]);

      res.status(200).json({ ok: true });

    } else {
      res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
