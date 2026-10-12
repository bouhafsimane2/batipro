import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiError, isLoggedIn } from '../../api/client';
import { StarIcon } from '../icons/Icons';
import { toast } from '../toast/Toaster';
import './addreview.css';

const LABELS = ['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

// Formulaire pour noter un professionnel (1 à 5 étoiles + commentaire)
function Addreview({ prof_id, onAdded }) {
  const [note, setNote] = useState(0);
  const [hover, setHover] = useState(0);
  const [commentaire, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoggedIn()) {
    return (
      <div className='add-review surface add-review--guest'>
        <h3>Laisser un avis</h3>
        <p>Vous devez être connecté pour noter ce professionnel.</p>
        <Link to='/login' className='btn btn-block'>Se connecter</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentaire.trim() || note === 0) {
      toast('Choisissez une note et écrivez un commentaire.', 'info');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/professionals/${prof_id}/review/`, { commentaire, note });
      toast('Merci ! Votre avis a été publié.', 'success');
      setComment('');
      setNote(0);
      if (onAdded) onAdded();
    } catch (error) {
      toast(apiError(error, "Votre avis n'a pas pu être envoyé."), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shown = hover || note;

  return (
    <form className='add-review surface' onSubmit={handleSubmit}>
      <h3>Laisser un avis</h3>
      <div className='add-review__stars' role='radiogroup' aria-label='Note sur 5' onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type='button'
            role='radio'
            aria-checked={note === i}
            aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
            className={i <= shown ? 'is-on' : ''}
            onMouseEnter={() => setHover(i)}
            onClick={() => setNote(i)}
          >
            <StarIcon size={28} filled={i <= shown} />
          </button>
        ))}
        <span className='add-review__label'>{LABELS[shown]}</span>
      </div>
      <textarea
        className='input'
        placeholder='Partagez votre expérience…'
        value={commentaire}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
      />
      <button type='submit' className='btn btn-block' disabled={isSubmitting}>
        {isSubmitting ? 'Envoi…' : 'Publier mon avis'}
      </button>
    </form>
  );
}

export default Addreview;
