import React, { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import '../panier/panier.css'
import { Navbar } from '../components/navbar/navbar'
import { Footer } from '../components/footer/footer'
import ContactForm from '../components/contactForm/ContactForm'
import { formatPrice } from '../components/productCard/ProductCard'
import { toast } from '../components/toast/Toaster'
import { notifyCartChanged } from '../api/cart'
import api, { apiError, isLoggedIn } from '../api/client'


// Validation de la commande : coordonnées de livraison + récapitulatif du panier
export default function Cartafterdone() {
  const location = useLocation()
  const navigate = useNavigate()
  const delivery = location.state?.done?.delevery === 'yes'
  const [cart, setCart] = useState(null)

  // Les totaux sont relus depuis le serveur (source de vérité)
  useEffect(() => {
    if (!isLoggedIn()) return
    api.get('/cart/').then((res) => setCart(res.data)).catch(() => setCart({ items: [], count: 0, total: 0 }))
  }, [])

  if (!isLoggedIn()) return <Navigate to='/login' replace />

  const handleOrder = async (values) => {
    try {
      const res = await api.post('/orders/', { ...values, delivery })
      notifyCartChanged(0)
      toast(`Commande n°${res.data.id} envoyée avec succès !`, 'success')
      navigate('/')
    } catch (err) {
      toast(apiError(err, "La commande n'a pas pu être envoyée"), 'error')
    }
  }

  return (
    <div className='page'>
        <Navbar/>
        <main>
            <Link to='/panier' className='back-link'>← Retour au panier</Link>
            <h1 className='page-title'>Validation de la commande</h1>
            <p className='page-subtitle'>Indiquez vos coordonnées pour finaliser votre commande.</p>

            {cart && cart.items.length === 0 ? (
                <div className='empty-state empty-state--box'>
                    <p><strong>Votre panier est vide.</strong></p>
                    <Link to='/marketplace' className='btn'>Voir le marketplace</Link>
                </div>
            ) : (
                <div className='cart-layout'>
                    <section className='surface form-card'>
                        <ContactForm
                            submitLabel='Confirmer la commande'
                            sendingLabel='Envoi de la commande…'
                            notePlaceholder='Instructions de livraison, horaires…'
                            onSubmit={handleOrder}
                        />
                    </section>

                    <aside className='cart-summary surface'>
                        <h2>Récapitulatif</h2>
                        {cart?.items.map((i) => (
                            <div key={i.product_id} className='cart-summary__row'>
                                <span>{i.quantity} × {i.nom}</span>
                                <span>{formatPrice(i.subtotal)}</span>
                            </div>
                        ))}
                        <div className='cart-summary__row'>
                            <span>Livraison</span>
                            <span>{delivery ? 'Oui' : 'Retrait'}</span>
                        </div>
                        <div className='cart-summary__row cart-summary__total'>
                            <span>Total</span>
                            <span>{cart ? formatPrice(cart.total) : '…'}</span>
                        </div>
                    </aside>
                </div>
            )}
        </main>
        <Footer/>
    </div>
  )
}
