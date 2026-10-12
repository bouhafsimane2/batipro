import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import './marketplace.css'
import Filter from '../components/filter/Filter'
import ProductCard from '../components/productCard/ProductCard'
import { Navbar } from '../components/navbar/navbar'
import { Footer } from '../components/footer/footer'
import api, { apiError } from '../api/client'
import { fetchFavoriteIds } from '../api/cart'


export default function Marketplace() {
    // /marketplace?category=Materials (lien depuis une offre) : catégorie pré-sélectionnée
    const [searchParams] = useSearchParams()
    const [initialCategories] = useState(() => (searchParams.get('category') || '').split(',').filter(Boolean))
    const [products, setProducts] = useState([])
    const [filters, setFilters] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [favoriteIds, setFavoriteIds] = useState(new Set())

    useEffect(() => { fetchFavoriteIds().then(setFavoriteIds) }, [])

    // Le filtre envoie ses valeurs initiales au montage : pas de requête avant
    useEffect(() => {
        if (!filters) return
        const params = {}
        if (filters.categories.length) params.category = filters.categories.join(',')
        if (filters.min_price !== null) params.min_price = filters.min_price
        if (filters.max_price !== null) params.max_price = filters.max_price
        if (filters.q) params.q = filters.q

        setLoading(true)
        api.get('/products/', { params })
            .then((res) => { setProducts(res.data); setError('') })
            .catch((err) => setError(apiError(err, 'Impossible de charger les produits')))
            .finally(() => setLoading(false))
    }, [filters])

  return (
    <div className='page'>
        <Navbar/>
        <main>
            <h1 className='page-title'>Marketplace</h1>
            <p className='page-subtitle'>Matériaux, équipements et services pour votre chantier.</p>

            <div className='market'>
                <Filter onChange={setFilters} initialCategories={initialCategories}/>
                <section aria-live='polite'>
                    <p className='market__count'>
                        {!loading && !error && `${products.length} produit${products.length > 1 ? 's' : ''}`}
                    </p>
                    <div className='card-grid market__grid'>
                        {loading && <p className='empty-state'>Chargement…</p>}
                        {!loading && error && <p className='empty-state'>{error}</p>}
                        {!loading && !error && products.length === 0 && <p className='empty-state'>Aucun produit ne correspond à ce filtre.</p>}
                        {!loading && products.map((p) => (
                            <ProductCard
                                key={p.id_produit}
                                product_id={p.id_produit}
                                image={p.image_url}
                                description={p.description}
                                productName={p.nom}
                                price={p.prix}
                                category={p.categorie}
                                stock={p.quantite}
                                favorite={favoriteIds.has(p.id_produit)}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </main>
        <Footer/>
    </div>
  )
}
