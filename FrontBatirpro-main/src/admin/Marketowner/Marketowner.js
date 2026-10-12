import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { ContactButton } from "../components/ContactButton";
import { CATEGORY_LABELS } from "../../api/categories";
import api, { apiError } from "../../api/client";
import photo from '../../components/home_card/image/5b8d8c75254d0c3a1bee5db241af2a89.jpg';

// Fiche d'un vendeur : /Marketowner?id=3
export function Marketowner() {
    const [searchParams] = useSearchParams();
    const id = Number(searchParams.get('id'));
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/profiles/', { params: { type: 'market_owner' } })
            .then((res) => {
                const found = res.data.find((u) => u.id === id);
                if (found) setUser(found);
                else setError('Vendeur introuvable.');
            })
            .catch((err) => setError(apiError(err, 'Vendeur introuvable.')));
    }, [id]);

    return (
        <AdminLayout back={{ to: '/profiles', label: 'Profils' }} title="Vendeur">
            {error && <p className="alert-error">{error}</p>}
            {!error && !user && <p className="empty-state">Chargement…</p>}
            {user && (
                <div className="detail-stack">
                    <section className="surface profile-banner">
                        <img src={user.image_url || photo} alt="" />
                        <div>
                            <h2>{user.first_name} {user.last_name}</h2>
                            <p>Vendeur — {CATEGORY_LABELS[user.speciality] || user.speciality || 'Marketplace'}</p>
                        </div>
                        <ContactButton userId={user.id} className="btn btn-outline" />
                    </section>
                    <section className="surface info-card">
                        <h2>Informations</h2>
                        <dl className="info-grid">
                            <div><dt>Nom d'utilisateur</dt><dd>{user.username}</dd></div>
                            <div><dt>Email</dt><dd>{user.email || '—'}</dd></div>
                            <div><dt>Téléphone</dt><dd>{user.telephone || '—'}</dd></div>
                            <div><dt>Adresse</dt><dd>{user.address || '—'}</dd></div>
                            <div><dt>Date de naissance</dt><dd>{user.birth_date || '—'}</dd></div>
                            <div><dt>N° de registre</dt><dd>{user.register_number || '—'}</dd></div>
                            <div className="wide"><dt>Bio</dt><dd>{user.bio || '—'}</dd></div>
                        </dl>
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}
