import { SORT_OPTIONS, DEFAULT_DIRECTION } from '../../utils/catalogFilters.js';

// Barra de filtros: nome, tipo e ordenação.
export default function CatalogToolbar({ filters, onChange, types }) {
  const set = (patch) => onChange({ ...filters, ...patch });

  return (
    <div className="toolbar">
      <input
        type="search"
        value={filters.search}
        onChange={(event) => set({ search: event.target.value })}
        placeholder="Filtrar por nome…"
        aria-label="Filtrar por nome"
      />

      <select
        value={filters.type}
        onChange={(event) => set({ type: event.target.value })}
        aria-label="Filtrar por tipo de conteúdo"
      >
        <option value="">Todos os tipos</option>
        {types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <select
        value={filters.sortBy}
        onChange={(event) =>
          set({ sortBy: event.target.value, dir: DEFAULT_DIRECTION[event.target.value] })
        }
        aria-label="Ordenar por"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Ordenar: {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => set({ dir: filters.dir === 'asc' ? 'desc' : 'asc' })}
        aria-label="Inverter a ordem"
      >
        {filters.dir === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
      </button>
    </div>
  );
}