import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/components/AdminLayout';
import Table from '../table/Table';
import { formatDate } from '../commands/Command';
import api, { apiError } from '../../api/client';

// Demandes de recrutement en attente de validation
export default function Demands() {
    const navigate = useNavigate();
    const [demands, setDemands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/admin/demands/')
            .then((res) => setDemands(res.data))
            .catch((err) => setError(apiError(err, 'Impossible de charger les demandes')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AdminLayout title="Demandes de recrutement">
            {error && <p className="alert-error">{error}</p>}
            <Table
                loading={loading}
                rows={demands}
                empty="Aucune demande en attente"
                columns={[
                    { key: 'name', label: 'Nom', render: (p) => <strong>{p.client.first_name} {p.client.last_name}</strong> },
                    { key: 'metiers', label: 'Métier(s)', render: (p) => p.metiers.map((m) => m.nom_metier).join(', ') },
                    { key: 'phone', label: 'Téléphone', render: (p) => p.client.telephone },
                    { key: 'localisation', label: 'Localisation' },
                    { key: 'created_at', label: 'Reçue le', render: (p) => formatDate(p.created_at) },
                ]}
                actions={(p) => (
                    <button type="button" className="btn btn-sm" onClick={() => navigate(`/admin_demmande?id=${p.id}`)}>
                        Examiner
                    </button>
                )}
            />
        </AdminLayout>
    );
}
