import { Link } from 'react-router-dom'
import defaultPhoto from './image/5b8d8c75254d0c3a1bee5db241af2a89.jpg'
import { MapPinIcon, StarIcon } from '../icons/Icons'
import './card.css'

export function Stars({ rating = 0, size = 15 }) {
    const rounded = Math.round(Number(rating) || 0)
    return (
        <span className="stars" aria-label={`Note : ${Number(rating || 0).toFixed(1)} sur 5`}>
            {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} size={size} filled={i <= rounded} />)}
        </span>
    )
}

// Carte d'un professionnel (accueil et liste des professionnels)
export function CardH({ to, imgSrc, title, subtitle, description, rating, location, reviews }) {
    return (
        <Link to={to} className="pro-card">
            <div className="pro-card__top">
                <img src={imgSrc || defaultPhoto} alt="" loading="lazy" />
            </div>
            <div className="pro-card__body">
                <h3>{title}</h3>
                {subtitle && <p className="pro-card__subtitle">{subtitle}</p>}
                {rating !== undefined && (
                    <div className="pro-card__rating">
                        <Stars rating={rating} />
                        <span>{Number(rating || 0).toFixed(1)}{reviews !== undefined && ` (${reviews})`}</span>
                    </div>
                )}
                {description && <p className="pro-card__desc">{description}</p>}
                {location && (
                    <p className="pro-card__location"><MapPinIcon size={15} /> {location}</p>
                )}
                <span className="pro-card__cta">Voir le profil</span>
            </div>
        </Link>
    );
}
