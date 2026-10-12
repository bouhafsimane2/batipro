import { useSearchParams } from 'react-router-dom';

export const ROLE_LABELS = {
    client: 'Client',
    professional: 'Professionnel',
    market_owner: 'Vendeur',
    admin: 'Administrateur',
};

// Libellé de l'espace dans la navbar selon le rôle
export const SPACE_LABELS = {
    client: 'Mon compte',
    professional: 'Espace pro',
    market_owner: 'Espace vendeur',
    admin: 'Espace admin',
};

const HIRE_STATUS = {
    pending: { label: 'En attente', className: 'status--pending' },
    accepted: { label: 'Acceptée', className: 'status--success' },
    declined: { label: 'Refusée', className: 'status--danger' },
};

export const HireStatus = ({ status }) => (
    <span className={`status ${HIRE_STATUS[status]?.className || ''}`}>{HIRE_STATUS[status]?.label || status}</span>
);

// Onglet actif conservé dans l'URL (/compte?tab=commandes) pour pouvoir partager ou recharger la page
export function useTab(tabs) {
    const [params, setParams] = useSearchParams();
    const current = tabs.some((t) => t.key === params.get('tab')) ? params.get('tab') : tabs[0].key;
    const setTab = (key) => setParams({ tab: key }, { replace: true });
    return [current, setTab];
}

export function Tabs({ tabs, current, onChange }) {
    return (
        <div className="tabs account-tabs" role="tablist">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={current === t.key}
                    className={current === t.key ? 'is-active' : ''}
                    onClick={() => onChange(t.key)}
                >
                    {t.label}
                    {t.badge > 0 && <span className="badge">{t.badge}</span>}
                </button>
            ))}
        </div>
    );
}
