import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import "./panier.css"
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../components/footer/footer';
import { CartIcon, MinusIcon, PlusIcon, TrashIcon } from '../components/icons/Icons';
import { formatPrice } from '../components/productCard/ProductCard';
import placeholder from '../components/productCard/images/placeholder.png';
import { toast } from '../components/toast/Toaster';
import { notifyCartChanged } from '../api/cart';
import api, { apiError, isLoggedIn } from '../api/client';


export default function Panier() {
    const navigate = useNavigate();
    const [cart, setCart] = useState({ items: [], total: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(null); // produit en cours de mise à jour
    const [delivery, setDelivery] = useState('no');

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/login');
            return;
        }
        api.get('/cart/')
            .then((res) => setCart(res.data))
            .catch((err) => toast(apiError(err, 'Impossible de charger le panier'), 'error'))
            .finally(() => setLoading(false));
    }, [navigate]);

    // Chaque modification renvoie le panier à jour depuis le serveur
    const applyCart = (data) => {
        setCart(data);
        notifyCartChanged(data.count);
    };

    const updateQuantity = async (item, quantity) => {
        if (quantity < 1) return;
        setBusy(item.product_id);
        try {
            applyCart((await api.patch(`/cart/${item.product_id}/`, { quantity })).data);
        } catch (err) {
            toast(apiError(err), 'error');
        } finally {
            setBusy(null);
        }
    };

    const handleDelete = async (item) => {
        setBusy(item.product_id);
        try {
            applyCart((await api.delete(`/cart/${item.product_id}/`)).data);
            toast(`« ${item.nom} » retiré du panier`);
        } catch (err) {
            toast(apiError(err), 'error');
        } finally {
            setBusy(null);
        }
    };

    const goToCheckout = () => {
        navigate('/Cartdone', { state: { done: { delevery: delivery } } });
    };

    return (
        <div className='page'>
            <Navbar/>
            <main>
                <h1 className='page-title'>Mon panier {cart.count > 0 && <span className='title-count'>({cart.count})</span>}</h1>

                {loading ? (
                    <p className='empty-state'>Chargement…</p>
                ) : cart.items.length === 0 ? (
                    <div className='empty-state empty-state--box'>
                        <CartIcon size={40} />
                        <p><strong>Votre panier est vide.</strong></p>
                        <p>Parcourez le marketplace pour ajouter des produits.</p>
                        <Link to='/marketplace' className='btn'>Voir le marketplace</Link>
                    </div>
                ) : (
                    <div className='cart-layout'>
                        <ul className='cart-items'>
                            {cart.items.map((item) => (
                                <li key={item.product_id} className={`cart-item ${busy === item.product_id ? 'is-busy' : ''}`}>
                                    <div className='cart-item__img'>
                                        <img src={item.image_url || placeholder} alt='' />
                                    </div>
                                    <div className='cart-item__info'>
                                        <h3>{item.nom}</h3>
                                        <p>{formatPrice(item.prix)} / unité</p>
                                        {item.quantity >= item.stock && <p className='cart-item__stock'>Stock maximum atteint</p>}
                                    </div>
                                    <div className='qty' aria-label={`Quantité de ${item.nom}`}>
                                        <button type='button' onClick={() => updateQuantity(item, item.quantity - 1)}
                                            disabled={item.quantity <= 1 || busy === item.product_id} aria-label='Diminuer'>
                                            <MinusIcon size={16} />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button type='button' onClick={() => updateQuantity(item, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock || busy === item.product_id} aria-label='Augmenter'>
                                            <PlusIcon size={16} />
                                        </button>
                                    </div>
                                    <strong className='cart-item__subtotal'>{formatPrice(item.subtotal)}</strong>
                                    <button type='button' className='cart-item__delete' onClick={() => handleDelete(item)}
                                        disabled={busy === item.product_id} aria-label={`Retirer ${item.nom}`}>
                                        <TrashIcon size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <aside className='cart-summary surface'>
                            <h2>Récapitulatif</h2>
                            <div className='cart-summary__row'>
                                <span>Articles</span>
                                <span>{cart.count}</span>
                            </div>
                            <fieldset className='cart-summary__delivery'>
                                <legend>Souhaitez-vous la livraison ?</legend>
                                <label className={delivery === 'yes' ? 'is-checked' : ''}>
                                    <input type='radio' name='delivery' value='yes' checked={delivery === 'yes'}
                                        onChange={() => setDelivery('yes')} />
                                    Oui
                                </label>
                                <label className={delivery === 'no' ? 'is-checked' : ''}>
                                    <input type='radio' name='delivery' value='no' checked={delivery === 'no'}
                                        onChange={() => setDelivery('no')} />
                                    Non, je retire
                                </label>
                            </fieldset>
                            <div className='cart-summary__row cart-summary__total'>
                                <span>Total</span>
                                <span>{formatPrice(cart.total)}</span>
                            </div>
                            <button type='button' className='btn btn-block' onClick={goToCheckout}>Passer la commande</button>
                            <Link to='/marketplace' className='cart-summary__continue'>Continuer mes achats</Link>
                        </aside>
                    </div>
                )}
            </main>
            <Footer/>
        </div>
    )
}
