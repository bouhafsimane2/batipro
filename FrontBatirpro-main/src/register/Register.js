import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/authLayout/AuthLayout';
import PasswordInput from '../components/authLayout/PasswordInput';
import { toast } from '../components/toast/Toaster';
import api, { apiError, saveSession } from '../api/client';


export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });

    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }
        setLoading(true);
        try {
            // Le compte est créé puis l'utilisateur est directement connecté
            const response = await api.post('/register/', {
                username: form.username, email: form.email, password: form.password,
            });
            saveSession(response.data);
            toast('Bienvenue sur Batipro !', 'success');
            navigate('/');
        } catch (err) {
            setError(apiError(err, "L'inscription a échoué. Veuillez réessayer."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Créer un compte"
            subtitle="Commandez des matériaux, contactez des artisans et suivez vos projets."
            footer={<>
                Déjà inscrit ? <Link to="/login">Se connecter</Link>
                <br />Vous êtes artisan ? <Link to="/recrutement">Proposez vos services</Link>
            </>}
        >
            <form className="auth__form" onSubmit={handleSubmit}>
                <div className="field">
                    <label htmlFor="reg-username">Nom d'utilisateur</label>
                    <input id="reg-username" className="input" type="text" required minLength={3}
                        autoComplete="username" value={form.username} onChange={set('username')} />
                </div>
                <div className="field">
                    <label htmlFor="reg-email">Email</label>
                    <input id="reg-email" className="input" type="email" required
                        autoComplete="email" value={form.email} onChange={set('email')} />
                </div>
                <div className="field">
                    <label htmlFor="reg-password">Mot de passe</label>
                    <PasswordInput id="reg-password" required minLength={6} autoComplete="new-password"
                        value={form.password} onChange={set('password')} />
                </div>
                <div className="field">
                    <label htmlFor="reg-confirm">Confirmer le mot de passe</label>
                    <PasswordInput id="reg-confirm" required minLength={6} autoComplete="new-password"
                        value={form.confirm} onChange={set('confirm')} />
                </div>
                {error && <div className="alert-error" role="alert">{error}</div>}
                <button type="submit" className="btn btn-block" disabled={loading}>
                    {loading ? 'Création du compte…' : "S'inscrire"}
                </button>
            </form>
        </AuthLayout>
    )
}
