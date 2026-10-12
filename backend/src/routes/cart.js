const express = require('express');
const { get, all, run } = require('../db');
const { HttpError, requireId } = require('../utils/http');
const { mediaUrl } = require('../utils/serializers');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

function cartOf(userId) {
  const items = all(
    `SELECT c.product_id, c.quantity, p.nom, p.prix, p.image_url, p.quantite AS stock
     FROM cart_items c JOIN products p ON p.id_produit = c.product_id
     WHERE c.user_id = ? ORDER BY p.nom`,
    userId,
  ).map((i) => ({ ...i, image_url: mediaUrl(i.image_url), subtotal: i.prix * i.quantity }));
  return {
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    total: items.reduce((s, i) => s + i.subtotal, 0),
  };
}

function checkStock(productId, quantity) {
  const p = get('SELECT quantite FROM products WHERE id_produit = ?', productId);
  if (!p) throw new HttpError(404, 'Produit introuvable');
  if (quantity > p.quantite) throw new HttpError(400, `Stock insuffisant (disponible : ${p.quantite})`);
}

router.get('/', (req, res) => res.json(cartOf(req.user.id)));

// Ajoute (ou incrémente) un produit
router.post('/', (req, res) => {
  const productId = requireId(req.body.product_id, 'product_id');
  const qty = Number.parseInt(req.body.quantity ?? 1, 10);
  if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'Quantité invalide');
  const current = get('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?', req.user.id, productId);
  checkStock(productId, (current?.quantity ?? 0) + qty);
  run(
    `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity`,
    req.user.id, productId, qty,
  );
  res.status(201).json(cartOf(req.user.id));
});

// Fixe la quantité ; 0 supprime la ligne
router.patch('/:productId', (req, res) => {
  const productId = requireId(req.params.productId, 'productId');
  const qty = Number.parseInt(req.body.quantity, 10);
  if (!Number.isInteger(qty) || qty < 0) throw new HttpError(400, 'Quantité invalide');
  if (qty === 0) {
    run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', req.user.id, productId);
  } else {
    checkStock(productId, qty);
    const { changes } = run('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', qty, req.user.id, productId);
    if (!changes) throw new HttpError(404, "Ce produit n'est pas dans votre panier");
  }
  res.json(cartOf(req.user.id));
});

router.delete('/:productId', (req, res) => {
  run('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', req.user.id, requireId(req.params.productId));
  res.json(cartOf(req.user.id));
});

router.delete('/', (req, res) => {
  run('DELETE FROM cart_items WHERE user_id = ?', req.user.id);
  res.json(cartOf(req.user.id));
});

module.exports = { router, cartOf };
