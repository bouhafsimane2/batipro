import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/authLayout/AuthLayout'
import PasswordInput from '../components/authLayout/PasswordInput'
import { toast } from '../components/toast/Toaster'
import api, { apiError, isLoggedIn, saveSession } from '../api/client'
import './recrutement.css'

// Champs obligatoires de chaque étape
const REQUIRED = {
    account: ['userName', 'password'],
    identity: ['firstName', 'lastName', 'phoneNum', 'address', 'profession'],
    profile: [],
}

export default function Recrutement() {
    const navigate = useNavigate()
    // Un utilisateur déjà connecté n'a pas besoin de créer de compte
    const steps = isLoggedIn()
        ? [{ key: 'identity', label: 'Identité' }, { key: 'profile', label: 'Profil' }]
        : [{ key: 'account', label: 'Compte' }, { key: 'identity', label: 'Identité' }, { key: 'profile', label: 'Profil' }]

    const [current, setCurrent] = useState(0)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [recInfos, setRecInfos] = useState({
        userName : '',
        password : '',
        email : '',
        firstName : '',
        lastName : '',
        birthDate : '',
        phoneNum : '',
        address : '',
        postalCode : '',
        profession : '',
        experience : '',
        aboutYou : ''
    })

    const set = (name) => (e) => setRecInfos({ ...recInfos, [name]: e.target.value })
    const step = steps[current].key
    const isLast = current === steps.length - 1

    const stepIsValid = () => REQUIRED[step].every((f) => recInfos[f].trim() !== '')

    // Dernière étape : envoi de la candidature (validée ensuite par un admin)
    async function submitApplication(){
        setSending(true)
        try {
            const res = await api.post('/professionals/apply/', recInfos)
            if (res.data.token) saveSession(res.data)
            toast(res.data.message, 'success')
            navigate('/')
        } catch (err) {
            setError(apiError(err, "La candidature n'a pas pu être envoyée"))
        } finally {
            setSending(false)
        }
    }

    const handleNext = (e) => {
        e.preventDefault()
        setError('')
        if (!stepIsValid()) {
            setError('Veuillez remplir les champs obligatoires (*).')
            return
        }
        if (isLast) submitApplication()
        else setCurrent(current + 1)
    }

  return (
    <AuthLayout
        wide
        title="Travaillez avec nous"
        subtitle="Artisan ou professionnel du bâtiment ? Créez votre profil : il sera visible après validation par notre équipe."
        footer={<>Vous cherchez un artisan ? <Link to="/profils">Voir les professionnels</Link></>}
    >
        <ol className="stepper" aria-label="Étapes de la candidature">
            {steps.map((s, i) => (
                <li key={s.key} className={i === current ? 'is-current' : i < current ? 'is-done' : ''}>
                    <button type="button" onClick={() => i < current && setCurrent(i)} disabled={i > current}>
                        <span className="stepper__num">{i < current ? '✓' : i + 1}</span>
                        <span className="stepper__label">{s.label}</span>
                    </button>
                </li>
            ))}
        </ol>

        <form className="auth__form" onSubmit={handleNext}>
            {step === 'account' && (
                <div className="form-grid">
                    <div className="field">
                        <label htmlFor="rec-user">Nom d'utilisateur *</label>
                        <input id="rec-user" autoComplete="username" value={recInfos.userName} onChange={set('userName')} />
                    </div>
                    <div className="field">
                        <label htmlFor="rec-email">Email</label>
                        <input id="rec-email" type="email" autoComplete="email" value={recInfos.email} onChange={set('email')} />
                    </div>
                    <div className="field full">
                        <label htmlFor="rec-pass">Mot de passe * (6 caractères minimum)</label>
                        <PasswordInput id="rec-pass" autoComplete="new-password" value={recInfos.password} onChange={set('password')} />
                    </div>
                </div>
            )}

            {step === 'identity' && (
                <div className="form-grid">
                    <div className="field">
                        <label htmlFor="rec-first">Prénom *</label>
                        <input id="rec-first" autoComplete="given-name" value={recInfos.firstName} onChange={set('firstName')} />
                    </div>
                    <div className="field">
                        <label htmlFor="rec-last">Nom *</label>
                        <input id="rec-last" autoComplete="family-name" value={recInfos.lastName} onChange={set('lastName')} />
                    </div>
                    <div className="field">
                        <label htmlFor="rec-birth">Date de naissance</label>
                        <input id="rec-birth" type="date" value={recInfos.birthDate} onChange={set('birthDate')} />
                    </div>
                    <div className="field">
                        <label htmlFor="rec-phone">Téléphone *</label>
                        <input id="rec-phone" type="tel" autoComplete="tel" value={recInfos.phoneNum} onChange={set('phoneNum')} />
                    </div>
                    <div className="field">
                        <label htmlFor="rec-address">Ville / wilaya *</label>
                        <input id="rec-address" autoComplete="address-level2" value={recInfos.address} onChange={set('address')} />
                    </div>
                    <div className="field">
                        <label htmlFor="rec-postal">Code postal</label>
                        <input id="rec-postal" autoComplete="postal-code" value={recInfos.postalCode} onChange={set('postalCode')} />
                    </div>
                    <div className="field full">
                        <label htmlFor="rec-prof">Métier(s) * — séparés par des virgules</label>
                        <input id="rec-prof" placeholder="Ex. Maçon, Carreleur" value={recInfos.profession} onChange={set('profession')} />
                    </div>
                </div>
            )}

            {step === 'profile' && (
                <div className="form-grid">
                    <div className="field full">
                        <label htmlFor="rec-about">À propos de vous</label>
                        <textarea id="rec-about" placeholder="Présentez-vous en quelques lignes…" value={recInfos.aboutYou} onChange={set('aboutYou')} />
                    </div>
                    <div className="field full">
                        <label htmlFor="rec-exp">Expérience</label>
                        <textarea id="rec-exp" placeholder="Années d'expérience, chantiers réalisés, spécialités…" value={recInfos.experience} onChange={set('experience')} />
                    </div>
                </div>
            )}

            {error && <div className="alert-error" role="alert">{error}</div>}

            <div className="stepper__actions">
                {current > 0 && (
                    <button type="button" className="btn btn-outline" onClick={() => { setError(''); setCurrent(current - 1) }}>
                        Précédent
                    </button>
                )}
                <button type="submit" className="btn" disabled={sending}>
                    {isLast ? (sending ? 'Envoi…' : 'Envoyer ma candidature') : 'Suivant'}
                </button>
            </div>
        </form>
    </AuthLayout>
  )
}
