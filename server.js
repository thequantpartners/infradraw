// server.js — Servidor Express unificado de InfraDraw v2 (Railway).
//
// Reemplaza a Vercel Serverless + vercel.json: sirve TODAS las APIs (antes
// funciones en /api/) y el frontend estático en el mismo puerto que Railway
// asigna vía process.env.PORT.
//
// Los handlers de /api/ usan la firma de Vercel
// (module.exports = async (req, res) => { ... }) que es directamente compatible
// con Express: ya leen req.headers / req.query / req.body y responden con
// res.status().json() / res.setHeader(). Cada handler además despacha por
// método y valida internamente (devuelve 405 para métodos no soportados), por
// eso los montamos con app.all() y reutilizamos su lógica sin tocarla.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Middlewares globales ----
app.use(cors());
// Límite alto: el canvas guarda diagramas completos (nodes/areas/notes/conns)
// que pueden superar el límite por defecto de 100kb de express.json().
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- Rutas de API (equivalentes a las funciones Vercel de /api/) ----
app.all('/api/auth-sync', require('./api/auth-sync'));
app.all('/api/user', require('./api/user'));
app.all('/api/projects', require('./api/projects'));
app.all('/api/project', require('./api/project'));
app.all('/api/ai-designer', require('./api/ai-designer'));
app.all('/api/webhooks/lemonsqueezy', require('./api/webhooks/lemonsqueezy'));
app.all('/api/admin/users', require('./api/admin/users'));
app.all('/api/admin/user', require('./api/admin/user'));

// Cualquier otra ruta /api/* es desconocida: respondemos JSON 404 y evitamos
// que express.static sirva el código fuente de los handlers (p.ej. /api/user.js).
app.all('/api/*', (req, res) => res.status(404).json({ error: 'API route not found' }));

// ---- Frontend estático (equivalente a los rewrites de vercel.json) ----
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'landing.html')));
app.get('/canvas', (req, res) => res.sendFile(path.join(__dirname, 'canvas.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/cli-auth', (req, res) => res.sendFile(path.join(__dirname, 'cli-auth.html')));

// Resto de archivos estáticos de la raíz (admin.html, assets, etc.).
// dotfiles:'ignore' (por defecto) impide servir .env, .pca, .vercel, .git…
app.use(express.static(__dirname, { index: false }));

app.listen(PORT, () => {
  console.log(`InfraDraw v2 escuchando en http://localhost:${PORT}`);
});
