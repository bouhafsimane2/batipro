import React, { useEffect, useState } from 'react';
import api, { apiError } from '../../api/client';
import { CATEGORIES, CATEGORY_LABELS } from '../../api/categories';
import { toast } from '../../components/toast/Toaster';
import './editcard.css';

// Formulaire produit (création si `product` est absent, sinon modification) — envoyé en multipart pour la photo
export default function ProductForm({ product, onSaved, onCancel }) {
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(product?.image_url || null);
    const [form, setForm] = useState({
        productName: product?.nom ?? '',
        price: product?.prix ?? '',
        quantity: product?.quantite ?? '',
        category: product?.categorie ?? 'Materials',
        description: product?.description ?? '',
    });

    // Aperçu local de la photo choisie
    useEffect(() => {
        if (!image) return undefined;
        const url = URL.createObjectURL(image);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [image]);

    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

    async function handleSubmit(e) {
        e.preventDefault();
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        if (image) data.append('image', image);

        setSaving(true);
        try {
            const res = product
                ? await api.put(`/products/${product.id_produit}/`, data)
                : await api.post('/products/', data);
            toast(product ? 'Produit modifié' : 'Produit ajouté', 'success');
            onSaved(res.data);
        } catch (err) {
            toast(apiError(err, "Le produit n'a pas pu être enregistré"), 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
                <label htmlFor="p-name">Nom du produit *</label>
                <input id="p-name" required value={form.productName} onChange={set('productName')} />
            </div>
            <div className="field">
                <label htmlFor="p-price">Prix (DA) *</label>
                <input id="p-price" type="number" min="0" step="any" required value={form.price} onChange={set('price')} />
            </div>
            <div className="field">
                <label htmlFor="p-qty">Quantité en stock</label>
                <input id="p-qty" type="number" min="0" step="1" value={form.quantity} onChange={set('quantity')} />
            </div>
            <div className="field full">
                <label htmlFor="p-cat">Catégorie</label>
                <select id="p-cat" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
            </div>
            <div className="field full">
                <label htmlFor="p-desc">Description</label>
                <textarea id="p-desc" value={form.description} onChange={set('description')} />
            </div>
            <div className="field full">
                <span className="field-label">Photo</span>
                <label className="file-drop">
                    {preview ? <img src={preview} alt="" /> : <span className="file-drop__placeholder">Aucune image</span>}
                    <span className="file-drop__text">
                        <strong>{image ? image.name : 'Choisir une image'}</strong>
                        <small>PNG, JPG ou WEBP — 5 Mo max</small>
                    </span>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setImage(e.target.files[0] || null)} />
                </label>
            </div>
            <div className="full modal__footer">
                {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Annuler</button>}
                <button type="submit" className="btn" disabled={saving}>
                    {saving ? 'Enregistrement…' : product ? 'Enregistrer' : 'Ajouter le produit'}
                </button>
            </div>
        </form>
    );
}
