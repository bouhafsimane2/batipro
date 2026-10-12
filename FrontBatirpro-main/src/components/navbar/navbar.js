import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import api, { clearSession, isLoggedIn } from '../../api/client';
import { disconnectSocket } from '../../api/socket';
import { useCartCount } from '../../api/cart';
import useUnreadCount from '../../messages/useUnreadCount';
import { CartIcon, CloseIcon, HeartIcon, LogoutIcon, MenuIcon, MessageIcon, UserIcon } from '../icons/Icons';
import './navbar.css';

const LINKS = [
    { to: '/', label: 'Accueil', end: true },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/offers', label: 'Offres' },
    { to: '/profils', label: 'Professionnels' },
    { to: '/recrutement', label: 'Rejoignez-nous' },
];

export function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const loggedIn = isLoggedIn();
    const isAdmin = localStorage.getItem('user_type') === 'admin';
    const picture = localStorage.getItem('profil_pic');
    const username = localStorage.getItem('username') || '';
    const unread = useUnreadCount();
    const cartCount = useCartCount();

    // Le menu mobile se referme à chaque changement de page
    useEffect(() => setOpen(false), [location.pathname, location.search]);

    // Menu mobile ouvert : pas de défilement de la page, fermeture avec Échap
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const handleLogout = async () => {
        try { await api.post('/logout/'); } catch { /* jeton déjà invalide */ }
        clearSession();
        disconnectSocket();
        navigate('/');
        window.location.reload();
    };

    return (
        <header className="site-nav">
            <div className="site-nav__inner">
                <Link to="/" className="site-nav__brand" aria-label="Batipro, accueil">
                    <span className="site-nav__logo">B</span>
                    <span className="site-nav__name">Bati<span>pro</span></span>
                </Link>

                <nav className={`site-nav__menu ${open ? 'is-open' : ''}`} aria-label="Navigation principale">
                    <ul className="site-nav__links">
                        {LINKS.map((l) => (
                            <li key={l.to}>
                                <NavLink to={l.to} end={l.end}>{l.label}</NavLink>
                            </li>
                        ))}
                        {isAdmin && (
                            <li><NavLink to="/admin">Espace admin</NavLink></li>
                        )}
                    </ul>

                    {/* Actions du compte, visibles dans le menu mobile */}
                    <div className="site-nav__mobile-account">
                        {loggedIn ? (
                            <button type="button" className="btn btn-outline btn-block" onClick={handleLogout}>
                                <LogoutIcon size={18} /> Se déconnecter
                            </button>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-block">Se connecter</Link>
                                <Link to="/register" className="btn btn-outline btn-block">Créer un compte</Link>
                            </>
                        )}
                    </div>
                </nav>

                <div className="site-nav__actions">
                    {loggedIn && (
                        <NavLink to="/messages" className="site-nav__icon" aria-label={`Messages${unread ? `, ${unread} non lus` : ''}`}>
                            <MessageIcon />
                            {unread > 0 && <span className="badge">{unread > 99 ? '99+' : unread}</span>}
                        </NavLink>
                    )}
                    <NavLink to="/favoris" className="site-nav__icon" aria-label="Favoris">
                        <HeartIcon />
                    </NavLink>
                    <NavLink to="/panier" className="site-nav__icon" aria-label={`Panier${cartCount ? `, ${cartCount} articles` : ''}`}>
                        <CartIcon />
                        {cartCount > 0 && <span className="badge">{cartCount > 99 ? '99+' : cartCount}</span>}
                    </NavLink>

                    {loggedIn ? (
                        <div className="site-nav__account">
                            <span className="site-nav__avatar" title={username}>
                                {picture ? <img src={picture} alt="" /> : <UserIcon size={18} />}
                            </span>
                            <button type="button" className="site-nav__logout" onClick={handleLogout} title="Se déconnecter">
                                <LogoutIcon size={18} />
                                <span>Déconnexion</span>
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-sm site-nav__login">Connexion</Link>
                    )}

                    <button
                        type="button"
                        className="site-nav__burger"
                        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                        aria-expanded={open}
                        onClick={() => setOpen((o) => !o)}
                    >
                        {open ? <CloseIcon /> : <MenuIcon />}
                    </button>
                </div>
            </div>
            {open && <div className="site-nav__backdrop" onClick={() => setOpen(false)} />}
        </header>
    );
}
