import React, { useEffect, useState } from 'react';
import { toast } from '../components/toast/Toaster';
import { CATEGORIES, CATEGORY_LABELS } from '../api/categories';
import api, { apiError } from '../api/client';
import '../adimnComponents/editcard/editcard.css';

const BASE_FIELDS = ['first_name', 'last_name', 'email', 'telephone', 'birth_date', 'address', 'bio'];
const SELLER_FIELDS = ['speciality', 'register_number'];

// Formulaire « Mes informations » (PUT /api/me), partagé par tous les espaces
// seller : affiche aussi la spécialité et le n° de registre (vendeurs)
export default function ProfileForm({ seller = false, onSaved }) {
    const fields = seller ? [...BASE_FIELDS, ...SELLER_FIELDS] : BASE_FIELDS;
    const [form, setForm] = useState(null);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/me/')
            .then((res) => {
                setForm(Object.fromEntries([...BASE_FIELDS, ...SELLER_FIELDS].map((f) => [f, res.data[f] || ''])));
                setPreview(res.data.image_url);
            })
            .catch((err) => toast(apiError(err, 'Impossible de charger vos informations'), 'error'));
    }, []);

    // Aperçu local de la nouvelle photo
    useEffect(() => {
        if (!image) return undefined;
        const url = URL.createObjectURL(image);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [image]);

    if (!form) return <p className="empty-state">Chargement…</p>;

    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        fields.forEach((f) => data.append(f, form[f]));
        if (image) data.append('image', image);
        setSaving(true);
        try {
            const res = await api.put('/me/', data);
            localStorage.setItem('profil_pic', res.data.image_url || '');
            setImage(null);
            toast('Informations enregistrées', 'success');
            if (onSaved) onSaved(res.data);
        } catch (err) {
            toast(apiError(err, "Vos informations n'ont pas pu être enregistrées"), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="surface form-card form-grid account-form" onSubmit={handleSubmit}>
            <div className="field full">
                <span className="field-label">Photo de profil</span>
                <label className="file-drop">
                    {preview ? <img src={preview} alt="" /> : <span className="file-drop__placeholder">Aucune photo</span>}
                    <span className="file-drop__text">
                        <strong>{image ? image.name : 'Changer la photo'}</strong>
                        <small>PNG, JPG ou WEBP — 5 Mo max</small>
                    </span>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setImage(e.target.files[0] || null)} />
                </label>
            </div>
            <div className="field">
                <label htmlFor="pf-first">Prénom</label>
                <input id="pf-first" autoComplete="given-name" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div className="field">
                <label htmlFor="pf-last">Nom</label>
                <input id="pf-last" autoComplete="family-name" value={form.last_name} onChange={set('last_name')} />
            </div>
            <div className="field">
                <label htmlFor="pf-email">Email</label>
                <input id="pf-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
                <label htmlFor="pf-phone">Téléphone</label>
                <input id="pf-phone" type="tel" autoComplete="tel" value={form.telephone} onChange={set('telephone')} />
            </div>
            <div className="field">
                <label htmlFor="pf-birth">Date de naissance</label>
                <input id="pf-birth" type="date" value={form.birth_date} onChange={set('birth_date')} />
            </div>
            <div className="field">
                <label htmlFor="pf-address">Adresse</label>
                <input id="pf-address" autoComplete="street-address" value={form.address} onChange={set('address')} />
            </div>
            {seller && (
                <>
                    <div className="field">
                        <label htmlFor="pf-spec">Catégorie principale</label>
                        <select id="pf-spec" value={form.speciality} onChange={set('speciality')}>
                            <option value="">—</option>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="pf-reg">N° de registre de commerce</label>
                        <input id="pf-reg" value={form.register_number} onChange={set('register_number')} />
                    </div>
                </>
            )}
            <div className="field full">
                <label htmlFor="pf-bio">Bio</label>
                <textarea id="pf-bio" value={form.bio} onChange={set('bio')} />
            </div>
            <div className="full modal__footer">
                <button type="submit" className="btn" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
        </form>
    );
}
