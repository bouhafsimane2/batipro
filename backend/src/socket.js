const { Server } = require('socket.io');
const { CLIENT_ORIGINS } = require('./config');
const { userFromToken } = require('./middleware/auth');
const { HttpError } = require('./utils/http');
const messaging = require('./messaging');

// Exécute un handler et renvoie { ok, data } / { ok:false, error } via l'accusé de réception
function withAck(handler) {
  return (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    try {
      reply({ ok: true, data: handler(payload || {}) });
    } catch (err) {
      const message = err instanceof HttpError ? err.message : 'Erreur serveur';
      if (!(err instanceof HttpError)) console.error('[socket]', err);
      reply({ ok: false, error: message });
    }
  };
}

function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: CLIENT_ORIGINS, credentials: true },
  });
  messaging.attachIo(io);

  // Authentification par le même jeton que l'API : io(url, { auth: { token } })
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      || String(socket.handshake.headers.authorization || '').replace(/^(Token|Bearer)\s+/i, '');
    const user = userFromToken(token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = { id: user.id, username: user.username };
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    socket.join(messaging.room(userId));

    if (messaging.setOnline(userId, +1) === 1) {
      messaging.emitTo(messaging.contactsOf(userId), 'presence', { user_id: userId, online: true });
    }

    socket.on('message:send', withAck(({ conversation_id, content }) =>
      messaging.sendMessage(Number(conversation_id), userId, content)));

    socket.on('conversation:read', withAck(({ conversation_id }) =>
      messaging.markRead(Number(conversation_id), userId)));

    socket.on('typing', ({ conversation_id, typing } = {}) => {
      try {
        const conv = messaging.loadConversationFor(Number(conversation_id), userId);
        messaging.emitTo([messaging.otherUserId(conv, userId)], 'typing', {
          conversation_id: conv.id, user_id: userId, typing: Boolean(typing),
        });
      } catch {
        // conversation inconnue : on ignore
      }
    });

    socket.on('disconnect', () => {
      if (messaging.setOnline(userId, -1) === 0) {
        messaging.emitTo(messaging.contactsOf(userId), 'presence', { user_id: userId, online: false });
      }
    });
  });

  return io;
}

module.exports = { setupSocket };
