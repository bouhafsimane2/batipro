import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/authLayout/AuthLayout';
import PasswordInput from '../components/authLayout/PasswordInput';
import api, { apiError, saveSession } from '../api/client';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/login/', credentials);
            saveSession(response.data);
            // Retour à la page demandée, sinon l'espace admin pour les administrateurs
            const home = response.data.usertype === 'admin' ? '/admin' : '/';
            navigate(location.state?.from || home);
        } catch (err) {
            setError(apiError(err, 'Connexion impossible. Veuillez réessayer.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Bon retour parmi nous"
            subtitle="Connectez-vous pour accéder à votre panier, vos favoris et vos messages."
            footer={<>Pas encore de compte ? <Link to="/register">Créer un compte</Link></>}
        >
            <form className="auth__form" onSubmit={handleLogin}>
                <div className="field">
                    <label htmlFor="login-username">Nom d'utilisateur ou email</label>
                    <input
                        id="login-username"
                        className="input"
                        type="text"
                        required
                        autoComplete="username"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    />
                </div>
                <div className="field">
                    <label htmlFor="login-password">Mot de passe</label>
                    <PasswordInput
                        id="login-password"
                        required
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    />
                </div>
                {error && <div className="alert-error" role="alert">{error}</div>}
                <button type="submit" className="btn btn-block" disabled={loading}>
                    {loading ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
        </AuthLayout>
    );
}
