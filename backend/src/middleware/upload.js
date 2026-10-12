const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { UPLOAD_DIR } = require('../config');
const { HttpError } = require('../utils/http');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'Format d’image non supporté (png, jpg, webp, gif)'));
  },
});

// Chemin public d'un fichier uploadé, stocké en base
const uploadedPath = (file) => (file ? `/media/uploads/${path.basename(file.filename)}` : null);

module.exports = { upload, uploadedPath };
