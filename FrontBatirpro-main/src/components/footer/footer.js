import { Link } from 'react-router-dom'
import insta from './image/instagram (1).png'
import twitter from './image/twitter.png'
import facebook from './image/facebook.png'
import './footer.css'

export function Footer() {
    return(
        <footer className="site-footer">
            <div className="site-footer__inner">
                <div className="site-footer__brand">
                    <Link to="/" className="site-footer__name">Bati<span>pro</span></Link>
                    <p>
                        La plateforme du bâtiment en Algérie : matériaux de qualité,
                        artisans qualifiés et services pour tous vos projets de construction.
                    </p>
                    <div className="site-footer__social">
                        <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><img src={insta} alt="" /></a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><img src={twitter} alt="" /></a>
                        <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><img src={facebook} alt="" /></a>
                    </div>
                </div>

                <div className="site-footer__col">
                    <h2>Explorer</h2>
                    <ul>
                        <li><Link to="/marketplace">Marketplace</Link></li>
                        <li><Link to="/offers">Nos offres</Link></li>
                        <li><Link to="/profils">Professionnels</Link></li>
                    </ul>
                </div>

                <div className="site-footer__col">
                    <h2>Mon compte</h2>
                    <ul>
                        <li><Link to="/panier">Panier</Link></li>
                        <li><Link to="/favoris">Favoris</Link></li>
                        <li><Link to="/messages">Messages</Link></li>
                    </ul>
                </div>

                <div className="site-footer__col">
                    <h2>Batipro</h2>
                    <ul>
                        <li><Link to="/#about">À propos</Link></li>
                        <li><Link to="/recrutement">Rejoignez-nous</Link></li>
                        <li><a href="mailto:contact@batipro.dz">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div className="site-footer__bottom">
                © {new Date().getFullYear()} Batipro — Construisons ensemble.
            </div>
        </footer>
    )
}
