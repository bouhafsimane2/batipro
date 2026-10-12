import AdminLayout from "../components/AdminLayout";
import ProfessionalDetail, { useProfessional } from "../components/ProfessionalDetail";

// Fiche d'un professionnel validé : /ConstructersProfil?id=12
export function ConstructersProfil() {
    const { pro, error } = useProfessional();
    const back = { to: '/profiles', label: 'Profils' };

    return (
        <AdminLayout back={back} title="Professionnel">
            {error && <p className="alert-error">{error}</p>}
            {!error && !pro && <p className="empty-state">Chargement…</p>}
            {pro && <ProfessionalDetail pro={pro} />}
        </AdminLayout>
    );
}
