import Icon from '../common/Icon.jsx';
import { getCategoryBySlug } from '../../config/categories.js';
import { formatDate } from '../../utils/dates.js';

// Card da fila "para assistir / jogar". Clicar abre os detalhes da obra.
export default function QueueCard({ item, timeZone, onOpen }) {
  const category = getCategoryBySlug(item.categorySlug);
  const meta = [item.genre, item.releaseYear].filter(Boolean).join(' • ');

  return (
    <button
      type="button"
      className="queue-card"
      onClick={() => onOpen(item)}
      aria-label={`Abrir detalhes de ${item.title}`}
    >
      <span className="queue-cover">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt="" loading="lazy" />
        ) : (
          <span className="queue-cover-empty" aria-hidden="true">
            {item.title.charAt(0).toUpperCase()}
          </span>
        )}
      </span>

      <span className="queue-body">
        <span className="queue-top">
          <span className={`cat-badge cat-${item.categorySlug}`}>{category?.name ?? 'Obra'}</span>
          {category && <Icon name={category.icon} size={16} />}
        </span>
        <strong className="queue-title">{item.title}</strong>
        <span className="queue-meta">{meta || item.contentType || 'Sem detalhes'}</span>
        <span className="queue-foot">
          <Icon name="calendar" size={14} />
          Adicionado em {formatDate(item.addedAt, timeZone)}
        </span>
      </span>
    </button>
  );
}