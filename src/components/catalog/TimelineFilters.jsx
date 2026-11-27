import { categories, getCategoryBySlug } from '../../config/categories.js';

// Filtros da linha do tempo: categoria e situação (avaliados / lista / todos).
// Os números mostram quantas obras há em cada opção, dentro do OUTRO filtro escolhido.
export default function TimelineFilters({
  category,
  status,
  categoryCounts,
  statusCounts,
  onCategoryChange,
  onStatusChange,
  onClear,
  hasFilters,
}) {
  // Com uma categoria escolhida, a lista usa o nome dela ("Lista para jogar", etc.)
  const listLabel = getCategoryBySlug(category)?.futureTitle ?? 'Para assistir/jogar';

  const categoryOptions = [
    { id: 'all', label: 'Todas' },
    ...categories.map((item) => ({ id: item.slug, label: item.name })),
  ];

  const statusOptions = [
    { id: 'todos', label: 'Todos' },
    { id: 'avaliados', label: 'Avaliados' },
    { id: 'lista', label: listLabel },
  ];

  return (
    <div className="tl-filters">
      <div className="tl-filter-group" role="group" aria-label="Filtrar por categoria">
        <span className="tl-filter-label">Categoria</span>
        {categoryOptions.map((option) => {
          const count = categoryCounts[option.id] ?? 0;
          const active = option.id === category;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              className={[
                'chip',
                active ? 'chip-active' : '',
                count === 0 && !active ? 'chip-empty' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onCategoryChange(option.id)}
            >
              {option.label} <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="tl-filter-group" role="group" aria-label="Filtrar por situação">
        <span className="tl-filter-label">Situação</span>
        {statusOptions.map((option) => {
          const count = statusCounts[option.id] ?? 0;
          const active = option.id === status;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              className={[
                'chip',
                active ? 'chip-active' : '',
                count === 0 && !active ? 'chip-empty' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onStatusChange(option.id)}
            >
              {option.label} <span className="chip-count">{count}</span>
            </button>
          );
        })}

        {hasFilters && (
          <button type="button" className="tl-filter-clear" onClick={onClear}>
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}