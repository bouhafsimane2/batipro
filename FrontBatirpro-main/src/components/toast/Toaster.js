import { useEffect, useState } from 'react';
import './toaster.css';

const TOAST_EVENT = 'batipro:toast';
let nextId = 1;

// Affiche une notification non bloquante : toast('Message', 'success' | 'error' | 'info')
export function toast(message, type = 'info') {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { id: nextId++, message, type } }));
}

// À placer une seule fois dans l'application (App.js)
export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = ({ detail }) => {
      setToasts((prev) => [...prev.slice(-3), detail]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== detail.id)), 3500);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
