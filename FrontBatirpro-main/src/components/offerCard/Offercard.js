import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_LABELS } from '../../api/categories'
import { ArrowRightIcon } from '../icons/Icons'
import fab from './images/customer-support (1) 2.png'
import './offercard.css'


// Carte d'offre : ouvre le marketplace filtré sur la catégorie de l'offre
export default function Offercard({title, desc, image, categorie, nbProduits}) {
  const to = categorie ? `/marketplace?category=${encodeURIComponent(categorie)}` : '/marketplace'

  return (
    <Link to={to} className='offer-card'>
        <div className='offer-card__icon'>
            <img src={image || fab} alt='' />
        </div>
        {categorie && <span className='offer-card__cat'>{CATEGORY_LABELS[categorie] || categorie}</span>}
        <h3 className='offer-card__title'>{title}</h3>
        <p className='offer-card__desc'>{desc}</p>
        <div className='offer-card__footer'>
            {nbProduits !== undefined && (
                <span>{nbProduits} produit{nbProduits > 1 ? 's' : ''} disponible{nbProduits > 1 ? 's' : ''}</span>
            )}
            <ArrowRightIcon size={18} />
        </div>
    </Link>
  )
}
