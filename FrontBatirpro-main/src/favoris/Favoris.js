import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../marketplace/marketplace.css'
import ProductCard from '../components/productCard/ProductCard'
import { Navbar } from '../components/navbar/navbar'
import { Footer } from '../components/footer/footer'
import { HeartIcon } from '../components/icons/Icons'
import api, { apiError, isLoggedIn } from '../api/client'


export default function Favoris() {
    const navigate = useNavigate()
    const [favorites, setFavorites] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/login')
            return
        }
        api.get('/favorites/')
            .then((res) => setFavorites(res.data))
            .catch((err) => setError(apiError(err, 'Impossible de charger vos favoris')))
            .finally(() => setLoading(false))
    }, [navigate])

    // Un produit retiré des favoris (clic sur le coeur) disparaît de la liste
    const handleFavoriteChange = (productId, isFavorite) => {
        if (!isFavorite) setFavorites((prev) => prev.filter((p) => p.id_produit !== productId))
    }

  return (
    <div className='page'>
        <Navbar/>
        <main>
            <h1 className='page-title'>Mes favoris {!loading && !error && <span className='title-count'>({favorites.length})</span>}</h1>
            <p className='page-subtitle'>Retrouvez ici les produits que vous avez enregistrés.</p>

            <div className='card-grid market__grid'>
                {loading && <p className='empty-state'>Chargement…</p>}
                {!loading && error && <p className='empty-state'>{error}</p>}
                {!loading && !error && favorites.length === 0 && (
                    <div className='empty-state empty-state--box'>
                        <HeartIcon size={40} />
                        <p><strong>Vous n'avez pas encore de favoris.</strong></p>
                        <p>Cliquez sur le cœur d'un produit pour le retrouver ici.</p>
                        <Link to='/marketplace' className='btn'>Voir le marketplace</Link>
                    </div>
                )}
                {!loading && favorites.map((p) => (
                    <ProductCard
                        key={p.id_produit}
                        product_id={p.id_produit}
                        image={p.image_url}
                        description={p.description}
                        productName={p.nom}
                        price={p.prix}
                        category={p.categorie}
                        stock={p.quantite}
                        favorite={true}
                        onFavoriteChange={handleFavoriteChange}
                    />
                ))}
            </div>
        </main>
        <Footer/>
    </div>
  )
}
