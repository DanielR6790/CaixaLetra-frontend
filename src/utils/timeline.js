// Agrupa as obras por ano e mês da DATA DE ADIÇÃO ao catálogo
// (e não da data de lançamento), no fuso horário do usuário.
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function yearAndMonth(iso, timeZone) {
  const date = new Date(iso);
  const options = { year: 'numeric', month: 'numeric' };
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-US', { ...options, timeZone }).formatToParts(date);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  }
  return {
    year: Number(parts.find((part) => part.type === 'year').value),
    month: Number(parts.find((part) => part.type === 'month').value),
  };
}

// Retorna: [{ year, total, months: [{ month, items: [...] }] }]
// Anos e meses do mais recente para o mais antigo; obras também.
export function groupByYearMonth(items, timeZone) {
  const years = new Map();
  const sorted = [...items].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));

  for (const item of sorted) {
    const { year, month } = yearAndMonth(item.addedAt, timeZone);
    if (!years.has(year)) years.set(year, { year, total: 0, months: new Map() });
    const group = years.get(year);
    group.total += 1;
    if (!group.months.has(month)) group.months.set(month, { month, items: [] });
    group.months.get(month).items.push(item);
  }

  return [...years.values()]
    .sort((a, b) => b.year - a.year)
    .map((group) => ({
      year: group.year,
      total: group.total,
      months: [...group.months.values()].sort((a, b) => b.month - a.month),
    }));
}