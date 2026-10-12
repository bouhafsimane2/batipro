const http = require('node:http');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PORT, PUBLIC_URL, CLIENT_ORIGINS, MEDIA_DIR, UPLOAD_DIR } = require('./config');
require('./db'); // crée le schéma au démarrage
const { HttpError } = require('./utils/http');
const { setupSocket } = require('./socket');

const app = express();

app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/media/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use('/media', express.static(MEDIA_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Les routes acceptent les URLs avec ou sans slash final (le front utilise /api/login/, etc.)
app.use('/api', require('./routes/auth').router);
app.use('/api', require('./routes/catalog').router);
app.use('/api/professionals', require('./routes/professionals').router);
app.use('/api/products', require('./routes/products').router);
app.use('/api/offers', require('./routes/offers').router);
app.use('/api/cart', require('./routes/cart').router);
app.use('/api/orders', require('./routes/orders').router);
app.use('/api/admin', require('./routes/admin').router);
app.use('/api', require('./routes/messages').router);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Route introuvable')));

// Format d'erreur lu par le front : { error: "message" }
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON invalide' });
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const server = http.createServer(app);
setupSocket(server);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. Changez PORT (et PUBLIC_URL) dans backend/.env,`);
    console.error('puis REACT_APP_API_URL dans FrontBatirpro-main/.env.');
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`API Batipro démarrée sur ${PUBLIC_URL} (port ${PORT})`);
  console.log(`Origines autorisées : ${CLIENT_ORIGINS.join(', ')}`);
});
