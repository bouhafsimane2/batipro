import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import api, { clearSession } from '../../api/client'
import { disconnectSocket } from '../../api/socket'
import useUnreadCount from '../../messages/useUnreadCount'
import { CloseIcon, LogoutIcon, MenuIcon, UserIcon } from '../../components/icons/Icons'
import './adminLayout.css'

const LINKS = [
    { to: '/admin', label: 'Tableau de bord', end: true },
    { to: '/profiles', label: 'Profils' },
    { to: '/demands', label: 'Demandes', badge: 'demands' },
    { to: '/products', label: 'Produits' },
    { to: '/addProduct', label: 'Ajouter un produit' },
    { to: '/adminOffers', label: 'Offres' },
    { to: '/commands', label: 'Commandes', badge: 'orders' },
    { to: '/messages', label: 'Messages', badge: 'messages' },
    { to: '/ProffesionalProfils', label: 'Mon profil' },
]

// Mise en page de l'espace admin : barre latérale (desktop) / menu tiroir (mobile)
export default function AdminLayout({ title, actions, children, back }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [open, setOpen] = useState(false)
    const [stats, setStats] = useState(null)
    const unread = useUnreadCount()
    const isAdmin = localStorage.getItem('user_type') === 'admin'
    const username = localStorage.getItem('username') || 'Admin'
    const picture = localStorage.getItem('profil_pic')

    useEffect(() => setOpen(false), [location.pathname])

    // Fermeture du menu mobile avec Échap
    useEffect(() => {
        if (!open) return undefined
        const onKey = (e) => e.key === 'Escape' && setOpen(false)
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open])

    // Compteurs affichés dans le menu (demandes et commandes en attente)
    useEffect(() => {
        if (!isAdmin) return
        api.get('/admin/stats').then((res) => setStats(res.data)).catch(() => {})
    }, [isAdmin, location.pathname])

    if (!isAdmin) return <Navigate to="/login" replace state={{ from: location.pathname }} />

    const badges = {
        demands: stats?.pending_demands,
        orders: stats?.pending_orders,
        messages: unread,
    }

    const handleLogout = async () => {
        try { await api.post('/logout/') } catch { /* jeton déjà invalide */ }
        clearSession()
        disconnectSocket()
        navigate('/login')
    }

    return (
        <div className="admin">
            <header className="admin__topbar">
                <button type="button" className="admin__burger" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
                    <MenuIcon />
                </button>
                <Link to="/admin" className="admin__brand">Bati<span>pro</span> <small>admin</small></Link>
            </header>

            <aside className={`admin__sidebar ${open ? 'is-open' : ''}`} aria-label="Navigation admin">
                <div className="admin__sidebar-head">
                    <Link to="/admin" className="admin__brand">Bati<span>pro</span> <small>admin</small></Link>
                    <button type="button" className="admin__close" onClick={() => setOpen(false)} aria-label="Fermer le menu">
                        <CloseIcon />
                    </button>
                </div>
                <div className="admin__user">
                    <span className="admin__avatar">{picture ? <img src={picture} alt="" /> : <UserIcon size={20} />}</span>
                    <div>
                        <strong>{username}</strong>
                        <small>Administrateur</small>
                    </div>
                </div>
                <nav>
                    <ul>
                        {LINKS.map((l) => (
                            <li key={l.to}>
                                <NavLink to={l.to} end={l.end}>
                                    <span>{l.label}</span>
                                    {l.badge && badges[l.badge] > 0 && <span className="badge">{badges[l.badge]}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="admin__sidebar-foot">
                    <Link to="/" className="admin__site-link">← Retour au site</Link>
                    <button type="button" className="admin__logout" onClick={handleLogout}>
                        <LogoutIcon size={18} /> Déconnexion
                    </button>
                </div>
            </aside>
            {open && <div className="admin__backdrop" onClick={() => setOpen(false)} />}

            <main className="admin__main">
                {back && <Link to={back.to} className="back-link">← {back.label}</Link>}
                {(title || actions) && (
                    <div className="admin__head">
                        {title && <h1>{title}</h1>}
                        {actions && <div className="admin__actions">{actions}</div>}
                    </div>
                )}
                {children}
            </main>
        </div>
    )
}
