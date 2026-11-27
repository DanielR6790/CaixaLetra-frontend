import Icon from '../common/Icon.jsx';
import Stars from './Stars.jsx';
import { getCategoryBySlug } from '../../config/categories.js';
import { formatDate } from '../../utils/dates.js';

// Uma avaliação recente: capa, título, estrelas, nota, data e trecho da review.
export default function ReviewRow({ item, timeZone, onOpen }) {
  const category = getCategoryBySlug(item.categorySlug);
  const { review } = item;

  return (
    <button
      type="button"
      className="review-row"
      onClick={() => onOpen(item)}
      aria-label={`Abrir detalhes de ${item.title}`}
    >
      <span className="review-cover">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt="" loading="lazy" />
        ) : (
          <span className="queue-cover-empty" aria-hidden="true">
            {item.title.charAt(0).toUpperCase()}
          </span>
        )}
      </span>

      <span className="review-main">
        <span className="review-top">
          <strong className="review-title">
            {item.title}
            {item.releaseYear && <span className="muted"> ({item.releaseYear})</span>}
          </strong>
          <span className="review-date">
            <Icon name="calendar" size={13} />
            {formatDate(review.createdAt, timeZone)}
          </span>
        </span>

        <span className="review-score">
          <Stars rating={review.rating} />
          <span className="review-score-text">{review.rating}/10</span>
          {category && (
            <span className={`cat-badge cat-${item.categorySlug}`}>{category.name}</span>
          )}
        </span>

        {review.reviewText && <span className="review-quote">“{review.reviewText}”</span>}
      </span>
    </button>
  );
}