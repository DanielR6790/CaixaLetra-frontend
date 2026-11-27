import Icon from '../common/Icon.jsx';
import HeartIcon from '../common/HeartIcon.jsx';
import { formatDate } from '../../utils/dates.js';
import { STATUS_LABEL } from '../../utils/status.js';

// Card de uma obra: capa, título, ano, tipo, nota, review e data de adição.
// Clicar na capa ou no título abre a página da obra.
export default function ContentCard({
  item,
  timeZone,
  showCheckbox,
  showStatus,
  showReview,
  onOpen,
  onToggle,
  onToggleFavorite,
  onRemove,
}) {
  const meta = [item.releaseYear, item.contentType].filter(Boolean).join(' · ');
  const favorite = Boolean(item.isFavorite);

  return (
    <article className="media-card">
      <div className="media-cover">
        <button
          type="button"
          className="media-open"
          onClick={() => onOpen(item)}
          aria-label={`Abrir detalhes de ${item.title}`}
        >
          {item.coverUrl ? (
            <img src={item.coverUrl} alt={`Capa de ${item.title}`} loading="lazy" />
          ) : (
            <span className="media-cover-empty" aria-hidden="true">
              {item.title.charAt(0).toUpperCase()}
            </span>
          )}
        </button>

        {item.review && (
          <span className="rating-badge" title="Sua nota">
            {item.review.rating}
            <small>/10</small>
          </span>
        )}

        <button
          type="button"
          className="media-remove"
          onClick={() => onRemove(item)}
          aria-label={`Remover ${item.title}`}
          title="Remover do catálogo"
        >
          <Icon name="close" size={16} />
        </button>

        <button
          type="button"
          className={favorite ? 'media-fav media-fav-active' : 'media-fav'}
          onClick={() => onToggleFavorite(item)}
          aria-pressed={favorite}
          aria-label={
            favorite
              ? `Remover ${item.title} dos favoritos`
              : `Adicionar ${item.title} aos favoritos`
          }
          title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <HeartIcon filled={favorite} size={16} />
        </button>
      </div>

      <div className="media-info">
        <h3 title={item.title}>
          <button type="button" className="media-title-btn" onClick={() => onOpen(item)}>
            {item.title}
          </button>
        </h3>
        <p className="muted">{meta || 'Sem detalhes'}</p>
        <p className="media-date">Adicionado em {formatDate(item.addedAt, timeZone)}</p>

        {showReview && item.review?.reviewText && (
          <p className="media-review">{item.review.reviewText}</p>
        )}

        {showStatus && (
          <span className={`status-chip status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
        )}

        {showCheckbox && (
          <label className="check">
            <input
              type="checkbox"
              checked={item.status === 'consumido'}
              onChange={() => onToggle(item)}
            />
            Marcar como consumido
          </label>
        )}
      </div>
    </article>
  );
}