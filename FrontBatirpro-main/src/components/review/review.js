import React, { useState } from 'react'
import { Stars } from '../home_card/card'
import './review.css'

const PAGE = 3

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Liste des avis d'un professionnel (les 3 plus récents, puis « voir plus »)
function Review({ reviews }) {
  const [showAll, setShowAll] = useState(false)
  const elements = showAll ? reviews : reviews.slice(0, PAGE)

  if (reviews.length === 0) {
    return <div className='reviews surface reviews--empty'>Pas encore d'avis pour ce professionnel.</div>
  }

  return (
    <div className='reviews surface'>
      <ul>
        {elements.map((review) => {
          const name = `${review.client.first_name} ${review.client.last_name || ''}`.trim()
          return (
            <li key={review.id} className='review-item'>
              <div className='review-item__head'>
                <span className='review-item__avatar' aria-hidden='true'>{name.charAt(0).toUpperCase()}</span>
                <div>
                  <strong>{name}</strong>
                  <time>{formatDate(review.date_avis)}</time>
                </div>
                <Stars rating={review.note} size={15} />
              </div>
              <p>{review.commentaire}</p>
            </li>
          )
        })}
      </ul>
      {reviews.length > PAGE && (
        <button type='button' className='reviews__more' onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Voir moins' : `Voir les ${reviews.length} avis`}
        </button>
      )}
    </div>
  )
}

export default Review
