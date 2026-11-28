// Montagem do arquivo CSV do catálogo (e do nome dos arquivos baixados).
import { getCategoryBySlug } from '../config/categories.js';
import { STATUS_LABEL } from './status.js';

// Planilhas executam textos que começam com = + - @ como fórmula. Um apóstrofo na frente evita isso.
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value, delimiter = ';') {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';

  let text = String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  if (/["\r\n]/.test(text) || text.includes(delimiter)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

const COLUMNS = [
  ['Categoria', (e) => getCategoryBySlug(e.category)?.name ?? e.category],
  ['Título', (e) => e.title],
  ['Ano de lançamento', (e) => e.releaseYear],
  ['Gênero', (e) => e.genre],
  ['Tipo', (e) => e.contentType],
  ['Situação', (e) => STATUS_LABEL[e.status] ?? e.status],
  ['Favorito', (e) => e.favorite],
  ['Nota', (e) => e.review?.rating],
  ['Review', (e) => e.review?.text],
  ['Adicionado em', (e) => e.addedAt],
  ['Consumido em', (e) => e.consumedAt],
  ['Origem', (e) => e.source],
  ['ID externo', (e) => e.externalId],
  ['Descrição', (e) => e.description],
  ['Capa', (e) => e.coverUrl],
];

// Ponto e vírgula e BOM: o Excel em português abre com as colunas e os acentos certos.
// O Google Planilhas reconhece sozinho.
export function buildCatalogCsv(catalog, delimiter = ';') {
  const header = COLUMNS.map(([label]) => csvCell(label, delimiter)).join(delimiter);
  const rows = catalog.map((entry) =>
    COLUMNS.map(([, read]) => csvCell(read(entry), delimiter)).join(delimiter)
  );
  return `\uFEFF${[header, ...rows].join('\r\n')}\r\n`;
}

// Ex.: meus-dados-2026-11-27.json (data do computador)
export function exportFilename(extension, prefix = 'meus-dados', now = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${prefix}-${date}.${extension}`;
}