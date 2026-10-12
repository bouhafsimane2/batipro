const express = require('express');
const { get, all, run, transaction } = require('../db');
const { HttpError, requireId, str } = require('../utils/http');
const { serializeProfessional, getProfessional, PROFESSIONAL_SELECT } = require('../utils/serializers');
const { authOptional, authRequired } = require('../middleware/auth');
const { createUser, issueToken, authResponse } = require('./auth');

const router = express.Router();

// Retrouve un métier par son nom, ou le crée
function metierId(nom) {
  const existing = get('SELECT id_metier FROM metiers WHERE nom_metier = ?', nom);
  if (existing) return existing.id_metier;
  return Number(run('INSERT INTO metiers (nom_metier) VALUES (?)', nom).lastInsertRowid);
}

router.get('/', (_req, res) => {
  const rows = all(`${PROFESSIONAL_SELECT} WHERE p.status = 'approved' ORDER BY avis_moyenne DESC NULLS LAST, p.id`);
  res.json(rows.map(serializeProfessional));
});

// GET /api/professionals/search/?nom=&localisation=&metiers=1,2
router.get('/search', (req, res) => {
  const where = ["p.status = 'approved'"];
  const params = [];

  const nom = str(req.query.nom, 100);
  if (nom) {
    where.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ?
                 OR (u.first_name || ' ' || u.last_name) LIKE ? OR (u.last_name || ' ' || u.first_name) LIKE ?)`);
    params.push(...Array(5).fill(`%${nom}%`));
  }
  const localisation = str(req.query.localisation, 100);
  if (localisation) {
    where.push('p.localisation LIKE ?');
    params.push(`%${localisation}%`);
  }
  const metiers = str(req.query.metiers, 200).split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (metiers.length) {
    where.push(`p.id IN (SELECT professional_id FROM professional_metiers WHERE metier_id IN (${metiers.map(() => '?').join(',')}))`);
    params.push(...metiers);
  }

  const rows = all(`${PROFESSIONAL_SELECT} WHERE ${where.join(' AND ')} ORDER BY avis_moyenne DESC NULLS LAST, p.id`, ...params);
  res.json(rows.map(serializeProfessional));
});

// Candidature "Work with us" (recrutement/Recrutement.js) : crée un profil en attente de validation
router.post('/apply', authOptional, (req, res) => {
  const b = req.body;
  const professions = str(b.profession, 300).split(',').map((s) => s.trim()).filter(Boolean);
  if (!professions.length) throw new HttpError(400, 'Veuillez indiquer au moins une profession');
  if (!str(b.firstName) || !str(b.lastName)) throw new HttpError(400, 'Nom et prénom requis');
  if (!str(b.phoneNum)) throw new HttpError(400, 'Numéro de téléphone requis');

  const result = transaction(() => {
    let user = req.user;
    if (user) {
      if (get('SELECT 1 FROM professionals WHERE user_id = ?', user.id)) {
        throw new HttpError(409, 'Vous avez déjà déposé une candidature');
      }
      if (user.role === 'admin') throw new HttpError(400, 'Un administrateur ne peut pas candidater');
    } else {
      user = createUser({
        username: str(b.userName ?? b.username, 40),
        password: String(b.password || ''),
        email: str(b.email, 200),
        role: 'professional',
      });
    }

    run(
      `UPDATE users SET first_name = ?, last_name = ?, telephone = ?, address = ?, birth_date = ?, bio = ?, role = 'professional'
       WHERE id = ?`,
      str(b.firstName, 80), str(b.lastName, 80), str(b.phoneNum, 30), str(b.address, 200),
      str(b.birthDate, 20) || null, str(b.aboutYou), user.id,
    );
    const { lastInsertRowid } = run(
      `INSERT INTO professionals (user_id, localisation, postal_code, about_me, description_experience)
       VALUES (?, ?, ?, ?, ?)`,
      user.id, str(b.address, 200), str(b.postalCode, 20), str(b.aboutYou), str(b.experience),
    );
    for (const nom of professions) {
      run(
        'INSERT OR IGNORE INTO professional_metiers (professional_id, metier_id, description) VALUES (?, ?, ?)',
        lastInsertRowid, metierId(nom.slice(0, 80)), str(b.experience, 500),
      );
    }
    return { userId: user.id, professionalId: Number(lastInsertRowid), isNew: !req.user };
  });

  const user = get('SELECT * FROM users WHERE id = ?', result.userId);
  res.status(201).json({
    message: 'Candidature envoyée. Elle sera visible après validation par un administrateur.',
    professional: serializeProfessional(getProfessional(result.professionalId)),
    ...(result.isNew ? authResponse(user, issueToken(user.id)) : {}),
  });
});

// Profil professionnel de l'utilisateur connecté
router.get('/me', authRequired, (req, res) => {
  const row = get(`${PROFESSIONAL_SELECT} WHERE p.user_id = ?`, req.user.id);
  if (!row) throw new HttpError(404, "Vous n'avez pas de profil professionnel");
  res.json(serializeProfessional(row));
});

// Demandes d'embauche reçues par le professionnel connecté
router.get('/me/hires', authRequired, (req, res) => {
  const prof = get('SELECT id FROM professionals WHERE user_id = ?', req.user.id);
  if (!prof) throw new HttpError(404, "Vous n'avez pas de profil professionnel");
  res.json(all('SELECT * FROM hire_requests WHERE professional_id = ? ORDER BY id DESC', prof.id));
});

router.patch('/me/hires/:hireId', authRequired, (req, res) => {
  const prof = get('SELECT id FROM professionals WHERE user_id = ?', req.user.id);
  const status = str(req.body.status);
  if (!['pending', 'accepted', 'declined'].includes(status)) throw new HttpError(400, 'Statut invalide');
  const { changes } = run(
    'UPDATE hire_requests SET status = ? WHERE id = ? AND professional_id = ?',
    status, requireId(req.params.hireId), prof?.id ?? -1,
  );
  if (!changes) throw new HttpError(404, 'Demande introuvable');
  res.json(get('SELECT * FROM hire_requests WHERE id = ?', requireId(req.params.hireId)));
});

function loadVisibleProfessional(req) {
  const row = getProfessional(requireId(req.params.id));
  const canSeePending = req.user && (req.user.role === 'admin' || req.user.id === row?.user_id);
  if (!row || (row.status !== 'approved' && !canSeePending)) throw new HttpError(404, 'Professionnel introuvable');
  return row;
}

router.get('/:id', authOptional, (req, res) => {
  res.json(serializeProfessional(loadVisibleProfessional(req)));
});

// Format attendu par components/review/review.js
router.get('/:id/reviews', authOptional, (req, res) => {
  const prof = loadVisibleProfessional(req);
  const rows = all(
    `SELECT r.id, r.note, r.commentaire, r.date_avis, u.id AS client_id, u.first_name, u.last_name, u.username
     FROM reviews r JOIN users u ON u.id = r.client_id
     WHERE r.professional_id = ? ORDER BY r.id DESC`,
    prof.id,
  );
  res.json(rows.map((r) => ({
    id: r.id,
    note: r.note,
    commentaire: r.commentaire,
    date_avis: r.date_avis,
    client: { id: r.client_id, first_name: r.first_name || r.username, last_name: r.last_name, username: r.username },
  })));
});

// components/addreview/addreview.js → POST /api/professionals/:id/review/ { commentaire, note }
router.post('/:id/review', authRequired, (req, res) => {
  const prof = loadVisibleProfessional(req);
  if (prof.user_id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas noter votre propre profil');
  const note = Number(req.body.note);
  const commentaire = str(req.body.commentaire, 2000);
  if (!Number.isInteger(note) || note < 1 || note > 5) throw new HttpError(400, 'La note doit être comprise entre 1 et 5');
  if (!commentaire) throw new HttpError(400, 'Le commentaire est requis');

  const { lastInsertRowid } = run(
    'INSERT INTO reviews (professional_id, client_id, note, commentaire) VALUES (?, ?, ?, ?)',
    prof.id, req.user.id, note, commentaire,
  );
  res.status(201).json(get('SELECT * FROM reviews WHERE id = ?', lastInsertRowid));
});

// hireInfor/hireInfor.js → demande d'embauche
router.post('/:id/hire', authRequired, (req, res) => {
  res.status(201).json(createHireRequest(req, requireId(req.params.id)));
});

function createHireRequest(req, professionalId) {
  const prof = getProfessional(professionalId);
  if (!prof || prof.status !== 'approved') throw new HttpError(404, 'Professionnel introuvable');
  if (prof.user_id === req.user.id) throw new HttpError(400, 'Vous ne pouvez pas vous embaucher vous-même');
  const b = req.body;
  const fullName = str(b.fullName ?? b.full_name, 160);
  const phone = str(b.phoneNumber ?? b.phone, 30);
  if (!fullName || !phone) throw new HttpError(400, 'Nom complet et téléphone requis');

  const { lastInsertRowid } = run(
    `INSERT INTO hire_requests (professional_id, client_id, full_name, country, region, cartier, email, phone, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    prof.id, req.user.id, fullName, str(b.country, 80), str(b.region, 80), str(b.cartier, 80),
    str(b.email, 200), phone, str(b.note),
  );
  return get('SELECT * FROM hire_requests WHERE id = ?', lastInsertRowid);
}

module.exports = { router, createHireRequest };
