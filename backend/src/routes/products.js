const express = require('express');
const { get, all, run } = require('../db');
const { HttpError, requireId, str } = require('../utils/http');
const { serializeProduct } = require('../utils/serializers');
const { authRequired, requireRole } = require('../middleware/auth');
const { upload, uploadedPath } = require('../middleware/upload');

const router = express.Router();

const CATEGORIES = ['Materials', 'Professional_Services', 'Equipment_Rental', 'Consultation_and_Planning', 'Maintenance_and_Repair'];

router.get('/categories', (_req, res) => res.json(CATEGORIES));

// GET /api/products/?category=Materials,Equipment_Rental&min_price=0&max_price=200&q=brique&owner=me
router.get('/', authOptionalIfOwnerFilter, (req, res) => {
  const where = [];
  const params = [];

  const categories = str(req.query.category ?? req.query.categories, 300)
    .split(',').map((c) => c.trim()).filter((c) => CATEGORIES.includes(c));
  if (categories.length) {
    where.push(`categorie IN (${categories.map(() => '?').join(',')})`);
    params.push(...categories);
  }
  const min = Number(req.query.min_price);
  if (req.query.min_price !== undefined && Number.isFinite(min)) { where.push('prix >= ?'); params.push(min); }
  const max = Number(req.query.max_price);
  if (req.query.max_price !== undefined && Number.isFinite(max)) { where.push('prix < ?'); params.push(max); }
  const q = str(req.query.q, 100);
  if (q) { where.push('(nom LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (req.query.owner === 'me' && req.user && req.user.role !== 'admin') { where.push('owner_id = ?'); params.push(req.user.id); }

  const rows = all(
    `SELECT * FROM products ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id_produit DESC`,
    ...params,
  );
  res.json(rows.map(serializeProduct));
});

function authOptionalIfOwnerFilter(req, res, next) {
  if (req.query.owner !== 'me') return next();
  return authRequired(req, res, next);
}

router.get('/:id', (req, res) => {
  const p = get('SELECT * FROM products WHERE id_produit = ?', requireId(req.params.id));
  if (!p) throw new HttpError(404, 'Produit introuvable');
  res.json(serializeProduct(p));
});

// Accepte les noms du front admin (productName/price/quantity) et ceux de la base (nom/prix/quantite)
function readProductBody(body, { partial }) {
  const out = {};
  const nom = body.nom ?? body.productName;
  const prix = body.prix ?? body.price;
  const quantite = body.quantite ?? body.quantity;
  const categorie = body.categorie ?? body.category;

  if (nom !== undefined && str(nom)) out.nom = str(nom, 150);
  if (body.description !== undefined) out.description = str(body.description, 3000);
  if (prix !== undefined && prix !== '') {
    const n = Number(String(prix).replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new HttpError(400, 'Prix invalide');
    out.prix = n;
  }
  if (quantite !== undefined && quantite !== '') {
    const n = Number.parseInt(quantite, 10);
    if (!Number.isInteger(n) || n < 0) throw new HttpError(400, 'Quantité invalide');
    out.quantite = n;
  }
  if (categorie !== undefined && categorie !== '') {
    if (!CATEGORIES.includes(categorie)) throw new HttpError(400, `Catégorie invalide (${CATEGORIES.join(', ')})`);
    out.categorie = categorie;
  }
  if (!partial && (out.nom === undefined || out.prix === undefined)) {
    throw new HttpError(400, 'Le nom et le prix du produit sont requis');
  }
  return out;
}

function loadOwnedProduct(req) {
  const p = get('SELECT * FROM products WHERE id_produit = ?', requireId(req.params.id));
  if (!p) throw new HttpError(404, 'Produit introuvable');
  if (req.user.role !== 'admin' && p.owner_id !== req.user.id) throw new HttpError(403, 'Accès refusé');
  return p;
}

const canSell = requireRole('admin', 'market_owner');

router.post('/', authRequired, canSell, upload.single('image'), (req, res) => {
  const data = readProductBody(req.body, { partial: false });
  const { lastInsertRowid } = run(
    `INSERT INTO products (nom, description, prix, quantite, categorie, image_url, owner_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    data.nom, data.description || '', data.prix, data.quantite ?? 0, data.categorie || 'Materials',
    uploadedPath(req.file) || str(req.body.image_url, 500) || null, req.user.id,
  );
  res.status(201).json(serializeProduct(get('SELECT * FROM products WHERE id_produit = ?', lastInsertRowid)));
});

router.put('/:id', authRequired, canSell, upload.single('image'), (req, res) => {
  const product = loadOwnedProduct(req);
  const data = readProductBody(req.body, { partial: true });
  if (req.file) data.image_url = uploadedPath(req.file);
  const fields = Object.keys(data);
  if (fields.length) {
    run(
      `UPDATE products SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE id_produit = ?`,
      ...fields.map((f) => data[f]), product.id_produit,
    );
  }
  res.json(serializeProduct(get('SELECT * FROM products WHERE id_produit = ?', product.id_produit)));
});

router.delete('/:id', authRequired, canSell, (req, res) => {
  const product = loadOwnedProduct(req);
  run('DELETE FROM products WHERE id_produit = ?', product.id_produit);
  res.status(204).end();
});

module.exports = { router, CATEGORIES };
