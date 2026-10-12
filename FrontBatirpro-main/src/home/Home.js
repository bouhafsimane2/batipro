import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from "../components/navbar/navbar"
import { Footer } from "../components/footer/footer"
import { CardH } from "../components/home_card/card"
import ProductCard from "../components/productCard/ProductCard"
import { ArrowRightIcon } from "../components/icons/Icons"
import api from '../api/client';
import { fetchFavoriteIds } from '../api/cart';
import './home.css'
import page1_image from './image/9d4d3c6aadacab8c70857797a47d270f.jpg'
import Marketplace_image from './image/construction.png'
import Mains_ouvre_image from './image/machine-de-construction (1).png'
import Recrutement_image from './image/maison.png'
import aboutus_image from './image/i1-removebg-preview 1.png'
import offres_image from './image/offre_image.png'
import why_image from './image/2923fa2b219b9826ee3361474aaefb9a-removebg-preview.png'
import Advanced_Technology_img from './image/information-technology.png'
import Expert_Planning_img from './image/plan-daffaires.png'
import Quality_Results_img from './image/resultats.png'
import Trusted_Partnerships_img from './image/equipe.png'
import Skilled_Network_img from './image/gens.png'

const CATEGORY_TILES = [
    { to: '/marketplace', img: Marketplace_image, label: 'Marketplace', desc: 'Matériaux et équipements' },
    { to: '/profils', img: Mains_ouvre_image, label: "Main-d'œuvre", desc: 'Artisans qualifiés' },
    { to: '/recrutement', img: Recrutement_image, label: 'Recrutement', desc: 'Proposez vos services' },
];

const WHY_LEFT = [
    { img: Advanced_Technology_img, title: 'Technologie moderne', desc: 'Un accès simple aux meilleurs matériaux de construction.' },
    { img: Expert_Planning_img, title: 'Planification experte', desc: 'Des outils et ressources pour organiser votre projet.' },
    { img: Quality_Results_img, title: 'Résultats de qualité', desc: 'Nous ne proposons que le meilleur pour vos chantiers.' },
];

const WHY_RIGHT = [
    { img: Trusted_Partnerships_img, title: 'Partenaires de confiance', desc: 'Des fournisseurs et professionnels vérifiés.' },
    { img: Skilled_Network_img, title: 'Réseau qualifié', desc: 'Un réseau d’artisans compétents près de chez vous.' },
    { img: Advanced_Technology_img, title: 'Prix compétitifs', desc: 'Des tarifs justes et des options de livraison flexibles.' },
];

function WhyItem({ img, title, desc }) {
    return (
        <div className="why__item">
            <div className="why__icon"><img src={img} alt="" /></div>
            <div>
                <h3>{title}</h3>
                <p>{desc}</p>
            </div>
        </div>
    );
}

export default function Home() {
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [profs, setProfs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favoriteIds, setFavoriteIds] = useState(new Set());

    useEffect(() => {
        api.get('/home/products/')
            .then((res) => {
                setProducts(res.data.products);
                setProfs(res.data.professionals);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        fetchFavoriteIds().then(setFavoriteIds);
    }, []);

    // Lien vers une section (ex. /#about depuis le footer)
    useEffect(() => {
        if (!location.hash || loading) return;
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }, [location.hash, loading]);

    return(
        <div className="page home">
            <Navbar/>

            <section className="hero" style={{ backgroundImage: `url(${page1_image})` }}>
                <div className="hero__content container">
                    <p className="hero__eyebrow">Bienvenue sur Batipro</p>
                    <h1>La plateforme qui facilite <span>tous vos projets</span> de construction</h1>
                    <p className="hero__lead">
                        Matériaux de qualité, artisans qualifiés et services du bâtiment, réunis au même endroit.
                    </p>
                    <div className="hero__actions">
                        <Link to="/marketplace" className="btn">Explorer le marketplace</Link>
                        <Link to="/profils" className="btn btn-outline hero__btn-light">Trouver un artisan</Link>
                    </div>
                </div>
            </section>

            <div className="tiles container">
                {CATEGORY_TILES.map((t) => (
                    <Link key={t.to} to={t.to} className="tile">
                        <img src={t.img} alt="" />
                        <div>
                            <strong>{t.label}</strong>
                            <span>{t.desc}</span>
                        </div>
                        <ArrowRightIcon size={18} className="tile__arrow" />
                    </Link>
                ))}
            </div>

            <section id="about" className="home-section about container">
                <div className="about__text">
                    <h2 className="section-title section-title--left">À propos de <span>nous</span></h2>
                    <p>
                        Batipro est une plateforme dédiée au secteur de la construction en Algérie. Nous mettons
                        en relation les particuliers et les entreprises avec des matériaux de qualité et des
                        professionnels qualifiés.
                    </p>
                    <p>
                        Carrelage, plomberie, gros œuvre ou conseils d’architecte : nous simplifions l’accès à
                        des ressources de confiance grâce à un large catalogue et des options de livraison
                        pratiques. Chez Batipro, nous construisons ensemble une meilleure façon de bâtir.
                    </p>
                </div>
                <div className="about__img">
                    <img src={aboutus_image} alt="Ouvriers sur un chantier" />
                </div>
            </section>

            <section id="products" className="home-section container">
                <div className="section-head">
                    <h2 className="section-title">Nos <span>produits</span></h2>
                    <Link to="/marketplace" className="section-link">Voir tout <ArrowRightIcon size={16} /></Link>
                </div>
                <div className="card-grid">
                    {loading && <p className="empty-state">Chargement…</p>}
                    {!loading && products.length === 0 && <p className="empty-state">Aucun produit pour le moment.</p>}
                    {products.map((p) => (
                        <ProductCard
                            key={p.id_produit}
                            product_id={p.id_produit}
                            image={p.image_url}
                            description={p.description}
                            productName={p.nom}
                            price={p.prix}
                            category={p.categorie}
                            stock={p.quantite}
                            favorite={favoriteIds.has(p.id_produit)}
                        />
                    ))}
                </div>
            </section>

            <section id="offers" className="home-section offer-teaser container">
                <div className="offer-teaser__text">
                    <h2 className="section-title section-title--left">Nos <span>offres</span></h2>
                    <p>
                        Matériaux, location d’équipements, services d’artisans, conseil et entretien :
                        découvrez toutes nos offres pensées pour chaque étape de votre chantier, avec des
                        produits disponibles immédiatement.
                    </p>
                    <Link to="/offers" className="btn">Découvrir les offres</Link>
                </div>
                <div className="offer-teaser__img">
                    <img src={offres_image} alt="" />
                </div>
            </section>

            <section id="profiles" className="home-section container">
                <div className="section-head">
                    <h2 className="section-title">Nos <span>professionnels</span></h2>
                    <Link to="/profils" className="section-link">Voir tout <ArrowRightIcon size={16} /></Link>
                </div>
                <div className="card-grid">
                    {!loading && profs.length === 0 && <p className="empty-state">Aucun professionnel pour le moment.</p>}
                    {profs.map((card) => (
                        <CardH
                            key={card.id}
                            to={`/my_profils?id=${encodeURIComponent(card.id)}`}
                            imgSrc={card.image_url}
                            title={`${card.client.first_name} ${card.client.last_name}`}
                            subtitle={card.metiers.map((m) => m.nom_metier).join(' · ')}
                            description={card.description_experience}
                            rating={card.avis_moyenne}
                        />
                    ))}
                </div>
            </section>

            <section id="why-us" className="home-section why container">
                <p className="why__watermark" aria-hidden="true">Pourquoi Batipro ?</p>
                <h2 className="section-title">Qualité, innovation et <span>confiance</span></h2>
                <div className="why__grid">
                    <div className="why__col why__col--left">
                        {WHY_LEFT.map((item) => <WhyItem key={item.title} {...item} />)}
                    </div>
                    <div className="why__img">
                        <img src={why_image} alt="" />
                    </div>
                    <div className="why__col">
                        {WHY_RIGHT.map((item) => <WhyItem key={item.title} {...item} />)}
                    </div>
                </div>
            </section>

            <Footer/>
        </div>
    )
}
