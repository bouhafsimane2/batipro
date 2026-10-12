class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Permet d'utiliser des handlers async sans try/catch dans chaque route
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toInt = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

function requireId(value, label = 'id') {
  const n = toInt(value);
  if (n === null || n <= 0) throw new HttpError(400, `${label} invalide`);
  return n;
}

const str = (value, max = 2000) => (value === undefined || value === null ? '' : String(value).trim().slice(0, max));

module.exports = { HttpError, asyncHandler, toInt, requireId, str };
