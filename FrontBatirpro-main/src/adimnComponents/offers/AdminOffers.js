import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../admin/components/AdminLayout';
import Table from '../table/Table';
import Modal from '../../components/modal/Modal';
import { toast } from '../../components/toast/Toaster';
import api, { apiError } from '../../api/client';
import { CATEGORIES, CATEGORY_LABELS } from '../../api/categories';
import '../editcard/editcard.css';

// Formulaire de création / modification d'une offre (offer = null → création)
function OfferForm({ offer, onClose, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState(null);
    const [form, setForm] = useState({
        title: offer?.title ?? '',
        description: offer?.description ?? '',
        category: offer?.categorie ?? 'Materials',
        active: offer?.active ?? true,
    });

    async function handleSubmit(e) {
        e.preventDefault();
        const data = new FormData();
        data.append('title', form.title);
        data.append('description', form.description);
        data.append('category', form.category);
        data.append('active', form.active ? '1' : '0');
        if (image) data.append('image', image);

        setSaving(true);
        try {
            if (offer) await api.put(`/offers/${offer.id}/`, data);
            else await api.post('/offers/', data);
            toast(offer ? 'Offre modifiée' : 'Offre ajoutée', 'success');
            onSaved();
        } catch (err) {
            toast(apiError(err, "L'offre n'a pas pu être enregistrée"), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
                <label htmlFor="o-title">Titre *</label>
                <input id="o-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field full">
                <label htmlFor="o-cat">Catégorie de produits liée</label>
                <select id="o-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
            </div>
            <div className="field full">
                <label htmlFor="o-desc">Description</label>
                <textarea id="o-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="field full">
                <span className="field-label">Image (facultative)</span>
                <label className="file-drop">
                    {offer?.image_url && !image ? <img src={offer.image_url} alt="" /> : <span className="file-drop__placeholder">{image ? '✓' : 'Icône par défaut'}</span>}
                    <span className="file-drop__text">
                        <strong>{image ? image.name : 'Choisir une image'}</strong>
                        <small>PNG, JPG ou WEBP — 5 Mo max</small>
                    </span>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setImage(e.target.files[0] || null)} />
                </label>
            </div>
            <label className="checkbox full">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Visible sur la page Offres
            </label>
            <div className="full modal__footer">
                <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
        </form>
    );
}

export default function AdminOffers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    // false = fenêtre fermée, null = nouvelle offre, objet = offre à modifier
    const [editing, setEditing] = useState(false);

    const load = useCallback(() => {
        api.get('/offers/', { params: { all: 1 } })
            .then((res) => setOffers(res.data))
            .catch((err) => toast(apiError(err, 'Impossible de charger les offres'), 'error'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const handleDelete = async (offer) => {
        if (!window.confirm(`Supprimer l'offre « ${offer.title} » ?`)) return;
        try {
            await api.delete(`/offers/${offer.id}/`);
            toast('Offre supprimée', 'success');
            load();
        } catch (err) {
            toast(apiError(err), 'error');
        }
    };

    return (
        <AdminLayout
            title="Offres"
            actions={<button type="button" className="btn" onClick={() => setEditing(null)}>+ Ajouter une offre</button>}
        >
            <Table
                loading={loading}
                rows={offers}
                empty="Aucune offre"
                columns={[
                    { key: 'title', label: 'Titre', render: (o) => <strong>{o.title}</strong> },
                    { key: 'categorie', label: 'Catégorie', render: (o) => CATEGORY_LABELS[o.categorie] || o.categorie },
                    { key: 'nb_produits', label: 'Produits' },
                    { key: 'active', label: 'Statut', render: (o) => (
                        <span className={`status ${o.active ? 'status--success' : 'status--muted'}`}>{o.active ? 'Visible' : 'Masquée'}</span>
                    ) },
                ]}
                actions={(o) => <>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(o)}>Modifier</button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(o)}>Supprimer</button>
                </>}
            />
            {editing !== false && (
                <Modal title={editing ? "Modifier l'offre" : 'Nouvelle offre'} onClose={() => setEditing(false)}>
                    <OfferForm
                        key={editing?.id ?? 'new'}
                        offer={editing}
                        onClose={() => setEditing(false)}
                        onSaved={() => { setEditing(false); load(); }}
                    />
                </Modal>
            )}
        </AdminLayout>
    );
}
