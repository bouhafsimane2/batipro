const express = require('express');
const { all, run } = require('../db');
const { serializeProduct, serializeProfessional, PROFESSIONAL_SELECT } = require('../utils/serializers');
const { HttpError, requireId } = require('../utils/http');
const { authRequired } = require('../middleware/auth');
const { createHireRequest } = require('./professionals');

const router = express.Router();

// home/Home.js → { products, professionals }
router.get('/home/products', (_req, res) => {
  const products = all('SELECT * FROM products ORDER BY id_produit DESC LIMIT 8').map(serializeProduct);
  const professionals = all(
    `${PROFESSIONAL_SELECT} WHERE p.status = 'approved' ORDER BY avis_moyenne DESC NULLS LAST, p.id LIMIT 6`,
  ).map(serializeProfessional);
  res.json({ products, professionals });
});

// profils/profils.js → liste déroulante des métiers
router.get('/metiers', (_req, res) => {
  res.json(all('SELECT id_metier, nom_metier FROM metiers ORDER BY nom_metier'));
});

// hireInfor/hireInfor.js → POST /api/order { prof_id, fullName, ... }
router.post('/order', authRequired, (req, res) => {
  const profId = requireId(req.body.prof_id, 'prof_id');
  res.status(201).json(createHireRequest(req, profId));
});

// Favoris (icône coeur des cartes produit)
router.get('/favorites', authRequired, (req, res) => {
  const rows = all(
    `SELECT p.* FROM favorites f JOIN products p ON p.id_produit = f.product_id WHERE f.user_id = ? ORDER BY p.nom`,
    req.user.id,
  );
  res.json(rows.map(serializeProduct));
});

router.post('/favorites/:productId', authRequired, (req, res) => {
  const productId = requireId(req.params.productId);
  try {
    run('INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)', req.user.id, productId);
  } catch {
    throw new HttpError(404, 'Produit introuvable');
  }
  res.status(201).json({ favorite: true });
});

router.delete('/favorites/:productId', authRequired, (req, res) => {
  run('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', req.user.id, requireId(req.params.productId));
  res.json({ favorite: false });
});

module.exports = { router };
