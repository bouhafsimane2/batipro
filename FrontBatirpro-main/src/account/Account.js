import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../components/footer/footer';
import { UserIcon } from '../components/icons/Icons';
import api, { isLoggedIn } from '../api/client';
import { ROLE_LABELS, SPACE_LABELS } from './shared';
import ClientSpace from './ClientSpace';
import ProSpace from './ProSpace';
import SellerSpace from './SellerSpace';
import './account.css';

// Espace personnel : /compte — contenu adapté au rôle (client, professionnel, vendeur)
export default function Account() {
    const [me, setMe] = useState(null);

    useEffect(() => {
        if (!isLoggedIn()) return;
        // Le rôle est relu depuis le serveur (il peut changer, ex. après une candidature)
        api.get('/me/').then((res) => {
            setMe(res.data);
            localStorage.setItem('user_type', res.data.role);
        }).catch(() => {});
    }, []);

    if (!isLoggedIn()) return <Navigate to="/login" replace state={{ from: '/compte' }} />;
    if (me?.role === 'admin') return <Navigate to="/admin" replace />;

    const name = me ? [me.first_name, me.last_name].filter(Boolean).join(' ') || me.username : '';

    return (
        <div className="page">
            <Navbar />
            <main>
                {!me ? (
                    <p className="empty-state">Chargement de votre espace…</p>
                ) : (
                    <>
                        <header className="account-head surface">
                            <span className="account-head__avatar">
                                {me.image_url ? <img src={me.image_url} alt="" /> : <UserIcon size={32} />}
                            </span>
                            <div>
                                <p className="account-head__space">{SPACE_LABELS[me.role]}</p>
                                <h1>{name}</h1>
                                <span className="account-head__role">{ROLE_LABELS[me.role]} · @{me.username}</span>
                            </div>
                        </header>

                        {me.role === 'professional' && <ProSpace />}
                        {me.role === 'market_owner' && <SellerSpace />}
                        {me.role === 'client' && <ClientSpace />}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
