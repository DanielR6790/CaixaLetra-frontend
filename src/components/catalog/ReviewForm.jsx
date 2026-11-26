import { useState } from 'react';
import TextArea from '../common/TextArea.jsx';
import RatingPicker from './RatingPicker.jsx';

// Formulário de avaliação: nota obrigatória (1 a 10) e review opcional.
export default function ReviewForm({
  initialRating,
  initialText,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}) {
  const [rating, setRating] = useState(initialRating ?? null);
  const [text, setText] = useState(initialText ?? '');
  const [ratingError, setRatingError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!rating) {
      setRatingError('Escolha uma nota de 1 a 10.');
      return;
    }
    setRatingError('');
    onSubmit({ rating, reviewText: text.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <RatingPicker
        value={rating}
        onChange={(value) => {
          setRating(value);
          setRatingError('');
        }}
        error={ratingError}
        disabled={submitting}
      />
      <TextArea
        id="review-text"
        label="Review (opcional)"
        value={text}
        onChange={setText}
        maxLength={20000}
        rows={5}
        disabled={submitting}
      />
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Salvando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}