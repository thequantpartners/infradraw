// _auth.js — helper compartido de sesión JWT para los handlers de /api/.
//
// Reemplaza a la antigua verifyToken() de Firebase. Lee el header
// `Authorization: Bearer <jwt>` y lo valida con JWT_SECRET. Devuelve el payload
// decodificado (sub, email, name, picture, role, tier) o null si es inválido.
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function getUser(req) {
  const auth = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!auth || !JWT_SECRET) return null;
  try {
    return jwt.verify(auth, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { getUser };
