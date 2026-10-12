import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { toast } from "../../components/toast/Toaster";
import { CATEGORIES, CATEGORY_LABELS } from "../../api/categories";
import api, { apiError } from "../../api/client";
import "../../adimnComponents/editcard/editcard.css";

const FIELDS = ['first_name', 'last_name', 'email', 'telephone', 'birth_date', 'address', 'speciality', 'register_number', 'bio'];

// Profil de l'utilisateur connecté (admin) : /ProffesionalProfils
export function ProffesionalProfils() {
    const [form, setForm] = useState(null);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/me/')
            .then((res) => {
                setForm(Object.fromEntries(FIELDS.map((f) => [f, res.data[f] || ''])));
                setPreview(res.data.image_url);
            })
            .catch((err) => setError(apiError(err, 'Impossible de charger le profil')));
    }, []);

    useEffect(() => {
        if (!image) return undefined;
        const url = URL.createObjectURL(image);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [image]);

    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        FIELDS.forEach((f) => data.append(f, form[f]));
        if (image) data.append('image', image);
        setSaving(true);
        try {
            const res = await api.put('/me/', data);
            localStorage.setItem('profil_pic', res.data.image_url || '');
            setImage(null);
            toast('Profil enregistré', 'success');
        } catch (err) {
            toast(apiError(err, "Le profil n'a pas pu être enregistré"), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout title="Mon profil">
            {error && <p className="alert-error">{error}</p>}
            {!error && !form && <p className="empty-state">Chargement…</p>}
            {form && (
                <form className="surface form-card admin-form form-grid" onSubmit={handleSubmit}>
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
                        <label htmlFor="me-first">Prénom</label>
                        <input id="me-first" value={form.first_name} onChange={set('first_name')} />
                    </div>
                    <div className="field">
                        <label htmlFor="me-last">Nom</label>
                        <input id="me-last" value={form.last_name} onChange={set('last_name')} />
                    </div>
                    <div className="field">
                        <label htmlFor="me-email">Email</label>
                        <input id="me-email" type="email" value={form.email} onChange={set('email')} />
                    </div>
                    <div className="field">
                        <label htmlFor="me-phone">Téléphone</label>
                        <input id="me-phone" type="tel" value={form.telephone} onChange={set('telephone')} />
                    </div>
                    <div className="field">
                        <label htmlFor="me-birth">Date de naissance</label>
                        <input id="me-birth" type="date" value={form.birth_date} onChange={set('birth_date')} />
                    </div>
                    <div className="field">
                        <label htmlFor="me-address">Adresse</label>
                        <input id="me-address" value={form.address} onChange={set('address')} />
                    </div>
                    <div className="field">
                        <label htmlFor="me-spec">Catégorie de produits</label>
                        <select id="me-spec" value={form.speciality} onChange={set('speciality')}>
                            <option value="">—</option>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="me-reg">N° de registre de commerce</label>
                        <input id="me-reg" value={form.register_number} onChange={set('register_number')} />
                    </div>
                    <div className="field full">
                        <label htmlFor="me-bio">Bio</label>
                        <textarea id="me-bio" value={form.bio} onChange={set('bio')} />
                    </div>
                    <div className="full modal__footer">
                        <button type="submit" className="btn" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                </form>
            )}
        </AdminLayout>
    );
};
