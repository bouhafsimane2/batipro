// Logique métier de la messagerie, partagée entre l'API REST et Socket.IO
const { get, all, run, transaction } = require('./db');
const { HttpError } = require('./utils/http');
const { serializePublicUser } = require('./utils/serializers');

const MAX_LENGTH = 2000;

let io = null;
const online = new Map(); // userId -> nombre de sockets ouvertes

const room = (userId) => `user:${userId}`;

function attachIo(server) {
  io = server;
}

function emitTo(userIds, event, payload) {
  if (!io) return;
  for (const id of new Set(userIds)) io.to(room(id)).emit(event, payload);
}

const isOnline = (userId) => (online.get(userId) || 0) > 0;

function setOnline(userId, delta) {
  const n = Math.max(0, (online.get(userId) || 0) + delta);
  if (n) online.set(userId, n);
  else online.delete(userId);
  return n;
}

const otherUserId = (conv, userId) => (conv.user_a_id === userId ? conv.user_b_id : conv.user_a_id);

function loadConversationFor(conversationId, userId) {
  const conv = get('SELECT * FROM conversations WHERE id = ?', conversationId);
  if (!conv || (conv.user_a_id !== userId && conv.user_b_id !== userId)) {
    throw new HttpError(404, 'Conversation introuvable');
  }
  return conv;
}

function serializeConversation(conv, userId) {
  const other = get('SELECT * FROM users WHERE id = ?', otherUserId(conv, userId));
  const last = get('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1', conv.id);
  const unread = get(
    'SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL',
    conv.id, userId,
  ).n;
  const prof = get("SELECT id FROM professionals WHERE user_id = ? AND status = 'approved'", other.id);
  return {
    id: conv.id,
    updated_at: conv.updated_at,
    other_user: { ...serializePublicUser(other), professional_id: prof?.id ?? null, online: isOnline(other.id) },
    last_message: last || null,
    unread_count: unread,
  };
}

function getOrCreateConversation(userId, otherId) {
  if (userId === otherId) throw new HttpError(400, 'Vous ne pouvez pas vous écrire à vous-même');
  if (!get('SELECT 1 FROM users WHERE id = ?', otherId)) throw new HttpError(404, 'Utilisateur introuvable');
  const [a, b] = userId < otherId ? [userId, otherId] : [otherId, userId];
  run('INSERT OR IGNORE INTO conversations (user_a_id, user_b_id) VALUES (?, ?)', a, b);
  return get('SELECT * FROM conversations WHERE user_a_id = ? AND user_b_id = ?', a, b);
}

function listConversations(userId) {
  // Triées par activité récente (une conversation vide reste listée pour pouvoir démarrer l'échange)
  return all(
    'SELECT * FROM conversations WHERE user_a_id = ? OR user_b_id = ? ORDER BY updated_at DESC, id DESC',
    userId, userId,
  ).map((c) => serializeConversation(c, userId));
}

function listMessages(conversationId, userId, { before, limit = 50 } = {}) {
  loadConversationFor(conversationId, userId);
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const rows = before
    ? all('SELECT * FROM messages WHERE conversation_id = ? AND id < ? ORDER BY id DESC LIMIT ?', conversationId, before, lim)
    : all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?', conversationId, lim);
  return rows.reverse();
}

function sendMessage(conversationId, senderId, rawContent) {
  const content = String(rawContent ?? '').trim();
  if (!content) throw new HttpError(400, 'Le message est vide');
  if (content.length > MAX_LENGTH) throw new HttpError(400, `Message trop long (${MAX_LENGTH} caractères max)`);

  const conv = loadConversationFor(conversationId, senderId);
  const message = transaction(() => {
    const { lastInsertRowid } = run(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
      conv.id, senderId, content,
    );
    const msg = get('SELECT * FROM messages WHERE id = ?', lastInsertRowid);
    run('UPDATE conversations SET updated_at = ? WHERE id = ?', msg.created_at, conv.id);
    return msg;
  });

  const fresh = get('SELECT * FROM conversations WHERE id = ?', conv.id);
  // Chaque participant reçoit la conversation vue de son côté (interlocuteur, non-lus)
  for (const uid of [conv.user_a_id, conv.user_b_id]) {
    emitTo([uid], 'message:new', { message, conversation: serializeConversation(fresh, uid) });
  }
  return message;
}

function markRead(conversationId, userId) {
  const conv = loadConversationFor(conversationId, userId);
  const readAt = new Date().toISOString();
  const { changes } = run(
    'UPDATE messages SET read_at = ? WHERE conversation_id = ? AND sender_id <> ? AND read_at IS NULL',
    readAt, conv.id, userId,
  );
  if (changes) {
    emitTo([conv.user_a_id, conv.user_b_id], 'conversation:read', {
      conversation_id: conv.id, reader_id: userId, read_at: readAt,
    });
  }
  return { updated: Number(changes), read_at: readAt };
}

function unreadCount(userId) {
  return get(
    `SELECT COUNT(*) AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id
     WHERE (c.user_a_id = ? OR c.user_b_id = ?) AND m.sender_id <> ? AND m.read_at IS NULL`,
    userId, userId, userId,
  ).n;
}

// Utilisateurs avec qui `userId` a une conversation (pour diffuser la présence)
function contactsOf(userId) {
  return all(
    `SELECT CASE WHEN user_a_id = ? THEN user_b_id ELSE user_a_id END AS id
     FROM conversations WHERE user_a_id = ? OR user_b_id = ?`,
    userId, userId, userId,
  ).map((r) => r.id);
}

module.exports = {
  attachIo,
  emitTo,
  room,
  setOnline,
  isOnline,
  loadConversationFor,
  otherUserId,
  serializeConversation,
  getOrCreateConversation,
  listConversations,
  listMessages,
  sendMessage,
  markRead,
  unreadCount,
  contactsOf,
};
