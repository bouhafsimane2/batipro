# Batipro — documentation technique

Plateforme du bâtiment : marketplace de matériaux, profils de professionnels (mains d'œuvre),
recrutement, commandes, avis et **messagerie en ligne en temps réel**.

```
batibro/
├── FrontBatirpro-main/   # Front React (Create React App)
│   └── src/
│       ├── api/          # client HTTP (axios), Socket.IO, panier
│       └── messages/     # page Messagerie + badge des non-lus
└── backend/              # API Node.js / Express + Socket.IO + SQLite
    ├── src/
    │   ├── db/           # schema.sql, connexion, seed
    │   ├── routes/       # auth, professionals, products, cart, orders, admin, messages
    │   ├── messaging.js  # logique de la messagerie (REST + temps réel)
    │   └── socket.js     # serveur Socket.IO
    ├── media/            # images (seed/ + uploads/)
    └── data/             # base SQLite (créée automatiquement)
```

## Organisation du front

```
FrontBatirpro-main/src/
├── index.css          # socle commun : couleurs, typographie, boutons, formulaires, grilles
├── App.js             # routes (site public, compte, espace admin, page 404)
├── api/               # client HTTP, Socket.IO, panier/favoris, catégories
├── components/        # composants partagés : navbar, footer, cartes produit/pro/offre,
│                      # filtre, formulaire de coordonnées, modale, notifications, icônes SVG
├── home/ marketplace/ offers/ profils/ my_profils/ favoris/ panier/ cartafterdone/
├── login/ register/ recrutement/ hireInfor/ messages/ notFound/
├── admin/             # AdminLayout (menu latéral + garde d'accès), fiches de détail
└── adimnComponents/   # pages admin : tableau de bord, profils, demandes, produits, offres, commandes
```

Le site est responsive (téléphone, tablette, ordinateur) : menu burger sous 960 px, tableaux de
l'admin affichés en cartes sur mobile, fenêtres modales en « bottom sheet » sur téléphone.

## Prérequis

- Node.js **22.5 ou plus** (la base utilise le module intégré `node:sqlite`, aucune installation de SGBD n'est nécessaire)

## Démarrage

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env      # puis ajuster si besoin
npm run seed              # données de démonstration
npm start                 # http://127.0.0.1:8000

# 2. Front (autre terminal)
cd FrontBatirpro-main
npm install
cp .env.example .env      # REACT_APP_API_URL doit pointer vers le backend
npm start                 # http://localhost:3000
```

> Sur ce poste, le port 8000 est déjà occupé par un conteneur Docker : les fichiers `.env`
> locaux utilisent donc **8010** (`backend/.env` : `PORT=8010`, `PUBLIC_URL=http://127.0.0.1:8010` ;
> `FrontBatirpro-main/.env` : `REACT_APP_API_URL=http://127.0.0.1:8010`).

`npm run reset-db` (dans `backend/`, serveur arrêté) supprime la base et la recrée avec les données de démo.
Sur une base existante, `npm run seed` ajoute seulement les éléments manquants (par exemple les offres) sans rien effacer.

### Comptes de démonstration

| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `admin` | `admin123` |
| Client | `client` | `client123` |
| Vendeur (market owner) | `vendeur` | `vendeur123` |
| Professionnel | `karim.macon` (aussi `yacine.plombier`, `amel.archi`) | `pro12345` |

Le compte `walid.elec` est une demande de recrutement **en attente** (visible dans l'espace admin › Demmande).

## Déploiement (Render, gratuit)

Le fichier [`render.yaml`](../render.yaml) décrit les deux services :

| Service | Type | Rôle |
|---|---|---|
| `batipro-api` | Web Service Node (free) | API + messagerie Socket.IO |
| `batipro-web` | Static Site (free) | front React (toutes les URL renvoient `index.html`) |

1. Sur [render.com](https://render.com), se connecter avec GitHub.
2. **New › Blueprint**, choisir le dépôt `batipro`, puis **Apply**.
3. Attendre la fin des deux déploiements, puis ouvrir l'URL de `batipro-web`.

Les adresses des deux services sont reliées automatiquement (`REACT_APP_API_URL`, `CLIENT_ORIGINS`).
Le mot de passe du compte `admin` est généré par Render : **batipro-api › Environment › `ADMIN_PASSWORD`**
(en production, `admin123` est refusé).

Limites de l'offre gratuite : l'API se met en veille après 15 min d'inactivité (premier chargement ≈ 30 s)
et n'a pas de disque persistant — la base et les images envoyées sont réinitialisées (avec les données
de démo) à chaque redémarrage. Pour conserver les données, passer `batipro-api` en offre payante avec un
disque monté sur `/var/data` et définir `DB_FILE=/var/data/batipro.sqlite` et `UPLOAD_DIR=/var/data/uploads`.

## Base de données

SQLite, schéma dans [`backend/src/db/schema.sql`](../backend/src/db/schema.sql) :

| Table | Rôle |
|---|---|
| `users` | comptes (`client`, `professional`, `market_owner`, `admin`), mots de passe hachés (scrypt) |
| `auth_tokens` | jetons de connexion (`Authorization: Token <clé>`) |
| `professionals`, `metiers`, `professional_metiers` | profils pros (`pending` → `approved` après validation admin) |
| `reviews` | avis (note 1–5 + commentaire) |
| `products`, `favorites`, `cart_items` | marketplace, favoris, panier |
| `offers` | offres de la page Offers (chacune liée à une catégorie de produits) |
| `orders`, `order_items` | commandes (le stock est décrémenté, puis restitué si annulation) |
| `hire_requests` | demandes « Hire now » envoyées à un professionnel |
| `conversations`, `messages` | messagerie (une conversation par paire d'utilisateurs, accusés de lecture) |

## API REST (`/api`)

Les erreurs ont la forme `{ "error": "message" }`. 🔒 = jeton requis, 👑 = admin.

**Authentification** — `POST /register/`, `POST /login/` → `{ token, user, usertype }`, `POST /logout/` 🔒,
`GET /me/` 🔒, `PUT /me/` 🔒 (multipart, champ `image` pour la photo)

**Professionnels** — `GET /professionals/`, `GET /professionals/search/?nom=&localisation=&metiers=`,
`GET /professionals/:id/`, `GET /professionals/:id/reviews/`, `POST /professionals/:id/review/` 🔒,
`POST /professionals/apply/` (formulaire « Work with us »), `GET /professionals/me/hires` 🔒,
`GET /metiers/`, `POST /order` 🔒 (demande d'embauche), `GET /home/products/`

**Offres** — `GET /offers/?q=&category=` (avec `nb_produits` disponibles), `GET /offers/:id/`,
`POST|PUT|DELETE /offers/…` 👑 (multipart avec `image`, champ `active` pour masquer une offre).
Un clic sur une offre ouvre `/marketplace?category=<catégorie>` avec le filtre déjà appliqué.
Les admins gèrent les offres depuis l'espace admin › **Offers** (`/adminOffers`) : ajout, modification, image, masquage, suppression.

**Marketplace** — `GET /products/?category=A,B&min_price=&max_price=&q=`, `GET /products/:id/`,
`POST|PUT|DELETE /products/…` (admin / vendeur, multipart avec `image`),
`GET|POST|DELETE /cart/`, `PATCH|DELETE /cart/:productId/` 🔒, `POST /orders/` 🔒, `GET /orders/mine` 🔒,
`GET /favorites/`, `POST|DELETE /favorites/:productId/` 🔒 (page **Favoris** : `/favoris`, icône cœur de la navbar)

**Administration** 👑 — `GET /admin/stats`, `GET /admin/orders/`, `GET|PATCH|DELETE /admin/orders/:id/`,
`GET /admin/demands/`, `POST /admin/demands/:id/validate/`, `POST /admin/demands/:id/reject/`,
`DELETE /admin/demands/:id/`, `GET /admin/profiles/?type=professional|market_owner|client`,
`PATCH /admin/users/:id` (`{ role }`), `GET /admin/hires`

## Messagerie en ligne

Accessible à tout utilisateur connecté via **Messages** dans la barre de navigation (badge des non-lus),
le bouton **Contacter** sur la fiche d'un professionnel, ou **Envoyer un message** depuis l'espace admin.

Fonctionnalités : conversations 1-à-1, envoi/réception instantanés, indicateur « écrit… »,
présence en ligne, accusés « Envoyé / Vu », compteur de non-lus, historique paginé,
recherche d'utilisateurs pour démarrer une conversation, affichage mobile.

**REST** 🔒 — `GET /conversations`, `POST /conversations` (`{ user_id }` ou `{ professional_id }`),
`GET /conversations/:id`, `GET /conversations/:id/messages?before=&limit=`,
`POST /conversations/:id/messages` (`{ content }`), `POST /conversations/:id/read`,
`GET /messages/unread-count`, `GET /users/search?q=`

**Socket.IO** — connexion avec `io(API_URL, { auth: { token } })`

| Sens | Événement | Données |
|---|---|---|
| client → serveur | `message:send` (avec accusé) | `{ conversation_id, content }` |
| client → serveur | `conversation:read` (avec accusé) | `{ conversation_id }` |
| client → serveur | `typing` | `{ conversation_id, typing }` |
| serveur → client | `message:new` | `{ message, conversation }` |
| serveur → client | `conversation:read` | `{ conversation_id, reader_id, read_at }` |
| serveur → client | `typing` | `{ conversation_id, user_id, typing }` |
| serveur → client | `presence` | `{ user_id, online }` |
