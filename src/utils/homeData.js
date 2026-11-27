// Regras da página inicial (funções puras, sem React): fila, últimas avaliações,
// estatísticas do mês e busca. Ficam aqui para poderem ser testadas.
export const QUEUE_LIMIT = 6;
export const REVIEW_LIMIT = 4;
export const PROJECT_LIMIT = 3;
export const SEARCH_LIMIT = 6;

const time = (iso) => {
  const value = Date.parse(iso);
  return Number.isNaN(value) ? 0 : value;
};

export function filterByCategory(items, slug) {
  return slug === 'all' ? items : items.filter((item) => item.categorySlug === slug);
}

// Fila: o que ainda não foi consumido nem avaliado, do mais recente para o mais antigo
export function getQueue(items) {
  return items
    .filter((item) => item.status === 'para_consumir')
    .sort((a, b) => time(b.addedAt) - time(a.addedAt));
}

// Obras avaliadas, da avaliação mais recente para a mais antiga
export function getRecentReviews(items) {
  return items
    .filter((item) => item.review)
    .sort((a, b) => time(b.review.createdAt) - time(a.review.createdAt));
}

// Ano e mês de uma data no fuso horário do usuário (null se a data for inválida)
function yearAndMonth(iso, timeZone) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const options = { year: 'numeric', month: 'numeric' };
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', { ...options, timeZone }).formatToParts(date);
  } catch {
    // fuso inválido: usa o do navegador
    parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  }
  return {
    year: Number(parts.find((part) => part.type === 'year').value),
    month: Number(parts.find((part) => part.type === 'month').value),
  };
}

// Estatísticas do mês atual:
//   added   = obras adicionadas ao catálogo neste mês
//   rated   = avaliações feitas neste mês
//   average = média dessas notas (null se não houve nenhuma)
export function getMonthStats(items, timeZone, now = new Date()) {
  const period = yearAndMonth(now.toISOString(), timeZone);
  const inPeriod = (iso) => {
    const value = yearAndMonth(iso, timeZone);
    return Boolean(value) && value.year === period.year && value.month === period.month;
  };

  const added = items.filter((item) => inPeriod(item.addedAt)).length;
  const ratings = items
    .filter((item) => item.review && inPeriod(item.review.createdAt))
    .map((item) => item.review.rating);
  const average = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : null;

  return { added, rated: ratings.length, average, period };
}

// Busca por título, sem diferenciar maiúsculas nem acentos.
// Quem começa com o termo vem primeiro.
const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function searchItems(items, term, limit = SEARCH_LIMIT) {
  const wanted = normalize(term);
  if (!wanted) return [];

  return items
    .filter((item) => normalize(item.title).includes(wanted))
    .sort((a, b) => {
      const aStarts = normalize(a.title).startsWith(wanted) ? 0 : 1;
      const bStarts = normalize(b.title).startsWith(wanted) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.title.localeCompare(b.title, 'pt-BR');
    })
    .slice(0, limit);
}

export const formatAverage = (value) => value.toFixed(1).replace('.', ',');
export const queueLabel = (count) => `${count} ${count === 1 ? 'item' : 'itens'} na sua fila`;