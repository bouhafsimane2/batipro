import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Table from '../adimnComponents/table/Table';
import { formatDate } from '../adimnComponents/commands/Command';
import { ContactButton } from '../admin/components/ContactButton';
import { Stars } from '../components/home_card/card';
import Review from '../components/review/review';
import { toast } from '../components/toast/Toaster';
import api, { apiError } from '../api/client';
import ProfileForm from './ProfileForm';
import { MyOrders } from './ClientSpace';
import { HireStatus, Tabs, useTab } from './shared';

// Demandes d'embauche reçues, avec réponse (accepter / refuser) et contact du client
function ReceivedHires({ hires, onChange, loading }) {
    const respond = async (hire, status) => {
        try {
            const res = await api.patch(`/professionals/me/hires/${hire.id}`, { status });
            onChange(res.data);
            toast(status === 'accepted' ? 'Demande acceptée' : 'Demande refusée', 'success');
        } catch (err) {
            toast(apiError(err), 'error');
        }
    };

    return (
        <Table
            loading={loading}
            rows={hires}
            empty="Vous n'avez pas encore reçu de demande."
            columns={[
                { key: 'client', label: 'Client', render: (h) => <strong>{h.full_name}</strong> },
                { key: 'contact', label: 'Contact', render: (h) => (
                    <span className="cell-list">
                        <a href={`tel:${h.phone}`}>{h.phone}</a>
                        {h.email && <><br /><a href={`mailto:${h.email}`}>{h.email}</a></>}
                    </span>
                ) },
                { key: 'lieu', label: 'Lieu', render: (h) => [h.cartier, h.region].filter(Boolean).join(', ') || '—' },
                { key: 'note', label: 'Besoin', render: (h) => h.note || '—' },
                { key: 'created_at', label: 'Reçue le', render: (h) => formatDate(h.created_at) },
                { key: 'status', label: 'Statut', render: (h) => <HireStatus status={h.status} /> },
            ]}
            actions={(h) => <>
                {h.status === 'pending' && <>
                    <button type="button" className="btn btn-sm" onClick={() => respond(h, 'accepted')}>Accepter</button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => respond(h, 'declined')}>Refuser</button>
                </>}
                <ContactButton userId={h.client_id} className="btn btn-sm btn-outline">Écrire</ContactButton>
            </>}
        />
    );
}

// Modification de la fiche publique (PATCH /api/professionals/me)
function ProListingForm({ pro, onSaved }) {
    const [form, setForm] = useState({
        metiers: pro.metiers.map((m) => m.nom_metier).join(', '),
        localisation: pro.localisation,
        postal_code: pro.postal_code,
        about_me: pro.about_me,
        description_experience: pro.description_experience,
    });
    const [saving, setSaving] = useState(false);
    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.patch('/professionals/me', form);
            onSaved(res.data);
            toast('Fiche mise à jour', 'success');
        } catch (err) {
            toast(apiError(err, "La fiche n'a pas pu être enregistrée"), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="surface form-card form-grid account-form" onSubmit={handleSubmit}>
            <div className="field full">
                <label htmlFor="pro-metiers">Métier(s) — séparés par des virgules</label>
                <input id="pro-metiers" required value={form.metiers} onChange={set('metiers')} placeholder="Ex. Maçon, Carreleur" />
            </div>
            <div className="field">
                <label htmlFor="pro-loc">Ville / wilaya</label>
                <input id="pro-loc" value={form.localisation} onChange={set('localisation')} />
            </div>
            <div className="field">
                <label htmlFor="pro-postal">Code postal</label>
                <input id="pro-postal" value={form.postal_code} onChange={set('postal_code')} />
            </div>
            <div className="field full">
                <label htmlFor="pro-about">À propos</label>
                <textarea id="pro-about" value={form.about_me} onChange={set('about_me')} placeholder="Présentez-vous en quelques lignes…" />
            </div>
            <div className="field full">
                <label htmlFor="pro-exp">Expérience</label>
                <textarea id="pro-exp" value={form.description_experience} onChange={set('description_experience')} placeholder="Années d'expérience, chantiers réalisés…" />
            </div>
            <div className="full modal__footer">
                {pro.status === 'approved' && <Link to={`/my_profils?id=${pro.id}`} className="btn btn-outline">Voir ma fiche publique</Link>}
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
        </form>
    );
}

export default function ProSpace() {
    const [pro, setPro] = useState(null);
    const [hires, setHires] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const me = (await api.get('/professionals/me')).data;
            setPro(me);
            const [h, r] = await Promise.all([
                api.get('/professionals/me/hires'),
                api.get(`/professionals/${me.id}/reviews/`),
            ]);
            setHires(h.data);
            setReviews(r.data);
        } catch (err) {
            toast(apiError(err, 'Impossible de charger votre espace pro'), 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const pending = hires.filter((h) => h.status === 'pending').length;
    const tabs = [
        { key: 'demandes', label: 'Demandes reçues', badge: pending },
        { key: 'fiche', label: 'Ma fiche' },
        { key: 'avis', label: `Mes avis (${reviews.length})` },
        { key: 'commandes', label: 'Mes commandes' },
        { key: 'infos', label: 'Mes informations' },
    ];
    const [tab, setTab] = useTab(tabs);

    if (loading) return <p className="empty-state">Chargement…</p>;
    if (!pro) return <p className="empty-state">Profil professionnel introuvable.</p>;

    return (
        <>
            {pro.status === 'pending' && (
                <div className="account-notice">
                    <strong>Candidature en cours d'examen.</strong> Votre fiche sera visible par les clients dès
                    qu'un administrateur l'aura validée. Vous pouvez déjà la compléter dans « Ma fiche ».
                </div>
            )}
            {pro.status === 'rejected' && (
                <div className="account-notice account-notice--danger">
                    <strong>Candidature refusée.</strong> Contactez l'équipe Batipro via la messagerie pour en savoir plus.
                </div>
            )}

            <div className="stat-row">
                <div className="surface stat-mini"><span>{hires.length}</span>Demandes reçues</div>
                <div className="surface stat-mini"><span>{pending}</span>En attente de réponse</div>
                <div className="surface stat-mini">
                    <span>{pro.avis_moyenne.toFixed(1)}</span>
                    <Stars rating={pro.avis_moyenne} size={14} /> {pro.nb_avis} avis
                </div>
            </div>

            <Tabs tabs={tabs} current={tab} onChange={setTab} />
            {tab === 'demandes' && (
                <ReceivedHires
                    hires={hires}
                    loading={false}
                    onChange={(updated) => setHires((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))}
                />
            )}
            {tab === 'fiche' && <ProListingForm pro={pro} onSaved={setPro} />}
            {tab === 'avis' && <Review reviews={reviews} />}
            {tab === 'commandes' && <MyOrders />}
            {tab === 'infos' && <ProfileForm />}
        </>
    );
}
