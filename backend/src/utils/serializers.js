const { all, get } = require('../db');
const { PUBLIC_URL } = require('../config');

// Les images sont stockées en chemin relatif (/media/...) ; le front attend une URL absolue
function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${PUBLIC_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

const round1 = (n) => (n === null || n === undefined ? 0 : Math.round(Number(n) * 10) / 10);

function serializeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    telephone: u.telephone,
    address: u.address,
    birth_date: u.birth_date,
    bio: u.bio,
    image_url: mediaUrl(u.image_url),
    role: u.role,
    speciality: u.speciality,
    register_number: u.register_number,
  };
}

// Version publique : pas d'email ni de données sensibles
function serializePublicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    first_name: u.first_name,
    last_name: u.last_name,
    telephone: u.telephone,
    image_url: mediaUrl(u.image_url),
    role: u.role,
  };
}

const PROFESSIONAL_SELECT = `
  SELECT p.*, u.username, u.first_name, u.last_name, u.telephone, u.image_url, u.role, u.birth_date,
         (SELECT AVG(note) FROM reviews r WHERE r.professional_id = p.id) AS avis_moyenne,
         (SELECT COUNT(*)  FROM reviews r WHERE r.professional_id = p.id) AS nb_avis
  FROM professionals p
  JOIN users u ON u.id = p.user_id`;

function metiersOf(professionalId) {
  return all(
    `SELECT m.id_metier, m.nom_metier, pm.description
     FROM professional_metiers pm JOIN metiers m ON m.id_metier = pm.metier_id
     WHERE pm.professional_id = ? ORDER BY m.nom_metier`,
    professionalId,
  );
}

// Forme attendue par le front : profils/profils.js, my_profils/my_profils.js, home/Home.js
function serializeProfessional(row) {
  if (!row) return null;
  return {
    id: row.id,
    image_url: mediaUrl(row.image_url),
    localisation: row.localisation,
    postal_code: row.postal_code,
    about_me: row.about_me,
    description_experience: row.description_experience,
    avis_moyenne: round1(row.avis_moyenne),
    nb_avis: row.nb_avis ?? 0,
    status: row.status,
    created_at: row.created_at,
    client: {
      id: row.user_id,
      username: row.username,
      first_name: row.first_name,
      last_name: row.last_name,
      telephone: row.telephone,
      birth_date: row.birth_date,
    },
    metiers: metiersOf(row.id),
  };
}

function getProfessional(id) {
  return get(`${PROFESSIONAL_SELECT} WHERE p.id = ?`, id);
}

function serializeProduct(p) {
  if (!p) return null;
  return {
    id_produit: p.id_produit,
    nom: p.nom,
    description: p.description,
    prix: p.prix,
    quantite: p.quantite,
    categorie: p.categorie,
    image_url: mediaUrl(p.image_url),
    owner_id: p.owner_id,
    created_at: p.created_at,
  };
}

function serializeOrder(o) {
  const items = all('SELECT id, product_id, nom, prix, quantity FROM order_items WHERE order_id = ?', o.id);
  return { ...o, delivery: Boolean(o.delivery), items };
}

module.exports = {
  mediaUrl,
  serializeUser,
  serializePublicUser,
  serializeProfessional,
  serializeProduct,
  serializeOrder,
  getProfessional,
  PROFESSIONAL_SELECT,
};
