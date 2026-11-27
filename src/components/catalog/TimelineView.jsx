import { useMemo, useState } from 'react';
import HeartIcon from '../common/HeartIcon.jsx';
import { getCategoryBySlug } from '../../config/categories.js';
import { formatDateTime } from '../../utils/dates.js';
import { STATUS_LABEL } from '../../utils/status.js';
import { groupByYearMonth, MONTH_NAMES } from '../../utils/timeline.js';

// Obras agrupadas por ANO e MÊS de adição ao catálogo.
// Escolha um ano e, se quiser, um mês específico.
export default function TimelineView({ items, timeZone, onOpen, showCategory = false }) {
  const years = useMemo(() => groupByYearMonth(items, timeZone), [items, timeZone]);
  const [yearChoice, setYearChoice] = useState(null);
  const [monthChoice, setMonthChoice] = useState(null);

  if (years.length === 0) return null;

  const year = years.find((group) => group.year === yearChoice) ?? years[0];
  const month = year.months.some((group) => group.month === monthChoice) ? monthChoice : null;
  const visibleMonths = month ? year.months.filter((group) => group.month === month) : year.months;

  return (
    <div className="timeline">
      <div className="chip-row" role="tablist" aria-label="Ano">
        {years.map((group) => (
          <button
            key={group.year}
            type="button"
            role="tab"
            aria-selected={group.year === year.year}
            className={group.year === year.year ? 'chip chip-active' : 'chip'}
            onClick={() => {
              setYearChoice(group.year);
              setMonthChoice(null);
            }}
          >
            {group.year} <span className="chip-count">{group.total}</span>
          </button>
        ))}
      </div>

      <div className="chip-row" aria-label="Mês">
        <button
          type="button"
          className={month === null ? 'chip chip-active' : 'chip'}
          onClick={() => setMonthChoice(null)}
        >
          Todos os meses
        </button>
        {year.months.map((group) => (
          <button
            key={group.month}
            type="button"
            className={group.month === month ? 'chip chip-active' : 'chip'}
            onClick={() => setMonthChoice(group.month)}
          >
            {MONTH_NAMES[group.month - 1]} <span className="chip-count">{group.items.length}</span>
          </button>
        ))}
      </div>

      {visibleMonths.map((group) => (
        <section key={`${year.year}-${group.month}`} className="tl-month">
          <h2 className="tl-month-title">
            {MONTH_NAMES[group.month - 1]} de {year.year}
          </h2>
          <ul className="tl-list">
            {group.items.map((item) => {
              const categoryName = getCategoryBySlug(item.categorySlug)?.name;
              const meta = [showCategory ? categoryName : null, item.releaseYear, item.contentType]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={item.id}>
                  <button type="button" className="tl-row" onClick={() => onOpen(item)}>
                    {item.coverUrl ? (
                      <img src={item.coverUrl} alt="" loading="lazy" />
                    ) : (
                      <span className="tl-placeholder" aria-hidden="true" />
                    )}
                    <span className="tl-text">
                      <strong>
                        {item.isFavorite && (
                          <HeartIcon filled size={14} className="tl-fav" label="Favorito" />
                        )}
                        {item.title}
                      </strong>
                      <span className="muted">{meta || 'Sem detalhes'}</span>
                    </span>
                    <span className="tl-side">
                      <span className="tl-date">
                        Adicionado em {formatDateTime(item.addedAt, timeZone)}
                      </span>
                      {item.review ? (
                        <span className="status-chip status-avaliado">
                          Nota {item.review.rating}/10
                        </span>
                      ) : (
                        <span className={`status-chip status-${item.status}`}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}