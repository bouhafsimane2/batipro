import { useState } from 'react'

// Champ mot de passe avec bouton « Afficher / Masquer »
export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', ...props }) {
    const [visible, setVisible] = useState(false)
    return (
        <div className="password-field">
            <input
                id={id}
                className="input"
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                {...props}
            />
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {visible ? 'Masquer' : 'Afficher'}
            </button>
        </div>
    )
}
