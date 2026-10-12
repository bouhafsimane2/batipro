import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../admin/components/AdminLayout';
import Table from '../table/Table';
import { OrderStatus, formatDate } from '../commands/Command';
import { formatPrice } from '../../components/productCard/ProductCard';
import { toast } from '../../components/toast/Toaster';
import api, { apiError } from '../../api/client';

// Détail d'une commande : /displayOrder?id=12
export default function Displayorder() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!id) { navigate('/commands', { replace: true }); return; }
        api.get(`/admin/orders/${id}/`)
            .then((res) => setOrder(res.data))
            .catch((err) => setError(apiError(err, 'Commande introuvable')));
    }, [id, navigate]);

    const setStatus = async (status, message) => {
        setBusy(true);
        try {
            setOrder((await api.patch(`/admin/orders/${id}/`, { status })).data);
            toast(message, 'success');
        } catch (err) {
            toast(apiError(err), 'error');
        } finally {
            setBusy(false);
        }
    };

    // Les produits d'une commande en attente sont remis en stock par le serveur
    const handleDelete = async () => {
        if (!window.confirm('Supprimer définitivement cette commande ?')) return;
        try {
            await api.delete(`/admin/orders/${id}/`);
            toast('Commande supprimée', 'success');
            navigate('/commands');
        } catch (err) {
            toast(apiError(err), 'error');
        }
    };

    const back = { to: '/commands', label: 'Commandes' };

    if (error) return <AdminLayout back={back}><p className="alert-error">{error}</p></AdminLayout>;
    if (!order) return <AdminLayout back={back}><p className="empty-state">Chargement…</p></AdminLayout>;

    return (
        <AdminLayout
            back={back}
            title={<>Commande #{order.id} <OrderStatus status={order.status} /></>}
            actions={<>
                {order.status !== 'validated' && (
                    <button type="button" className="btn" disabled={busy} onClick={() => setStatus('validated', 'Commande validée')}>Valider</button>
                )}
                {order.status === 'pending' && (
                    <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setStatus('cancelled', 'Commande annulée, stock restitué')}>Annuler</button>
                )}
                <button type="button" className="btn btn-danger" disabled={busy} onClick={handleDelete}>Supprimer</button>
            </>}
        >
            <div className="detail-stack">
                <Table
                    rows={order.items}
                    columns={[
                        { key: 'nom', label: 'Produit' },
                        { key: 'prix', label: 'Prix unitaire', render: (i) => formatPrice(i.prix) },
                        { key: 'quantity', label: 'Quantité' },
                        { key: 'total', label: 'Total', render: (i) => <strong>{formatPrice(i.prix * i.quantity)}</strong> },
                    ]}
                />
                <p className="order-total">Total de la commande : <strong>{formatPrice(order.total)}</strong></p>

                <section className="surface info-card">
                    <h2>Informations client</h2>
                    <dl className="info-grid">
                        <div><dt>Nom complet</dt><dd>{order.full_name}</dd></div>
                        <div><dt>Téléphone</dt><dd><a href={`tel:${order.phone}`}>{order.phone}</a></dd></div>
                        <div><dt>Email</dt><dd>{order.email || '—'}</dd></div>
                        <div><dt>Date</dt><dd>{formatDate(order.created_at)}</dd></div>
                        <div><dt>Pays</dt><dd>{order.country || '—'}</dd></div>
                        <div><dt>Région</dt><dd>{order.region || '—'}</dd></div>
                        <div><dt>Quartier</dt><dd>{order.cartier || '—'}</dd></div>
                        <div><dt>Livraison</dt><dd>{order.delivery ? 'Oui' : 'Retrait sur place'}</dd></div>
                        {order.note && <div className="wide"><dt>Note</dt><dd>{order.note}</dd></div>}
                    </dl>
                </section>
            </div>
        </AdminLayout>
    );
}
