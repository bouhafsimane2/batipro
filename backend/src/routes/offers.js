const express = require('express');
const { get, all, run } = require('../db');
const { HttpError, requireId, str } = require('../utils/http');
const { mediaUrl } = require('../utils/serializers');
const { authOptional, authRequired, requireRole } = require('../middleware/auth');
const { upload, uploadedPath } = require('../middleware/upload');
const { CATEGORIES } = require('./products');

const router = express.Router();

// Le nombre de produits disponibles dans la catégorie est calculé à la volée
const OFFER_SELECT = `
  SELECT o.*, (SELECT COUNT(*) FROM products p WHERE p.categorie = o.categorie AND p.quantite > 0) AS nb_produits
  FROM offers o`;

function serializeOffer(o) {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    categorie: o.categorie,
    image_url: mediaUrl(o.image_url),
    active: Boolean(o.active),
    nb_produits: o.nb_produits ?? 0,
    created_at: o.created_at,
  };
}

const loadOffer = (id) => {
  const o = get(`${OFFER_SELECT} WHERE o.id = ?`, requireId(id));
  if (!o) throw new HttpError(404, 'Offre introuvable');
  return o;
};

// GET /api/offers/?q=beton&category=Materials  (les admins voient aussi les offres désactivées avec ?all=1)
router.get('/', authOptional, (req, res) => {
  const where = [];
  const params = [];
  if (!(req.query.all && req.user?.role === 'admin')) where.push('o.active = 1');

  const q = str(req.query.q, 100);
  if (q) {
    where.push('(o.title LIKE ? OR o.description LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  const category = str(req.query.category, 60);
  if (category) {
    if (!CATEGORIES.includes(category)) throw new HttpError(400, 'Catégorie invalide');
    where.push('o.categorie = ?');
    params.push(category);
  }

  const rows = all(`${OFFER_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.id`, ...params);
  res.json(rows.map(serializeOffer));
});

router.get('/:id', (req, res) => {
  const o = loadOffer(req.params.id);
  if (!o.active) throw new HttpError(404, 'Offre introuvable');
  res.json(serializeOffer(o));
});

/* ---------- Gestion des offres (admin) ---------- */

function readOfferBody(body, { partial }) {
  const out = {};
  if (body.title !== undefined && str(body.title)) out.title = str(body.title, 150);
  if (body.description !== undefined) out.description = str(body.description, 1000);
  const categorie = body.categorie ?? body.category;
  if (categorie !== undefined && categorie !== '') {
    if (!CATEGORIES.includes(categorie)) throw new HttpError(400, `Catégorie invalide (${CATEGORIES.join(', ')})`);
    out.categorie = categorie;
  }
  if (body.active !== undefined) out.active = ['1', 'true', true, 1].includes(body.active) ? 1 : 0;
  if (!partial && !out.title) throw new HttpError(400, "Le titre de l'offre est requis");
  return out;
}

const adminOnly = [authRequired, requireRole('admin')];

router.post('/', ...adminOnly, upload.single('image'), (req, res) => {
  const data = readOfferBody(req.body, { partial: false });
  const { lastInsertRowid } = run(
    'INSERT INTO offers (title, description, categorie, image_url, active) VALUES (?, ?, ?, ?, ?)',
    data.title, data.description || '', data.categorie || 'Materials', uploadedPath(req.file), data.active ?? 1,
  );
  res.status(201).json(serializeOffer(loadOffer(lastInsertRowid)));
});

router.put('/:id', ...adminOnly, upload.single('image'), (req, res) => {
  const offer = loadOffer(req.params.id);
  const data = readOfferBody(req.body, { partial: true });
  if (req.file) data.image_url = uploadedPath(req.file);
  const fields = Object.keys(data);
  if (fields.length) {
    run(`UPDATE offers SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`, ...fields.map((f) => data[f]), offer.id);
  }
  res.json(serializeOffer(loadOffer(offer.id)));
});

router.delete('/:id', ...adminOnly, (req, res) => {
  const offer = loadOffer(req.params.id);
  run('DELETE FROM offers WHERE id = ?', offer.id);
  res.status(204).end();
});

module.exports = { router };
