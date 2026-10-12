import React, { useEffect, useState } from 'react'
import { CATEGORIES, CATEGORY_LABELS } from '../../api/categories'
import { SearchIcon } from '../icons/Icons'
import './filter.css'

const PRICE_RANGES = [
    { label: 'Tous les prix', min: null, max: null },
    { label: 'Moins de 200 DA', min: 0, max: 200 },
    { label: '200 – 500 DA', min: 200, max: 500 },
    { label: '500 – 1 000 DA', min: 500, max: 1000 },
    { label: 'Plus de 1 000 DA', min: 1000, max: null },
]

// onChange({ categories: [...], min_price, max_price, q }) est appelé à chaque modification du filtre
// initialCategories : catégories cochées au départ (ex. depuis la page Offers)
export default function Filter({ onChange, initialCategories = [] }) {
    const [categories, setCategories] = useState(() => initialCategories.filter((c) => CATEGORIES.includes(c)))
    const [priceIndex, setPriceIndex] = useState(0)
    const [q, setQ] = useState('')
    const [debouncedQ, setDebouncedQ] = useState('')

    // La recherche texte attend une courte pause avant d'interroger le serveur
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 350)
        return () => clearTimeout(t)
    }, [q])

    useEffect(() => {
        if (!onChange) return
        const range = PRICE_RANGES[priceIndex]
        onChange({ categories, min_price: range.min, max_price: range.max, q: debouncedQ })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, priceIndex, debouncedQ])

    const toggleCategory = (c) =>
        setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

    const hasFilters = categories.length > 0 || priceIndex !== 0 || q !== ''

    const reset = () => {
        setCategories([])
        setPriceIndex(0)
        setQ('')
    }

  return (
    <aside className="filters" aria-label="Filtres">
        <div className="filters__head">
            <h2>Filtrer</h2>
            {hasFilters && <button type="button" className="filters__reset" onClick={reset}>Effacer</button>}
        </div>

        <div className="filters__search">
            <SearchIcon size={18} />
            <input
                type="search"
                className="input"
                placeholder="Rechercher un produit"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Rechercher un produit"
            />
        </div>

        <div className="filters__group">
            <p className="field-label">Catégories</p>
            <div className="chips">
                <button
                    type="button"
                    className={`chip ${categories.length === 0 ? 'is-active' : ''}`}
                    onClick={() => setCategories([])}
                >
                    Toutes
                </button>
                {CATEGORIES.map((c) => (
                    <button
                        key={c}
                        type="button"
                        className={`chip ${categories.includes(c) ? 'is-active' : ''}`}
                        aria-pressed={categories.includes(c)}
                        onClick={() => toggleCategory(c)}
                    >
                        {CATEGORY_LABELS[c]}
                    </button>
                ))}
            </div>
        </div>

        <div className="filters__group">
            <label className="field-label" htmlFor="filter-price">Prix</label>
            <select id="filter-price" className="input" value={priceIndex} onChange={(e) => setPriceIndex(Number(e.target.value))}>
                {PRICE_RANGES.map((r, i) => <option key={r.label} value={i}>{r.label}</option>)}
            </select>
        </div>
    </aside>
  )
}
