import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import ProfessionalDetail, { useProfessional } from "../components/ProfessionalDetail";
import { toast } from "../../components/toast/Toaster";
import api, { apiError } from "../../api/client";

// Demande de recrutement : /admin_demmande?id=12
export function Demmande() {
    const navigate = useNavigate();
    const { id, pro, error } = useProfessional();

    // Validation : le profil devient public
    const handleValidate = async () => {
        try {
            await api.post(`/admin/demands/${id}/validate/`);
            toast('Demande validée : le profil est maintenant visible.', 'success');
            navigate('/demands');
        } catch (err) {
            toast(apiError(err), 'error');
        }
    };

    // Suppression : le profil professionnel est supprimé (le compte redevient client)
    const handleDelete = async () => {
        if (!window.confirm('Refuser et supprimer cette demande ?')) return;
        try {
            await api.delete(`/admin/demands/${id}/`);
            toast('Demande supprimée', 'success');
            navigate('/demands');
        } catch (err) {
            toast(apiError(err), 'error');
        }
    };

    return (
        <AdminLayout
            back={{ to: '/demands', label: 'Demandes' }}
            title={pro ? `Demande de ${pro.client.first_name} ${pro.client.last_name}` : 'Demande'}
            actions={pro && pro.status !== 'approved' && <>
                <button type="button" className="btn" onClick={handleValidate}>Valider</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>Refuser</button>
            </>}
        >
            {error && <p className="alert-error">{error}</p>}
            {!error && !pro && <p className="empty-state">Chargement…</p>}
            {pro && <ProfessionalDetail pro={pro} />}
        </AdminLayout>
    );
}
