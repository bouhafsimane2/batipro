import axios from 'axios';

// URL du backend : à surcharger dans .env avec REACT_APP_API_URL
// (un simple nom d'hôte, comme celui fourni par Render, est complété en https://)
const rawApiUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
export const API_URL = (/^https?:\/\//i.test(rawApiUrl) ? rawApiUrl : `https://${rawApiUrl}`).replace(/\/$/, '');

const api = axios.create({ baseURL: `${API_URL}/api` });

// Ajoute automatiquement le jeton de connexion à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Jeton refusé (expiré ou supprimé) : on déconnecte et on renvoie vers la page de connexion
api.interceptors.response.use(undefined, (error) => {
  const sentToken = Boolean(error.config?.headers?.Authorization);
  if (error.response?.status === 401 && sentToken) {
    clearSession();
    if (window.location.pathname !== '/login') {
      alert('Votre session a expiré. Veuillez vous reconnecter.');
      window.location.assign('/login');
    }
  }
  return Promise.reject(error);
});

// Message d'erreur lisible renvoyé par le backend ({ error: "..." })
export const apiError = (err, fallback = 'Une erreur est survenue') =>
  err?.response?.data?.error || fallback;

// Session de l'utilisateur connecté (stockée dans localStorage)
export function saveSession({ token, user, usertype }) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user_type', usertype);
  localStorage.setItem('user_id', String(user.id));
  localStorage.setItem('username', user.username);
  localStorage.setItem('profil_pic', user.image_url || '');
}

export function clearSession() {
  ['authToken', 'user_type', 'usertype', 'user_id', 'username', 'profil_pic'].forEach((k) => localStorage.removeItem(k));
}

export const currentUserId = () => Number(localStorage.getItem('user_id')) || null;
export const isLoggedIn = () => Boolean(localStorage.getItem('authToken'));

export default api;
