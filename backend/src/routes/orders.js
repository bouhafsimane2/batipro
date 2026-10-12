const express = require('express');
const { get, all, run, transaction } = require('../db');
const { HttpError, str } = require('../utils/http');
const { serializeOrder } = require('../utils/serializers');
const { authRequired } = require('../middleware/auth');
const { cartOf } = require('./cart');

const router = express.Router();
router.use(authRequired);

// Valide le panier de l'utilisateur en commande (cartafterdone/Cartfixedleft.js)
router.post('/', (req, res) => {
  const b = req.body;
  const fullName = str(b.fullName ?? b.full_name, 160);
  const phone = str(b.phoneNumber ?? b.phone, 30);
  if (!fullName || !phone) throw new HttpError(400, 'Nom complet et téléphone requis');

  const orderId = transaction(() => {
    const cart = cartOf(req.user.id);
    if (!cart.items.length) throw new HttpError(400, 'Votre panier est vide');

    for (const item of cart.items) {
      if (item.quantity > item.stock) throw new HttpError(400, `Stock insuffisant pour « ${item.nom} » (disponible : ${item.stock})`);
    }

    const delivery = b.delivery === true || b.delivery === 'yes' || b.delivery === 'true' || b.delivery === 1;
    const { lastInsertRowid } = run(
      `INSERT INTO orders (user_id, full_name, country, region, cartier, email, phone, note, delivery, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      req.user.id, fullName, str(b.country, 80), str(b.region, 80), str(b.cartier, 80),
      str(b.email, 200), phone, str(b.note), delivery ? 1 : 0, cart.total,
    );
    for (const item of cart.items) {
      run('INSERT INTO order_items (order_id, product_id, nom, prix, quantity) VALUES (?, ?, ?, ?, ?)',
        lastInsertRowid, item.product_id, item.nom, item.prix, item.quantity);
      run('UPDATE products SET quantite = quantite - ? WHERE id_produit = ?', item.quantity, item.product_id);
    }
    run('DELETE FROM cart_items WHERE user_id = ?', req.user.id);
    return lastInsertRowid;
  });

  res.status(201).json(serializeOrder(get('SELECT * FROM orders WHERE id = ?', orderId)));
});

router.get('/mine', (req, res) => {
  res.json(all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', req.user.id).map(serializeOrder));
});

module.exports = { router };
