import { Link } from 'react-router-dom'
import { Navbar } from '../components/navbar/navbar'
import { Footer } from '../components/footer/footer'

// Page affichée pour une adresse inconnue
export default function NotFound() {
    return (
        <div className="page">
            <Navbar />
            <main className="narrow">
                <div className="empty-state empty-state--box">
                    <p className="not-found__code">404</p>
                    <p><strong>Cette page n'existe pas.</strong></p>
                    <p>Le lien est peut-être erroné ou la page a été déplacée.</p>
                    <Link to="/" className="btn">Retour à l'accueil</Link>
                </div>
            </main>
            <Footer />
        </div>
    )
}
