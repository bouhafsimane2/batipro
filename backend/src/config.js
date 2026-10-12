const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const PORT = Number(process.env.PORT) || 8000;

// Accepte "monsite.onrender.com" (hôte fourni par Render) aussi bien qu'une URL complète
const withProtocol = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`).replace(/\/$/, '');

module.exports = {
  ROOT,
  PORT,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  // Sur Render, RENDER_EXTERNAL_URL contient l'adresse publique du service
  PUBLIC_URL: withProtocol(process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}`),
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .map(withProtocol),
  DB_FILE: path.resolve(ROOT, process.env.DB_FILE || './data/batipro.sqlite'),
  MEDIA_DIR: path.join(ROOT, 'media'),
  // Dossier des images envoyées par les utilisateurs (servi sous /media/uploads)
  UPLOAD_DIR: path.resolve(ROOT, process.env.UPLOAD_DIR || './media/uploads'),
};
