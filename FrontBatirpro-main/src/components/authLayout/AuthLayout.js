import { Link } from 'react-router-dom'
import background from './background.png'
import './authLayout.css'

// Mise en page des écrans de connexion, d'inscription et de candidature
export default function AuthLayout({ title, subtitle, children, footer, wide = false }) {
    return (
        <div className="auth">
            <aside className="auth__visual" style={{ backgroundImage: `url(${background})` }}>
                <Link to="/" className="auth__brand">Bati<span>pro</span></Link>
                <div className="auth__pitch">
                    <h2>Construisons ensemble.</h2>
                    <p>Matériaux, artisans qualifiés et services du bâtiment, réunis sur une seule plateforme.</p>
                </div>
            </aside>
            <main className="auth__panel">
                <Link to="/" className="auth__brand auth__brand--mobile">Bati<span>pro</span></Link>
                <div className={`auth__card ${wide ? 'auth__card--wide' : ''}`}>
                    <h1>{title}</h1>
                    {subtitle && <p className="auth__subtitle">{subtitle}</p>}
                    {children}
                </div>
                {footer && <div className="auth__footer">{footer}</div>}
            </main>
        </div>
    )
}
