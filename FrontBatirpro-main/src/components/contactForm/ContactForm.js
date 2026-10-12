import React, { useState } from 'react'

const FIELDS = [
    { name: 'fullName', label: 'Nom complet', type: 'text', autoComplete: 'name', required: true },
    { name: 'phoneNumber', label: 'Téléphone', type: 'tel', autoComplete: 'tel', required: true },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { name: 'country', label: 'Pays', type: 'text', autoComplete: 'country-name' },
    { name: 'region', label: 'Wilaya / région', type: 'text', autoComplete: 'address-level1' },
    { name: 'cartier', label: 'Quartier / commune', type: 'text', autoComplete: 'address-level2' },
]

const EMPTY = { fullName: '', country: 'Algérie', region: '', email: '', cartier: '', phoneNumber: '', note: '' }

// Formulaire de coordonnées partagé : validation de commande et demande d'embauche
export default function ContactForm({ submitLabel, sendingLabel = 'Envoi…', notePlaceholder, onSubmit }) {
    const [values, setValues] = useState(EMPTY)
    const [sending, setSending] = useState(false)

    const set = (name) => (e) => setValues({ ...values, [name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSending(true)
        try {
            await onSubmit(values)
        } finally {
            setSending(false)
        }
    }

    return (
        <form className='form-grid' onSubmit={handleSubmit}>
            {FIELDS.map((f) => (
                <div className='field' key={f.name}>
                    <label htmlFor={`cf-${f.name}`}>{f.label}{f.required && ' *'}</label>
                    <input
                        id={`cf-${f.name}`}
                        type={f.type}
                        autoComplete={f.autoComplete}
                        required={f.required}
                        value={values[f.name]}
                        onChange={set(f.name)}
                    />
                </div>
            ))}
            <div className='field full'>
                <label htmlFor='cf-note'>Note</label>
                <textarea id='cf-note' value={values.note} placeholder={notePlaceholder} onChange={set('note')} />
            </div>
            <div className='full'>
                <button type='submit' className='btn btn-block' disabled={sending}>
                    {sending ? sendingLabel : submitLabel}
                </button>
            </div>
        </form>
    )
}
