import React, { useCallback, useEffect, useState } from 'react'
import Offercard from '../components/offerCard/Offercard'
import { Navbar } from '../components/navbar/navbar'
import { Footer } from '../components/footer/footer'
import { SearchIcon } from '../components/icons/Icons'
import api, { apiError } from '../api/client'
import { CATEGORIES, CATEGORY_LABELS } from '../api/categories'


export default function Offers() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState({ q: '', category: '' })
    const [searched, setSearched] = useState(false)

    const fetchOffers = useCallback((params = {}) => {
        setLoading(true)
        api.get('/offers/', { params })
            .then((res) => { setOffers(res.data); setError('') })
            .catch((err) => setError(apiError(err, 'Impossible de charger les offres')))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { fetchOffers() }, [fetchOffers])

    const handleSearch = (e) => {
        e.preventDefault()
        const params = {}
        if (search.q.trim()) params.q = search.q.trim()
        if (search.category) params.category = search.category
        setSearched(Boolean(params.q || params.category))
        fetchOffers(params)
    }

    const handleReset = () => {
        setSearch({ q: '', category: '' })
        setSearched(false)
        fetchOffers()
    }

  return (
    <div className='page'>
        <Navbar/>
        <main>
            <h1 className='page-title'>Nos offres</h1>
            <p className='page-subtitle'>Choisissez une offre pour découvrir les produits et services correspondants.</p>

            <form className='search-panel search-panel--two' onSubmit={handleSearch}>
                <div className='field'>
                    <label htmlFor='offer-q'>Mot-clé</label>
                    <input id='offer-q' className='input' type='text' value={search.q}
                        placeholder='Ex. location, ciment…'
                        onChange={(e) => setSearch({ ...search, q: e.target.value })} />
                </div>
                <div className='field'>
                    <label htmlFor='offer-cat'>Catégorie</label>
                    <select id='offer-cat' className='input' value={search.category}
                        onChange={(e) => setSearch({ ...search, category: e.target.value })}>
                        <option value=''>Toutes les catégories</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                </div>
                <div className='search-panel__actions'>
                    <button type='submit' className='btn'><SearchIcon size={18} /> Rechercher</button>
                    {searched && <button type='button' className='btn btn-outline' onClick={handleReset}>Réinitialiser</button>}
                </div>
            </form>

            <div className='card-grid offers-grid'>
                {loading && <p className='empty-state'>Chargement…</p>}
                {!loading && error && <p className='empty-state'>{error}</p>}
                {!loading && !error && offers.length === 0 && <p className='empty-state'>Aucune offre ne correspond à votre recherche.</p>}
                {!loading && offers.map((offer) => (
                    <Offercard
                        key={offer.id}
                        title={offer.title}
                        desc={offer.description}
                        image={offer.image_url}
                        categorie={offer.categorie}
                        nbProduits={offer.nb_produits}
                    />
                ))}
            </div>
        </main>
        <Footer />
    </div>
  )
}
