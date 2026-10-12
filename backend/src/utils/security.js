const crypto = require('node:crypto');

const KEY_LEN = 64;

// Format stocké : scrypt$<sel hex>$<hash hex>
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored).split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// Jeton d'authentification opaque (même format que DRF TokenAuthentication)
const generateToken = () => crypto.randomBytes(20).toString('hex');

module.exports = { hashPassword, verifyPassword, generateToken };
