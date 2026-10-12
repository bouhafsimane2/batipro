const express = require('express');
const { get, all, run, transaction } = require('../db');
const { HttpError, requireId, str } = require('../utils/http');
const { serializeOrder, serializeProfessional, serializeUser, getProfessional, PROFESSIONAL_SELECT } = require('../utils/serializers');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('admin'));

router.get('/stats', (_req, res) => {
  const count = (sql) => get(sql).n;
  res.json({
    users: count('SELECT COUNT(*) AS n FROM users'),
    professionals: count("SELECT COUNT(*) AS n FROM professionals WHERE status = 'approved'"),
    pending_demands: count("SELECT COUNT(*) AS n FROM professionals WHERE status = 'pending'"),
    products: count('SELECT COUNT(*) AS n FROM products'),
    pending_orders: count("SELECT COUNT(*) AS n FROM orders WHERE status = 'pending'"),
  });
});

/* ---------- Commandes (adimnComponents/commands, displayorder) ---------- */

router.get('/orders', (req, res) => {
  const status = str(req.query.status);
  const rows = status
    ? all('SELECT * FROM orders WHERE status = ? ORDER BY id DESC', status)
    : all('SELECT * FROM orders ORDER BY id DESC');
  res.json(rows.map(serializeOrder));
});

function loadOrder(id) {
  const o = get('SELECT * FROM orders WHERE id = ?', requireId(id));
  if (!o) throw new HttpError(404, 'Commande introuvable');
  return o;
}

router.get('/orders/:id', (req, res) => res.json(serializeOrder(loadOrder(req.params.id))));

router.patch('/orders/:id', (req, res) => {
  const order = loadOrder(req.params.id);
  const status = str(req.body.status);
  if (!['pending', 'validated', 'cancelled'].includes(status)) throw new HttpError(400, 'Statut invalide');
  transaction(() => {
    // Une commande annulée remet ses produits en stock
    if (status === 'cancelled' && order.status !== 'cancelled') restock(order.id);
    run('UPDATE orders SET status = ? WHERE id = ?', status, order.id);
  });
  res.json(serializeOrder(loadOrder(order.id)));
});

router.delete('/orders/:id', (req, res) => {
  const order = loadOrder(req.params.id);
  transaction(() => {
    if (order.status === 'pending') restock(order.id);
    run('DELETE FROM orders WHERE id = ?', order.id);
  });
  res.status(204).end();
});

function restock(orderId) {
  for (const item of all('SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL', orderId)) {
    run('UPDATE products SET quantite = quantite + ? WHERE id_produit = ?', item.quantity, item.product_id);
  }
}

/* ---------- Demandes de recrutement (adimnComponents/demands, admin/demmande) ---------- */

router.get('/demands', (req, res) => {
  const status = str(req.query.status) || 'pending';
  res.json(all(`${PROFESSIONAL_SELECT} WHERE p.status = ? ORDER BY p.id DESC`, status).map(serializeProfessional));
});

function loadDemand(id) {
  const p = getProfessional(requireId(id));
  if (!p) throw new HttpError(404, 'Demande introuvable');
  return p;
}

router.post('/demands/:id/validate', (req, res) => {
  const p = loadDemand(req.params.id);
  run("UPDATE professionals SET status = 'approved' WHERE id = ?", p.id);
  res.json(serializeProfessional(getProfessional(p.id)));
});

router.post('/demands/:id/reject', (req, res) => {
  const p = loadDemand(req.params.id);
  run("UPDATE professionals SET status = 'rejected' WHERE id = ?", p.id);
  res.json(serializeProfessional(getProfessional(p.id)));
});

// Supprime le profil professionnel ; le compte redevient un compte client
router.delete('/demands/:id', (req, res) => {
  const p = loadDemand(req.params.id);
  transaction(() => {
    run('DELETE FROM professionals WHERE id = ?', p.id);
    run("UPDATE users SET role = 'client' WHERE id = ? AND role = 'professional'", p.user_id);
  });
  res.status(204).end();
});

/* ---------- Profils (adimnComponents/profiles) ---------- */

router.get('/profiles', (req, res) => {
  const type = str(req.query.type) || 'professional';
  if (type === 'professional') {
    return res.json(all(`${PROFESSIONAL_SELECT} WHERE p.status = 'approved' ORDER BY p.id`).map(serializeProfessional));
  }
  if (!['market_owner', 'client', 'admin'].includes(type)) throw new HttpError(400, 'Type de profil invalide');
  res.json(all('SELECT * FROM users WHERE role = ? ORDER BY id', type).map(serializeUser));
});

router.patch('/users/:id', (req, res) => {
  const id = requireId(req.params.id);
  const role = str(req.body.role);
  if (!['client', 'professional', 'market_owner', 'admin'].includes(role)) throw new HttpError(400, 'Rôle invalide');
  if (id === req.user.id && role !== 'admin') throw new HttpError(400, 'Vous ne pouvez pas retirer votre propre rôle admin');
  const { changes } = run('UPDATE users SET role = ? WHERE id = ?', role, id);
  if (!changes) throw new HttpError(404, 'Utilisateur introuvable');
  res.json(serializeUser(get('SELECT * FROM users WHERE id = ?', id)));
});

router.get('/hires', (_req, res) => {
  res.json(all(
    `SELECT h.*, u.first_name AS prof_first_name, u.last_name AS prof_last_name
     FROM hire_requests h JOIN professionals p ON p.id = h.professional_id JOIN users u ON u.id = p.user_id
     ORDER BY h.id DESC`,
  ));
});

module.exports = { router };
