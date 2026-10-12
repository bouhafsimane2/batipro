-- Schéma de la base Batipro (SQLite)
PRAGMA foreign_keys = ON;

-- Comptes : clients, professionnels (mains d'oeuvre), vendeurs (market owners) et admins
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT    UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  first_name    TEXT    NOT NULL DEFAULT '',
  last_name     TEXT    NOT NULL DEFAULT '',
  telephone     TEXT    NOT NULL DEFAULT '',
  address       TEXT    NOT NULL DEFAULT '',
  birth_date    TEXT,
  bio           TEXT    NOT NULL DEFAULT '',
  image_url     TEXT,
  role          TEXT    NOT NULL DEFAULT 'client'
                CHECK (role IN ('client', 'professional', 'market_owner', 'admin')),
  -- Champs spécifiques aux vendeurs
  speciality      TEXT,
  register_number TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  key        TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metiers (
  id_metier  INTEGER PRIMARY KEY AUTOINCREMENT,
  nom_metier TEXT NOT NULL UNIQUE COLLATE NOCASE
);

-- Profil professionnel ; status = 'pending' tant que la demande de recrutement n'est pas validée
CREATE TABLE IF NOT EXISTS professionals (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  localisation           TEXT    NOT NULL DEFAULT '',
  postal_code            TEXT    NOT NULL DEFAULT '',
  about_me               TEXT    NOT NULL DEFAULT '',
  description_experience TEXT    NOT NULL DEFAULT '',
  status                 TEXT    NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at             TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS professional_metiers (
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  metier_id       INTEGER NOT NULL REFERENCES metiers(id_metier) ON DELETE CASCADE,
  description     TEXT    NOT NULL DEFAULT '',
  PRIMARY KEY (professional_id, metier_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  client_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note            INTEGER NOT NULL CHECK (note BETWEEN 0 AND 5),
  commentaire     TEXT    NOT NULL,
  date_avis       TEXT    NOT NULL DEFAULT (date('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_prof ON reviews(professional_id);

CREATE TABLE IF NOT EXISTS products (
  id_produit  INTEGER PRIMARY KEY AUTOINCREMENT,
  nom         TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  prix        REAL    NOT NULL CHECK (prix >= 0),
  quantite    INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  categorie   TEXT    NOT NULL DEFAULT 'Materials'
              CHECK (categorie IN ('Materials', 'Professional_Services', 'Equipment_Rental',
                                   'Consultation_and_Planning', 'Maintenance_and_Repair')),
  image_url   TEXT,
  owner_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Offres du marketplace (page Offers) ; chaque offre renvoie vers une catégorie de produits
CREATE TABLE IF NOT EXISTS offers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  categorie   TEXT    NOT NULL DEFAULT 'Materials'
              CHECK (categorie IN ('Materials', 'Professional_Services', 'Equipment_Rental',
                                   'Consultation_and_Planning', 'Maintenance_and_Repair')),
  image_url   TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id_produit) ON DELETE CASCADE,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id_produit) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (user_id, product_id)
);

-- Commandes du marketplace
CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  full_name  TEXT    NOT NULL,
  country    TEXT    NOT NULL DEFAULT '',
  region     TEXT    NOT NULL DEFAULT '',
  cartier    TEXT    NOT NULL DEFAULT '',
  email      TEXT    NOT NULL DEFAULT '',
  phone      TEXT    NOT NULL DEFAULT '',
  note       TEXT    NOT NULL DEFAULT '',
  delivery   INTEGER NOT NULL DEFAULT 0,
  total      REAL    NOT NULL DEFAULT 0,
  status     TEXT    NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'validated', 'cancelled')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id_produit) ON DELETE SET NULL,
  nom        TEXT    NOT NULL,
  prix       REAL    NOT NULL,
  quantity   INTEGER NOT NULL CHECK (quantity > 0)
);

-- Demandes d'embauche d'un professionnel ("Hire now")
CREATE TABLE IF NOT EXISTS hire_requests (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  client_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  full_name       TEXT    NOT NULL,
  country         TEXT    NOT NULL DEFAULT '',
  region          TEXT    NOT NULL DEFAULT '',
  cartier         TEXT    NOT NULL DEFAULT '',
  email           TEXT    NOT NULL DEFAULT '',
  phone           TEXT    NOT NULL DEFAULT '',
  note            TEXT    NOT NULL DEFAULT '',
  status          TEXT    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Messagerie : une conversation par paire d'utilisateurs (user_a_id < user_b_id)
CREATE TABLE IF NOT EXISTS conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (user_a_id < user_b_id),
  UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  read_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
