import { useEffect, useState } from 'react';
import api, { apiError, isLoggedIn } from './client';
import { toast } from '../components/toast/Toaster';

const CART_EVENT = 'batipro:cart-changed';

// Prévient la navbar que le panier a changé (nombre d'articles transmis si connu)
export function notifyCartChanged(count) {
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { count } }));
}

// Nombre d'articles du panier, mis à jour à chaque modification
export function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) return undefined;
    const refresh = (e) => {
      if (typeof e?.detail?.count === 'number') return setCount(e.detail.count);
      api.get('/cart/').then((res) => setCount(res.data.count)).catch(() => {});
    };
    refresh();
    window.addEventListener(CART_EVENT, refresh);
    return () => window.removeEventListener(CART_EVENT, refresh);
  }, []);

  return count;
}

// Ajoute un produit au panier ; redirige vers /login si l'utilisateur n'est pas connecté
export async function addToCart(productId, navigate, quantity = 1) {
  if (!isLoggedIn()) {
    toast('Connectez-vous pour ajouter des produits au panier.', 'info');
    navigate('/login');
    return false;
  }
  try {
    const res = await api.post('/cart/', { product_id: productId, quantity });
    notifyCartChanged(res.data.count);
    toast('Produit ajouté au panier', 'success');
    return true;
  } catch (err) {
    toast(apiError(err, "Impossible d'ajouter ce produit au panier"), 'error');
    return false;
  }
}

// Identifiants des produits favoris de l'utilisateur connecté (ensemble vide sinon)
export async function fetchFavoriteIds() {
  if (!isLoggedIn()) return new Set();
  try {
    const res = await api.get('/favorites/');
    return new Set(res.data.map((p) => p.id_produit));
  } catch {
    return new Set();
  }
}

export async function toggleFavorite(productId, isFavorite, navigate) {
  if (!isLoggedIn()) {
    toast('Connectez-vous pour enregistrer vos favoris.', 'info');
    navigate('/login');
    return isFavorite;
  }
  try {
    if (isFavorite) await api.delete(`/favorites/${productId}/`);
    else await api.post(`/favorites/${productId}/`);
    return !isFavorite;
  } catch {
    toast('Impossible de modifier vos favoris', 'error');
    return isFavorite;
  }
}
