import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../admin/components/AdminLayout';
import Table from '../table/Table';
import ProductForm from '../editcard/Editcard';
import Modal from '../../components/modal/Modal';
import { formatPrice } from '../../components/productCard/ProductCard';
import placeholder from '../../components/productCard/images/placeholder.png';
import { toast } from '../../components/toast/Toaster';
import { CATEGORY_LABELS } from '../../api/categories';
import api, { apiError } from '../../api/client';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    // false = fenêtre fermée, null = nouveau produit, objet = produit à modifier
    const [editing, setEditing] = useState(false);

    const load = useCallback(() => {
        api.get('/products/')
            .then((res) => setProducts(res.data))
            .catch((err) => toast(apiError(err, 'Impossible de charger les produits'), 'error'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(load, [load]);

    const handleDelete = async (p) => {
        if (!window.confirm(`Supprimer « ${p.nom} » ?`)) return;
        try {
            await api.delete(`/products/${p.id_produit}/`);
            toast('Produit supprimé', 'success');
            load();
        } catch (err) {
            toast(apiError(err), 'error');
        }
    };

    const visible = products.filter((p) => p.nom.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AdminLayout
        title="Produits"
        actions={<button type="button" className="btn" onClick={() => setEditing(null)}>+ Ajouter un produit</button>}
    >
        <input
            type="search"
            className="input admin-search"
            placeholder="Rechercher un produit…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
        />
        <Table
            loading={loading}
            rows={visible}
            getKey={(p) => p.id_produit}
            empty="Aucun produit"
            columns={[
                { key: 'nom', label: 'Produit', render: (p) => (
                    <span className="cell-product"><img className="thumb" src={p.image_url || placeholder} alt="" /> <strong>{p.nom}</strong></span>
                ) },
                { key: 'categorie', label: 'Catégorie', render: (p) => CATEGORY_LABELS[p.categorie] },
                { key: 'prix', label: 'Prix', render: (p) => formatPrice(p.prix) },
                { key: 'quantite', label: 'Stock', render: (p) => (
                    p.quantite > 0 ? p.quantite : <span className="status status--danger">Épuisé</span>
                ) },
            ]}
            actions={(p) => <>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(p)}>Modifier</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>Supprimer</button>
            </>}
        />
        {editing !== false && (
            <Modal title={editing ? 'Modifier le produit' : 'Nouveau produit'} onClose={() => setEditing(false)}>
                <ProductForm
                    key={editing?.id_produit ?? 'new'}
                    product={editing}
                    onCancel={() => setEditing(false)}
                    onSaved={() => { setEditing(false); load(); }}
                />
            </Modal>
        )}
    </AdminLayout>
  );
}
