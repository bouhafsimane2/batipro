import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { apiError, currentUserId, isLoggedIn } from '../api/client';
import { Navbar } from '../components/navbar/navbar';
import { Footer } from '../components/footer/footer';
import { Stars } from '../components/home_card/card';
import { MapPinIcon, MessageIcon, PhoneIcon } from '../components/icons/Icons';
import { toast } from '../components/toast/Toaster';
import Review from '../components/review/review';
import Addreview from '../components/addreview/addreview';
import defaultPhoto from '../components/home_card/image/5b8d8c75254d0c3a1bee5db241af2a89.jpg';
import './my_profils.css';

// Page publique d'un professionnel : /my_profils?id=12
export function My_Profils() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id_prof = searchParams.get('id');
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchReviews = useCallback(() => {
        api.get(`/professionals/${id_prof}/reviews/`).then((res) => setReviews(res.data)).catch(() => {});
    }, [id_prof]);

    const fetchProfile = useCallback(() => {
        api.get(`/professionals/${id_prof}/`)
            .then((res) => setProfile(res.data))
            .catch((err) => setError(apiError(err, 'Profil introuvable.')))
            .finally(() => setLoading(false));
    }, [id_prof]);

    useEffect(() => {
        if (!id_prof) {
            setError('Aucun profil sélectionné.');
            setLoading(false);
            return;
        }
        fetchProfile();
        fetchReviews();
    }, [id_prof, fetchProfile, fetchReviews]);

    // Ouvre (ou retrouve) la conversation avec ce professionnel
    const handleContact = async () => {
        if (!isLoggedIn()) {
            toast('Connectez-vous pour envoyer un message.', 'info');
            navigate('/login');
            return;
        }
        try {
            const res = await api.post('/conversations', { professional_id: Number(id_prof) });
            navigate(`/messages?c=${res.data.id}`);
        } catch (err) {
            toast(apiError(err, "Impossible d'ouvrir la conversation"), 'error');
        }
    };

    const onReviewAdded = () => {
        fetchReviews();
        fetchProfile(); // met à jour la note moyenne
    };

    let content;
    if (loading) {
        content = <p className="empty-state">Chargement du profil…</p>;
    } else if (error || !profile) {
        content = (
            <div className="empty-state empty-state--box">
                <p><strong>{error || 'Profil introuvable.'}</strong></p>
                <Link to="/profils" className="btn">Voir les professionnels</Link>
            </div>
        );
    } else {
        const { client } = profile;
        const isMe = client.id === currentUserId();
        content = (
            <>
                <section className="pro-header surface">
                    <img className="pro-header__photo" src={profile.image_url || defaultPhoto} alt="" />
                    <div className="pro-header__info">
                        <h1>{client.first_name} {client.last_name}</h1>
                        <p className="pro-header__metiers">{profile.metiers.map((m) => m.nom_metier).join(' · ')}</p>
                        <div className="pro-header__rating">
                            <Stars rating={profile.avis_moyenne} size={18} />
                            <span>{profile.avis_moyenne.toFixed(1)} · {profile.nb_avis} avis</span>
                        </div>
                        <ul className="pro-header__meta">
                            {profile.localisation && <li><MapPinIcon size={16} /> {profile.localisation}</li>}
                            {client.telephone && (
                                <li><PhoneIcon size={16} /> <a href={`tel:${client.telephone}`}>{client.telephone}</a></li>
                            )}
                        </ul>
                    </div>
                    {!isMe && (
                        <div className="pro-header__actions">
                            <Link to={`/hireInfo?id=${encodeURIComponent(id_prof)}`} className="btn">Embaucher</Link>
                            <button type="button" className="btn btn-outline" onClick={handleContact}>
                                <MessageIcon size={18} /> Contacter
                            </button>
                        </div>
                    )}
                </section>

                <div className="pro-details">
                    <section className="surface pro-block">
                        <h2>À propos</h2>
                        <p>{profile.about_me || 'Ce professionnel n’a pas encore rédigé de présentation.'}</p>
                    </section>
                    <section className="surface pro-block">
                        <h2>Expérience</h2>
                        {profile.description_experience && <p>{profile.description_experience}</p>}
                        <ul className="pro-block__metiers">
                            {profile.metiers.map((m) => (
                                <li key={m.id_metier}>
                                    <strong>{m.nom_metier}</strong>
                                    {m.description && <span>{m.description}</span>}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <section className="pro-reviews">
                    <h2 className="pro-reviews__title">Avis clients <span>({reviews.length})</span></h2>
                    <div className="pro-reviews__grid">
                        <Review reviews={reviews} />
                        {!isMe && <Addreview prof_id={id_prof} onAdded={onReviewAdded} />}
                    </div>
                </section>
            </>
        );
    }

    return (
        <div className="page">
            <Navbar />
            <main>
                <Link to="/profils" className="back-link">← Tous les professionnels</Link>
                {content}
            </main>
            <Footer />
        </div>
    );
}
