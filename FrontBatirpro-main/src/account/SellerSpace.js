import { useCallback, useEffect, useState } from 'react';
import Table from '../adimnComponents/table/Table';
import ProductForm from '../adimnComponents/editcard/Editcard';
import { OrderStatus, formatDate } from '../adimnComponents/commands/Command';
import Modal from '../components/modal/Modal';
import { formatPrice } from '../components/productCard/ProductCard';
import placeholder from '../components/productCard/images/placeholder.png';
import { toast } from '../components/toast/Toaster';
import { CATEGORY_LABELS } from '../api/categories';
import api, { apiError } from '../api/client';
import ProfileForm from './ProfileForm';
import { Tabs, useTab } from './shared';

const TABS = [
    { key: 'produits', label: 'Mes produits' },
    { key: 'commandes', label: 'Commandes' },
    { key: 'infos', label: 'Mes informations' },
];

export default function SellerSpace() {
    const [tab, setTab] = useTab(TABS);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    // false = fenêtre fermée, null = nouveau produit, objet = produit à modifier
    const [editing, setEditing] = useState(false);

    const load = useCallback(() => {
        Promise.all([api.get('/products/', { params: { owner: 'me' } }), api.get('/orders/seller')])
            .then(([p, o]) => {
                setProducts(p.data);
                setOrders(o.data);
            })
            .catch((err) => toast(apiError(err, 'Impossible de charger votre espace vendeur'), 'error'))
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

    // Les ventes comptent les commandes non annulées
    const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.seller_total, 0);
    const outOfStock = products.filter((p) => p.quantite <= 0).length;

    return (
        <>
            <div className="stat-row">
                <div className="surface stat-mini"><span>{products.length}</span>Produits en vente</div>
                <div className="surface stat-mini"><span className={outOfStock ? 'is-alert' : ''}>{outOfStock}</span>En rupture de stock</div>
                <div className="surface stat-mini"><span>{orders.length}</span>Commandes reçues</div>
                <div className="surface stat-mini"><span>{formatPrice(revenue)}</span>Chiffre d'affaires</div>
            </div>

            <Tabs tabs={TABS} current={tab} onChange={setTab} />

            {tab === 'produits' && (
                <>
                    <div className="account-toolbar">
                        <button type="button" className="btn" onClick={() => setEditing(null)}>+ Ajouter un produit</button>
                    </div>
                    <Table
                        loading={loading}
                        rows={products}
                        getKey={(p) => p.id_produit}
                        empty="Vous n'avez pas encore de produit en vente."
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
                </>
            )}

            {tab === 'commandes' && (
                <Table
                    loading={loading}
                    rows={orders}
                    empty="Aucune commande ne contient encore vos produits."
                    columns={[
                        { key: 'id', label: 'N°', render: (o) => `#${o.id}` },
                        { key: 'created_at', label: 'Date', render: (o) => formatDate(o.created_at) },
                        { key: 'client', label: 'Client', render: (o) => (
                            <span className="cell-list"><strong>{o.full_name}</strong><br /><a href={`tel:${o.phone}`}>{o.phone}</a></span>
                        ) },
                        { key: 'items', label: 'Vos articles', render: (o) => (
                            <ul className="cell-list">
                                {o.items.map((i) => <li key={`${o.id}-${i.product_id}`}>{i.quantity} × {i.nom}</li>)}
                            </ul>
                        ) },
                        { key: 'delivery', label: 'Livraison', render: (o) => (o.delivery ? `Oui — ${o.region || ''}` : 'Retrait') },
                        { key: 'seller_total', label: 'Montant', render: (o) => <strong>{formatPrice(o.seller_total)}</strong> },
                        { key: 'status', label: 'Statut', render: (o) => <OrderStatus status={o.status} /> },
                    ]}
                />
            )}

            {tab === 'infos' && <ProfileForm seller />}

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
        </>
    );
}
