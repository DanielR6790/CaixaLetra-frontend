// Filtros e ordenação do catálogo (feitos no navegador sobre a lista carregada).
export const SORT_OPTIONS = [
  { value: 'added_at', label: 'Data de adição' },
  { value: 'title', label: 'Nome' },
  { value: 'release_year', label: 'Ano de lançamento' },
  { value: 'rating', label: 'Nota' },
  { value: 'content_type', label: 'Tipo de conteúdo' },
];

// Direção sugerida ao escolher cada ordenação
export const DEFAULT_DIRECTION = {
  added_at: 'desc',
  title: 'asc',
  release_year: 'desc',
  rating: 'desc',
  content_type: 'asc',
};

export const DEFAULT_FILTERS = {
  search: '',
  type: '',
  sortBy: 'added_at',
  dir: 'desc',
  favoritesOnly: false,
};

const getters = {
  added_at: (item) => Date.parse(item.addedAt),
  title: (item) => item.title.toLowerCase(),
  release_year: (item) => item.releaseYear,
  rating: (item) => item.review?.rating ?? null,
  content_type: (item) => (item.contentType ?? '').toLowerCase() || null,
};

export function applyFilters(items, { search, type, sortBy, dir, favoritesOnly = false }) {
  const term = search.trim().toLowerCase();

  const filtered = items.filter(
    (item) =>
      (!term || item.title.toLowerCase().includes(term)) &&
      (!type || item.contentType === type) &&
      (!favoritesOnly || Boolean(item.isFavorite))
  );

  const getValue = getters[sortBy] ?? getters.added_at;
  const factor = dir === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    const x = getValue(a);
    const y = getValue(b);
    // Itens sem valor (ex.: sem nota) ficam sempre no fim
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    if (typeof x === 'string') return x.localeCompare(y, 'pt-BR') * factor;
    return (x - y) * factor;
  });
}