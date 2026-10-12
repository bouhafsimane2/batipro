import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { apiError } from '../../api/client'
import { ContactButton } from './ContactButton'
import { formatDate } from '../../adimnComponents/commands/Command'
import defaultPhoto from '../../components/home_card/image/5b8d8c75254d0c3a1bee5db241af2a89.jpg'

const STATUS_LABELS = { pending: 'En attente', approved: 'Validé', rejected: 'Refusé' }
const STATUS_CLASS = { pending: 'status--pending', approved: 'status--success', rejected: 'status--danger' }

// Charge le professionnel indiqué par ?id= (les admins voient aussi les profils en attente)
export function useProfessional() {
    const [searchParams] = useSearchParams()
    const id = searchParams.get('id')
    const [pro, setPro] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) { setError('Aucun profil sélectionné.'); return }
        api.get(`/professionals/${id}/`)
            .then((res) => setPro(res.data))
            .catch((err) => setError(apiError(err, 'Profil introuvable.')))
    }, [id])

    return { id, pro, error }
}

// Fiche détaillée d'un professionnel (profils validés et demandes de recrutement)
export default function ProfessionalDetail({ pro }) {
    const { client } = pro
    return (
        <div className="detail-stack">
            <section className="surface profile-banner">
                <img src={pro.image_url || defaultPhoto} alt="" />
                <div>
                    <h2>{client.first_name} {client.last_name}</h2>
                    <p>{pro.metiers.map((m) => m.nom_metier).join(' · ') || 'Professionnel'} — {pro.localisation}</p>
                    <span className={`status ${STATUS_CLASS[pro.status]}`}>{STATUS_LABELS[pro.status]}</span>
                </div>
                <ContactButton userId={client.id} className="btn btn-outline" />
            </section>

            <section className="surface info-card">
                <h2>Informations personnelles</h2>
                <dl className="info-grid">
                    <div><dt>Prénom</dt><dd>{client.first_name}</dd></div>
                    <div><dt>Nom</dt><dd>{client.last_name}</dd></div>
                    <div><dt>Nom d'utilisateur</dt><dd>{client.username}</dd></div>
                    <div><dt>Date de naissance</dt><dd>{client.birth_date || '—'}</dd></div>
                    <div><dt>Téléphone</dt><dd><a href={`tel:${client.telephone}`}>{client.telephone || '—'}</a></dd></div>
                    <div><dt>Localisation</dt><dd>{pro.localisation || '—'}</dd></div>
                    <div><dt>Code postal</dt><dd>{pro.postal_code || '—'}</dd></div>
                    <div><dt>Inscrit le</dt><dd>{formatDate(pro.created_at)}</dd></div>
                    <div><dt>Note moyenne</dt><dd>{pro.avis_moyenne.toFixed(1)} / 5 ({pro.nb_avis} avis)</dd></div>
                </dl>
            </section>

            <section className="surface info-card">
                <h2>Profil professionnel</h2>
                <dl className="info-grid">
                    <div className="wide"><dt>Métiers</dt><dd>{pro.metiers.map((m) => m.nom_metier).join(', ') || '—'}</dd></div>
                    <div className="wide"><dt>À propos</dt><dd>{pro.about_me || '—'}</dd></div>
                    <div className="wide"><dt>Expérience</dt><dd>{pro.description_experience || '—'}</dd></div>
                </dl>
            </section>
        </div>
    )
}
