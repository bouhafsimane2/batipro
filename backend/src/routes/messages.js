const express = require('express');
const { get, all } = require('../db');
const { HttpError, requireId, toInt, str } = require('../utils/http');
const { serializePublicUser } = require('../utils/serializers');
const { authRequired } = require('../middleware/auth');
const messaging = require('../messaging');

const router = express.Router();
router.use(['/conversations', '/messages', '/users'], authRequired);

router.get('/conversations', (req, res) => {
  res.json(messaging.listConversations(req.user.id));
});

// Ouvre (ou retrouve) une conversation avec un utilisateur ou un professionnel
// Body : { user_id } ou { professional_id }
router.post('/conversations', (req, res) => {
  let otherId = toInt(req.body.user_id);
  if (!otherId && req.body.professional_id !== undefined) {
    const prof = get('SELECT user_id FROM professionals WHERE id = ?', requireId(req.body.professional_id, 'professional_id'));
    if (!prof) throw new HttpError(404, 'Professionnel introuvable');
    otherId = prof.user_id;
  }
  if (!otherId) throw new HttpError(400, 'user_id ou professional_id requis');
  const conv = messaging.getOrCreateConversation(req.user.id, otherId);
  res.status(201).json(messaging.serializeConversation(conv, req.user.id));
});

router.get('/conversations/:id', (req, res) => {
  const conv = messaging.loadConversationFor(requireId(req.params.id), req.user.id);
  res.json(messaging.serializeConversation(conv, req.user.id));
});

// ?before=<id message> pour paginer vers le passé
router.get('/conversations/:id/messages', (req, res) => {
  res.json(messaging.listMessages(requireId(req.params.id), req.user.id, {
    before: toInt(req.query.before),
    limit: toInt(req.query.limit) || 50,
  }));
});

// Envoi par REST (alternative à l'événement Socket.IO "message:send")
router.post('/conversations/:id/messages', (req, res) => {
  res.status(201).json(messaging.sendMessage(requireId(req.params.id), req.user.id, req.body.content));
});

router.post('/conversations/:id/read', (req, res) => {
  res.json(messaging.markRead(requireId(req.params.id), req.user.id));
});

router.get('/messages/unread-count', (req, res) => {
  res.json({ count: messaging.unreadCount(req.user.id) });
});

// Recherche d'utilisateurs pour démarrer une nouvelle conversation
router.get('/users/search', (req, res) => {
  const q = str(req.query.q, 60);
  if (q.length < 2) return res.json([]);
  const like = `%${q}%`;
  const rows = all(
    `SELECT * FROM users
     WHERE id <> ? AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR (first_name || ' ' || last_name) LIKE ?)
     ORDER BY first_name, last_name LIMIT 10`,
    req.user.id, like, like, like, like,
  );
  res.json(rows.map((u) => ({ ...serializePublicUser(u), online: messaging.isOnline(u.id) })));
});

module.exports = { router };
