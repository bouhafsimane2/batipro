import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../../admin/components/AdminLayout'
import Table from '../table/Table'
import { formatPrice } from '../../components/productCard/ProductCard'
import api, { apiError } from '../../api/client'
import { OrderStatus, formatDate } from '../commands/Command'
import './dashboard.css'

const CARDS = [
    { key: 'pending_demands', label: 'Demandes à traiter', to: '/demands', highlight: true },
    { key: 'pending_orders', label: 'Commandes en attente', to: '/commands', highlight: true },
    { key: 'professionals', label: 'Professionnels actifs', to: '/profiles' },
    { key: 'products', label: 'Produits', to: '/products' },
    { key: 'users', label: 'Utilisateurs', to: '/profiles' },
]

// Tableau de bord de l'administrateur
export default function Dashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        Promise.all([api.get('/admin/stats'), api.get('/admin/orders/', { params: { status: 'pending' } })])
            .then(([s, o]) => {
                setStats(s.data)
                setOrders(o.data.slice(0, 5))
            })
            .catch((err) => setError(apiError(err, 'Impossible de charger le tableau de bord')))
            .finally(() => setLoading(false))
    }, [])

    return (
        <AdminLayout title="Tableau de bord">
            {error && <p className="alert-error">{error}</p>}
            <div className="stat-grid">
                {CARDS.map((c) => (
                    <Link key={c.key} to={c.to} className={`stat-card surface ${c.highlight && stats?.[c.key] > 0 ? 'is-highlight' : ''}`}>
                        <span className="stat-card__value">{stats ? stats[c.key] : '–'}</span>
                        <span className="stat-card__label">{c.label}</span>
                    </Link>
                ))}
            </div>

            <div className="admin__head dashboard__section-head">
                <h2>Dernières commandes en attente</h2>
                <Link to="/commands" className="section-link">Toutes les commandes →</Link>
            </div>
            <Table
                loading={loading}
                rows={orders}
                empty="Aucune commande en attente 🎉"
                columns={[
                    { key: 'id', label: 'N°', render: (o) => `#${o.id}` },
                    { key: 'full_name', label: 'Client' },
                    { key: 'created_at', label: 'Date', render: (o) => formatDate(o.created_at) },
                    { key: 'total', label: 'Total', render: (o) => formatPrice(o.total) },
                    { key: 'status', label: 'Statut', render: (o) => <OrderStatus status={o.status} /> },
                ]}
                actions={(o) => (
                    <button type="button" className="btn btn-sm" onClick={() => navigate(`/displayOrder?id=${o.id}`)}>
                        Voir
                    </button>
                )}
            />
        </AdminLayout>
    )
}
