// POST /api/auth/google — login con Google Identity Services.
//
// El frontend envía la credencial (ID token de Google) emitida por GIS. Aquí la
// verificamos contra GOOGLE_CLIENT_ID, hacemos UPSERT del usuario en PostgreSQL
// y devolvemos NUESTRO propio JWT (firmado con JWT_SECRET) que el resto de la
// API usará como sesión. Sustituye al antiguo flujo Firebase + /api/auth-sync.
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { query } = require('../../db');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_TTL = process.env.JWT_TTL || '7d';
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'thequantpartners@gmail.com';

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!GOOGLE_CLIENT_ID || !JWT_SECRET) {
    res.status(500).json({ error: 'Auth no configurada: faltan GOOGLE_CLIENT_ID o JWT_SECRET.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const credential = body.credential || body.token || body.idToken;
  if (!credential) { res.status(400).json({ error: 'Falta la credencial de Google.' }); return; }

  try {
    // 1. Verificar el ID token de Google.
    const ticket = await oauthClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) { res.status(401).json({ error: 'Credencial de Google inválida.' }); return; }

    const id = payload.sub;
    const email = payload.email || '';
    const name = payload.name || '';
    const picture = payload.picture || '';
    const role = email === SUPERADMIN_EMAIL ? 'admin' : 'user';

    // 2. UPSERT en users (crear si no existe, refrescar last_login y perfil si existe).
    const result = await query(
      `INSERT INTO users (id, email, name, picture, role, last_login)
         VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             name = EXCLUDED.name,
             picture = EXCLUDED.picture,
             last_login = now()
       RETURNING id, email, name, picture, role, tier, status;`,
      [id, email, name, picture, role]
    );
    const user = result.rows[0];

    if (user.status === 'blocked') {
      res.status(403).json({ error: 'Tu cuenta ha sido bloqueada. Contacta con soporte.' });
      return;
    }

    // 3. Emitir nuestro JWT de sesión.
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        tier: user.tier,
      },
      JWT_SECRET,
      { expiresIn: JWT_TTL }
    );

    res.status(200).json({ token, user });
  } catch (err) {
    res.status(401).json({ error: 'No se pudo verificar la credencial: ' + err.message });
  }
};
