import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/components/AdminLayout';
import Table from '../table/Table';
import { formatPrice } from '../../components/productCard/ProductCard';
import api, { apiError } from '../../api/client';

const STATUS = {
  pending: { label: 'En attente', className: 'status--pending' },
  validated: { label: 'Validée', className: 'status--success' },
  cancelled: { label: 'Annulée', className: 'status--muted' },
};

export const OrderStatus = ({ status }) => (
  <span className={`status ${STATUS[status]?.className || ''}`}>{STATUS[status]?.label || status}</span>
);

// Les dates SQLite sont en UTC sans fuseau ("2026-10-12 10:00:00")
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('fr-FR');
}

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'validated', label: 'Validées' },
  { value: 'cancelled', label: 'Annulées' },
];

export default function Command() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
      setLoading(true);
      api.get('/admin/orders/', { params: status ? { status } : {} })
        .then((res) => { setOrders(res.data); setError(''); })
        .catch((err) => setError(apiError(err, 'Impossible de charger les commandes')))
        .finally(() => setLoading(false));
    }, [status]);

    return (
      <AdminLayout title="Commandes">
        <div className="tabs" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" role="tab" aria-selected={status === f.value}
              className={status === f.value ? 'is-active' : ''} onClick={() => setStatus(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        {error && <p className="alert-error">{error}</p>}
        <Table
          loading={loading}
          rows={orders}
          empty="Aucune commande"
          columns={[
            { key: 'id', label: 'N°', render: (o) => `#${o.id}` },
            { key: 'full_name', label: 'Client' },
            { key: 'created_at', label: 'Date', render: (o) => formatDate(o.created_at) },
            { key: 'region', label: 'Région' },
            { key: 'total', label: 'Total', render: (o) => formatPrice(o.total) },
            { key: 'status', label: 'Statut', render: (o) => <OrderStatus status={o.status} /> },
          ]}
          actions={(o) => (
            <button type="button" className="btn btn-sm" onClick={() => navigate(`/displayOrder?id=${o.id}`)}>
              Voir
            </button>
          )}
        />
      </AdminLayout>
    );
}
