const express = require('express');
const { get, run } = require('../db');
const { hashPassword, verifyPassword, generateToken } = require('../utils/security');
const { HttpError, str } = require('../utils/http');
const { serializeUser } = require('../utils/serializers');
const { authRequired } = require('../middleware/auth');
const { upload, uploadedPath } = require('../middleware/upload');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(username, password) {
  if (!/^[\w.@+-]{3,40}$/.test(username)) {
    throw new HttpError(400, "Nom d'utilisateur invalide (3 à 40 caractères : lettres, chiffres, . _ @ + -)");
  }
  if (password.length < 6) throw new HttpError(400, 'Le mot de passe doit contenir au moins 6 caractères');
}

function issueToken(userId) {
  const key = generateToken();
  run('INSERT INTO auth_tokens (key, user_id) VALUES (?, ?)', key, userId);
  return key;
}

// Réponse attendue par login/Login.js : { token, user, usertype }
function authResponse(user, token) {
  return { token, user: serializeUser(user), usertype: user.role };
}

function createUser({ username, password, email, first_name, last_name, telephone, address, birth_date, bio, role = 'client' }) {
  validateCredentials(username, password);
  if (email && !EMAIL_RE.test(email)) throw new HttpError(400, 'Adresse email invalide');
  if (get('SELECT 1 FROM users WHERE username = ?', username)) throw new HttpError(409, "Ce nom d'utilisateur est déjà pris");
  if (email && get('SELECT 1 FROM users WHERE email = ?', email)) throw new HttpError(409, 'Cet email est déjà utilisé');

  const { lastInsertRowid } = run(
    `INSERT INTO users (username, email, password_hash, first_name, last_name, telephone, address, birth_date, bio, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    username, email || null, hashPassword(password), first_name || '', last_name || '',
    telephone || '', address || '', birth_date || null, bio || '', role,
  );
  return get('SELECT * FROM users WHERE id = ?', lastInsertRowid);
}

router.post('/register', (req, res) => {
  const user = createUser({
    username: str(req.body.username, 40),
    password: String(req.body.password || ''),
    email: str(req.body.email, 200),
    first_name: str(req.body.first_name, 80),
    last_name: str(req.body.last_name, 80),
    telephone: str(req.body.telephone, 30),
  });
  res.status(201).json(authResponse(user, issueToken(user.id)));
});

router.post('/login', (req, res) => {
  const username = str(req.body.username, 200);
  const password = String(req.body.password || '');
  if (!username || !password) throw new HttpError(400, "Nom d'utilisateur et mot de passe requis");

  // Connexion par nom d'utilisateur ou par email
  const user = get('SELECT * FROM users WHERE username = ? OR email = ?', username, username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new HttpError(401, 'Identifiants incorrects');
  }
  res.json(authResponse(user, issueToken(user.id)));
});

router.post('/logout', authRequired, (req, res) => {
  run('DELETE FROM auth_tokens WHERE key = ?', req.token);
  res.json({ success: true });
});

router.get('/me', authRequired, (req, res) => {
  res.json(serializeUser(req.user));
});

// Mise à jour du profil (multipart possible pour la photo : champ "image")
const EDITABLE = ['first_name', 'last_name', 'telephone', 'address', 'birth_date', 'bio', 'email', 'speciality', 'register_number'];
const NULLABLE = new Set(['birth_date', 'email', 'speciality', 'register_number']);

router.put('/me', authRequired, upload.single('image'), (req, res) => {
  const updates = {};
  for (const field of EDITABLE) {
    if (req.body[field] !== undefined) updates[field] = str(req.body[field], 2000);
  }
  if (updates.email) {
    if (!EMAIL_RE.test(updates.email)) throw new HttpError(400, 'Adresse email invalide');
    if (get('SELECT 1 FROM users WHERE email = ? AND id <> ?', updates.email, req.user.id)) {
      throw new HttpError(409, 'Cet email est déjà utilisé');
    }
  }
  if (req.file) updates.image_url = uploadedPath(req.file);
  if (req.body.password) {
    if (String(req.body.password).length < 6) throw new HttpError(400, 'Le mot de passe doit contenir au moins 6 caractères');
    updates.password_hash = hashPassword(String(req.body.password));
  }

  const fields = Object.keys(updates);
  if (fields.length) {
    run(
      `UPDATE users SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`,
      ...fields.map((f) => (updates[f] === '' && NULLABLE.has(f) ? null : updates[f])), req.user.id,
    );
  }
  res.json(serializeUser(get('SELECT * FROM users WHERE id = ?', req.user.id)));
});

module.exports = { router, createUser, issueToken, authResponse };
