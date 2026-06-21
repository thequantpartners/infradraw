// db.js — Capa de PostgreSQL de InfraDraw v2 (Railway).
//
// Reemplaza a Vercel KV (Redis). Expone un pool de conexiones `pg` apuntando a
// process.env.DATABASE_URL e `initDb()`, que crea las tablas si no existen.
//
// Esquema:
//   users    → perfil del usuario. `id` es el "sub" de Google (identificador
//              estable de la cuenta). `tier` reemplaza al antiguo `plan`.
//   projects → un diagrama por fila; `canvas` guarda el JSON completo
//              (nodes/areas/notes/conns/transform) como JSONB.
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Railway expone la base con TLS; en local (localhost/127.0.0.1) lo desactivamos.
const useSsl =
  !!connectionString &&
  !/localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[db] Error inesperado en cliente del pool:', err.message);
});

async function initDb() {
  if (!connectionString) {
    console.warn('[db] DATABASE_URL no configurada — se omite initDb().');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          VARCHAR(128) PRIMARY KEY,
      email       VARCHAR(320),
      name        VARCHAR(256),
      picture     TEXT,
      role        VARCHAR(32)  NOT NULL DEFAULT 'user',
      tier        VARCHAR(32)  NOT NULL DEFAULT 'free',
      status      VARCHAR(32)  NOT NULL DEFAULT 'active',
      gemini_api_key TEXT,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      last_login  TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id          VARCHAR(128) PRIMARY KEY,
      uid         VARCHAR(128) REFERENCES users(id) ON DELETE CASCADE,
      name        VARCHAR(256) NOT NULL DEFAULT 'Sin nombre',
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      node_count  INTEGER      NOT NULL DEFAULT 0,
      area_count  INTEGER      NOT NULL DEFAULT 0,
      canvas      JSONB
    );
  `);

  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_projects_uid ON projects(uid);`
  );

  console.log('[db] Esquema PostgreSQL listo (users, projects).');
}

module.exports = { pool, query: (text, params) => pool.query(text, params), initDb };
