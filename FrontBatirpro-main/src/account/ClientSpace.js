import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Table from '../adimnComponents/table/Table';
import { OrderStatus, formatDate } from '../adimnComponents/commands/Command';
import { formatPrice } from '../components/productCard/ProductCard';
import { ContactButton } from '../admin/components/ContactButton';
import { toast } from '../components/toast/Toaster';
import api, { apiError } from '../api/client';
import ProfileForm from './ProfileForm';
import { HireStatus, Tabs, useTab } from './shared';

const TABS = [
    { key: 'commandes', label: 'Mes commandes' },
    { key: 'demandes', label: 'Mes demandes' },
    { key: 'infos', label: 'Mes informations' },
];

export function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders/mine')
            .then((res) => setOrders(res.data))
            .catch((err) => toast(apiError(err), 'error'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Table
            loading={loading}
            rows={orders}
            empty={<>Vous n'avez pas encore passé de commande. <Link to="/marketplace">Voir le marketplace</Link></>}
            columns={[
                { key: 'id', label: 'N°', render: (o) => `#${o.id}` },
                { key: 'created_at', label: 'Date', render: (o) => formatDate(o.created_at) },
                { key: 'items', label: 'Articles', render: (o) => (
                    <ul className="cell-list">
                        {o.items.map((i) => <li key={i.id}>{i.quantity} × {i.nom}</li>)}
                    </ul>
                ) },
                { key: 'delivery', label: 'Livraison', render: (o) => (o.delivery ? 'Oui' : 'Retrait') },
                { key: 'total', label: 'Total', render: (o) => <strong>{formatPrice(o.total)}</strong> },
                { key: 'status', label: 'Statut', render: (o) => <OrderStatus status={o.status} /> },
            ]}
        />
    );
}

function MyHireRequests() {
    const [hires, setHires] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/hires/mine')
            .then((res) => setHires(res.data))
            .catch((err) => toast(apiError(err), 'error'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Table
            loading={loading}
            rows={hires}
            empty={<>Aucune demande d'embauche envoyée. <Link to="/profils">Trouver un professionnel</Link></>}
            columns={[
                { key: 'pro', label: 'Professionnel', render: (h) => (
                    <Link to={`/my_profils?id=${h.professional_id}`}><strong>{h.pro_first_name} {h.pro_last_name}</strong></Link>
                ) },
                { key: 'created_at', label: 'Envoyée le', render: (h) => formatDate(h.created_at) },
                { key: 'note', label: 'Message', render: (h) => h.note || '—' },
                { key: 'status', label: 'Statut', render: (h) => <HireStatus status={h.status} /> },
            ]}
            actions={(h) => <ContactButton userId={h.pro_user_id} className="btn btn-sm btn-outline">Écrire</ContactButton>}
        />
    );
}

export default function ClientSpace() {
    const [tab, setTab] = useTab(TABS);
    return (
        <>
            <Tabs tabs={TABS} current={tab} onChange={setTab} />
            {tab === 'commandes' && <MyOrders />}
            {tab === 'demandes' && <MyHireRequests />}
            {tab === 'infos' && <ProfileForm />}
        </>
    );
}
