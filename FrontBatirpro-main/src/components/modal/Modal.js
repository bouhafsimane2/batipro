import { useEffect } from 'react'
import { CloseIcon } from '../icons/Icons'
import './modal.css'

// Fenêtre modale accessible (Échap ou clic sur le fond pour fermer)
export default function Modal({ title, onClose, children }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [onClose])

    return (
        <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal__panel">
                <div className="modal__head">
                    <h2>{title}</h2>
                    <button type="button" className="modal__close" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
                </div>
                <div className="modal__body">{children}</div>
            </div>
        </div>
    )
}
