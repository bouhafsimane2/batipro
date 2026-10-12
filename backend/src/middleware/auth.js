const { get } = require('../db');
const { HttpError } = require('../utils/http');

// Accepte "Authorization: Token <clé>" (format utilisé par le front) ou "Bearer <clé>"
function extractToken(header) {
  if (!header) return null;
  const [scheme, key] = String(header).split(' ');
  if (!key || !/^(token|bearer)$/i.test(scheme)) return null;
  return key.trim();
}

function userFromToken(key) {
  if (!key) return null;
  return get(
    `SELECT u.* FROM auth_tokens t JOIN users u ON u.id = t.user_id WHERE t.key = ?`,
    key,
  ) || null;
}

// Renseigne req.user si un jeton valide est fourni, sans bloquer sinon
function authOptional(req, _res, next) {
  req.token = extractToken(req.headers.authorization);
  req.user = userFromToken(req.token);
  next();
}

function authRequired(req, _res, next) {
  authOptional(req, _res, () => {
    if (!req.user) return next(new HttpError(401, 'Authentification requise'));
    next();
  });
}

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentification requise'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Accès refusé'));
  next();
};

module.exports = { authOptional, authRequired, requireRole, userFromToken };
