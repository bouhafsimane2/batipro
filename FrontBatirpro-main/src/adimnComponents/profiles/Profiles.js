import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/components/AdminLayout';
import Table from '../table/Table';
import { CATEGORY_LABELS } from '../../api/categories';
import api, { apiError } from '../../api/client';

const TABS = [
  { value: 'professional', label: 'Professionnels' },
  { value: 'market_owner', label: 'Vendeurs' },
];

const COLUMNS = {
  professional: [
    { key: 'name', label: 'Nom', render: (p) => <strong>{p.client.first_name} {p.client.last_name}</strong> },
    { key: 'metiers', label: 'Métier(s)', render: (p) => p.metiers.map((m) => m.nom_metier).join(', ') },
    { key: 'localisation', label: 'Localisation' },
    { key: 'rating', label: 'Note', render: (p) => `${p.avis_moyenne.toFixed(1)} ★ (${p.nb_avis})` },
  ],
  market_owner: [
    { key: 'name', label: 'Nom', render: (u) => <strong>{u.first_name} {u.last_name}</strong> },
    { key: 'speciality', label: 'Spécialité', render: (u) => CATEGORY_LABELS[u.speciality] || u.speciality || '—' },
    { key: 'address', label: 'Adresse' },
    { key: 'telephone', label: 'Téléphone' },
  ],
};

export default function Profiles() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('professional');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/admin/profiles/', { params: { type: tab } })
      .then((res) => { setRows(res.data); setError(''); })
      .catch((err) => setError(apiError(err, 'Impossible de charger les profils')))
      .finally(() => setLoading(false));
  }, [tab]);

  const open = (row) => navigate(tab === 'professional' ? `/ConstructersProfil?id=${row.id}` : `/Marketowner?id=${row.id}`);

  return (
    <AdminLayout title="Profils">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.value} type="button" role="tab" aria-selected={tab === t.value}
            className={tab === t.value ? 'is-active' : ''} onClick={() => setTab(t.value)}>
            {t.label}
          </button>
        ))}
      </div>
      {error && <p className="alert-error">{error}</p>}
      <Table
        loading={loading}
        rows={rows}
        columns={COLUMNS[tab]}
        empty="Aucun profil"
        actions={(row) => <button type="button" className="btn btn-sm" onClick={() => open(row)}>Voir</button>}
      />
    </AdminLayout>
  );
}
