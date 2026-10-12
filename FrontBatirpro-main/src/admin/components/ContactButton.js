import { useNavigate } from 'react-router-dom';
import api, { apiError, currentUserId } from '../../api/client';
import { toast } from '../../components/toast/Toaster';

// Bouton "Envoyer un message" : ouvre la conversation avec l'utilisateur donné
export function ContactButton({ userId, className = 'btn', children = 'Envoyer un message' }) {
    const navigate = useNavigate();
    if (!userId || userId === currentUserId()) return null;

    const handleClick = async () => {
        try {
            const res = await api.post('/conversations', { user_id: userId });
            navigate(`/messages?c=${res.data.id}`);
        } catch (err) {
            toast(apiError(err, "Impossible d'ouvrir la conversation"), 'error');
        }
    };

    return <button type="button" className={className} onClick={handleClick}>{children}</button>;
}
