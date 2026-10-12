// Remplit la base avec des données de démonstration.
//   npm run seed       → ne fait rien si la base contient déjà des utilisateurs
//   npm run reset-db   → supprime la base puis la recrée
const fs = require('node:fs');
const { DB_FILE } = require('../config');

if (process.argv.includes('--reset')) {
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(DB_FILE + suffix, { force: true });
  console.log('Base supprimée :', DB_FILE);
}

const { get, run, transaction } = require('./index');
const { hashPassword } = require('../utils/security');

// Offres de la page Offers (une par catégorie du marketplace)
const OFFERS = [
  ['Matériaux de construction', 'Briques, ciment, sable, parpaings : tout le gros œuvre livré sur votre chantier.', 'Materials'],
  ['Location de matériel', 'Bétonnières, échafaudages et engins disponibles à la journée ou à la semaine.', 'Equipment_Rental'],
  ['Services professionnels', 'Poses et finitions réalisées par des artisans qualifiés : faux plafonds, carrelage, peinture.', 'Professional_Services'],
  ['Conseil et planification', 'Études de plans, permis de construire et suivi de projet par des architectes agréés.', 'Consultation_and_Planning'],
  ['Entretien et réparation', "Inspection, étanchéité et réparations pour garder votre bâtiment en bon état.", 'Maintenance_and_Repair'],
];

if (get('SELECT COUNT(*) AS n FROM offers').n === 0) {
  for (const [title, description, categorie] of OFFERS) {
    run('INSERT INTO offers (title, description, categorie) VALUES (?, ?, ?)', title, description, categorie);
  }
  console.log(`${OFFERS.length} offres ajoutées.`);
}

if (get('SELECT COUNT(*) AS n FROM users').n > 0) {
  console.log('La base contient déjà des utilisateurs — le reste du seed est ignoré (utilisez "npm run reset-db" pour repartir de zéro).');
  process.exit(0);
}

// En production (dépôt public), le mot de passe admin vient d'une variable d'environnement secrète
const { IS_PRODUCTION } = require('../config');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (IS_PRODUCTION ? null : 'admin123');
if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD doit être défini en production pour créer le compte admin.');
  process.exit(1);
}

// Comptes de démonstration (mots de passe de test uniquement)
const USERS = [
  { username: 'admin', password: ADMIN_PASSWORD, email: 'admin@batipro.dz', first_name: 'Admin', last_name: 'Batipro', role: 'admin', telephone: '0550000000', address: 'Alger' },
  { username: 'client', password: 'client123', email: 'client@batipro.dz', first_name: 'Sofiane', last_name: 'Mansouri', role: 'client', telephone: '0551000001', address: 'Bejaia' },
  { username: 'vendeur', password: 'vendeur123', email: 'vendeur@batipro.dz', first_name: 'Nadia', last_name: 'Hamidi', role: 'market_owner', telephone: '0551000002', address: 'Bouira', speciality: 'Materials', register_number: '16/00-1234567B21' },
  { username: 'karim.macon', password: 'pro12345', email: 'karim@batipro.dz', first_name: 'Karim', last_name: 'Benali', role: 'professional', telephone: '0661000003', address: 'Bouira' },
  { username: 'yacine.plombier', password: 'pro12345', email: 'yacine@batipro.dz', first_name: 'Yacine', last_name: 'Cherif', role: 'professional', telephone: '0661000004', address: 'Bejaia' },
  { username: 'amel.archi', password: 'pro12345', email: 'amel@batipro.dz', first_name: 'Amel', last_name: 'Saidi', role: 'professional', telephone: '0661000005', address: 'Alger' },
  { username: 'walid.elec', password: 'pro12345', email: 'walid@batipro.dz', first_name: 'Walid', last_name: 'Ouali', role: 'professional', telephone: '0661000006', address: 'Tizi Ouzou' },
];

const METIERS = ['Maçon', 'Plombier', 'Électricien', 'Peintre', 'Menuisier', 'Carreleur', 'Architecte', 'Chef de chantier'];

// status 'pending' = demande de recrutement à valider par l'admin
const PROFESSIONALS = [
  { username: 'karim.macon', localisation: 'Bouira', postal_code: '10000', status: 'approved',
    about_me: 'Maçon passionné, je réalise vos travaux de gros œuvre avec rigueur et dans les délais.',
    description_experience: '12 ans de maçonnerie : villas, extensions et rénovations.',
    metiers: [['Maçon', 'Gros œuvre, murs porteurs, dalles'], ['Carreleur', 'Pose de carrelage intérieur et extérieur']] },
  { username: 'yacine.plombier', localisation: 'Bejaia', postal_code: '06000', status: 'approved',
    about_me: 'Plombier-chauffagiste disponible 7j/7 pour installations et dépannages.',
    description_experience: '8 ans en plomberie sanitaire et chauffage central.',
    metiers: [['Plombier', 'Installation sanitaire, recherche de fuites, chauffage']] },
  { username: 'amel.archi', localisation: 'Alger', postal_code: '16000', status: 'approved',
    about_me: "Architecte d'intérieur, j'accompagne vos projets de la conception au suivi de chantier.",
    description_experience: '10 ans de conception et de suivi de projets résidentiels.',
    metiers: [['Architecte', 'Plans, permis de construire, design intérieur'], ['Chef de chantier', 'Coordination des corps de métier']] },
  { username: 'walid.elec', localisation: 'Tizi Ouzou', postal_code: '15000', status: 'pending',
    about_me: 'Électricien du bâtiment, mise aux normes et installations neuves.',
    description_experience: '5 ans en électricité résidentielle.',
    metiers: [['Électricien', 'Câblage, tableaux électriques, mise aux normes']] },
];

const PRODUCTS = [
  ['Brique rouge 12 trous', 'Brique de terre cuite pour murs porteurs et cloisons.', 35, 5000, 'Materials', '/media/seed/brique.png'],
  ['Ciment CPJ 42.5 (50 kg)', 'Ciment portland composé pour maçonnerie et béton.', 950, 400, 'Materials', '/media/seed/ciment.png'],
  ['Sable de construction (m³)', 'Sable lavé idéal pour mortier et béton.', 1800, 120, 'Materials', '/media/seed/ciment.png'],
  ['Parpaing 20 cm', 'Bloc béton creux pour murs extérieurs.', 60, 3000, 'Materials', '/media/seed/brique.png'],
  ['Location bétonnière (jour)', 'Bétonnière électrique 350 L, livrée sur chantier.', 2500, 10, 'Equipment_Rental', '/media/seed/ciment.png'],
  ['Location échafaudage (semaine)', 'Échafaudage roulant 6 m avec garde-corps.', 6000, 6, 'Equipment_Rental', '/media/seed/brique.png'],
  ['Étude de plans', "Étude et validation de plans par un architecte agréé.", 15000, 50, 'Consultation_and_Planning', '/media/seed/brique.png'],
  ['Entretien toiture', "Inspection et réparation d'étanchéité de toiture.", 8000, 30, 'Maintenance_and_Repair', '/media/seed/ciment.png'],
  ['Pose de faux plafond (m²)', 'Pose de plaques BA13 avec ossature métallique.', 1200, 500, 'Professional_Services', '/media/seed/brique.png'],
];

transaction(() => {
  const ids = {};
  for (const u of USERS) {
    const { lastInsertRowid } = run(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, telephone, address, role, image_url, speciality, register_number, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      u.username, u.email, hashPassword(u.password), u.first_name, u.last_name, u.telephone, u.address, u.role,
      '/media/seed/profil.jpg', u.speciality || null, u.register_number || null, '',
    );
    ids[u.username] = Number(lastInsertRowid);
  }

  const metierIds = {};
  for (const nom of METIERS) metierIds[nom] = Number(run('INSERT INTO metiers (nom_metier) VALUES (?)', nom).lastInsertRowid);

  const profIds = {};
  for (const p of PROFESSIONALS) {
    const { lastInsertRowid } = run(
      `INSERT INTO professionals (user_id, localisation, postal_code, about_me, description_experience, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ids[p.username], p.localisation, p.postal_code, p.about_me, p.description_experience, p.status,
    );
    profIds[p.username] = Number(lastInsertRowid);
    for (const [nom, description] of p.metiers) {
      run('INSERT INTO professional_metiers (professional_id, metier_id, description) VALUES (?, ?, ?)',
        lastInsertRowid, metierIds[nom], description);
    }
  }

  const reviews = [
    ['karim.macon', 5, 'Travail soigné et rapide, je recommande !'],
    ['karim.macon', 4, 'Très professionnel, chantier propre.'],
    ['yacine.plombier', 5, 'Intervention rapide pour une fuite, merci.'],
    ['amel.archi', 4, 'Plans clairs et bons conseils.'],
  ];
  for (const [prof, note, commentaire] of reviews) {
    run('INSERT INTO reviews (professional_id, client_id, note, commentaire) VALUES (?, ?, ?, ?)',
      profIds[prof], ids.client, note, commentaire);
  }

  for (const [nom, description, prix, quantite, categorie, image] of PRODUCTS) {
    run(`INSERT INTO products (nom, description, prix, quantite, categorie, image_url, owner_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, nom, description, prix, quantite, categorie, image, ids.vendeur);
  }

  // Une commande d'exemple pour l'espace admin
  const { lastInsertRowid: orderId } = run(
    `INSERT INTO orders (user_id, full_name, country, region, cartier, email, phone, note, delivery, total)
     VALUES (?, ?, 'Algeria', 'Bejaia', 'Centre-ville', ?, ?, 'Livraison le matin si possible', 1, ?)`,
    ids.client, 'Sofiane Mansouri', 'client@batipro.dz', '0551000001', 35 * 200 + 950 * 10,
  );
  run('INSERT INTO order_items (order_id, product_id, nom, prix, quantity) VALUES (?, 1, ?, 35, 200)', orderId, PRODUCTS[0][0]);
  run('INSERT INTO order_items (order_id, product_id, nom, prix, quantity) VALUES (?, 2, ?, 950, 10)', orderId, PRODUCTS[1][0]);

  // Une conversation d'exemple entre le client et un professionnel
  const [a, b] = [ids.client, ids['karim.macon']].sort((x, y) => x - y);
  const { lastInsertRowid: convId } = run('INSERT INTO conversations (user_a_id, user_b_id) VALUES (?, ?)', a, b);
  run('INSERT INTO messages (conversation_id, sender_id, content, read_at) VALUES (?, ?, ?, ?)',
    convId, ids.client, 'Bonjour, êtes-vous disponible pour une extension de 30 m² à Bouira ?', new Date().toISOString());
  run('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
    convId, ids['karim.macon'], 'Bonjour ! Oui, je peux passer voir le terrain cette semaine.');
  run("UPDATE conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?", convId);
});

console.log('Données de démonstration insérées.');
console.log(`Comptes : admin/${process.env.ADMIN_PASSWORD ? '(ADMIN_PASSWORD)' : 'admin123'} · client/client123 · vendeur/vendeur123 · karim.macon/pro12345`);
