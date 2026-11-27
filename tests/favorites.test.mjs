// Testes automáticos do filtro de favoritos. Rode com:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyFilters, DEFAULT_FILTERS } from '../src/utils/catalogFilters.js';

const ITEMS = [
  { title: 'Alien', releaseYear: 1979, contentType: 'Filme', addedAt: '2026-01-01T00:00:00Z', review: null, isFavorite: true },
  { title: 'Matrix', releaseYear: 1999, contentType: 'Filme', addedAt: '2026-01-02T00:00:00Z', review: { rating: 10 }, isFavorite: false },
  { title: 'Zelda', releaseYear: 2017, contentType: 'Jogo', addedAt: '2026-01-03T00:00:00Z', review: null, isFavorite: true },
  // Obra sem o campo "isFavorite" (ex.: resposta de um servidor antigo): conta como não favorita
  { title: 'Sem campo', releaseYear: null, contentType: '', addedAt: '2026-01-04T00:00:00Z', review: null },
];

const titles = (list) => list.map((item) => item.title);
const base = { search: '', type: '', sortBy: 'title', dir: 'asc' };

test('por padrão os favoritos não filtram nada', () => {
  assert.equal(DEFAULT_FILTERS.favoritesOnly, false);
  assert.deepEqual(titles(applyFilters(ITEMS, base)), ['Alien', 'Matrix', 'Sem campo', 'Zelda']);
  assert.deepEqual(
    titles(applyFilters(ITEMS, { ...base, favoritesOnly: false })),
    ['Alien', 'Matrix', 'Sem campo', 'Zelda']
  );
});

test('"só favoritos" mostra apenas as obras marcadas', () => {
  assert.deepEqual(titles(applyFilters(ITEMS, { ...base, favoritesOnly: true })), ['Alien', 'Zelda']);
});

test('obra sem o campo isFavorite não aparece em "só favoritos"', () => {
  const shown = titles(applyFilters(ITEMS, { ...base, favoritesOnly: true }));
  assert.equal(shown.includes('Sem campo'), false);
});

test('favoritos combinam com busca por nome e com tipo', () => {
  assert.deepEqual(titles(applyFilters(ITEMS, { ...base, favoritesOnly: true, type: 'Filme' })), ['Alien']);
  assert.deepEqual(titles(applyFilters(ITEMS, { ...base, favoritesOnly: true, search: 'zel' })), ['Zelda']);
  assert.deepEqual(titles(applyFilters(ITEMS, { ...base, favoritesOnly: true, search: 'matrix' })), []);
});

test('favoritos respeitam a ordenação escolhida', () => {
  assert.deepEqual(
    titles(applyFilters(ITEMS, { ...base, favoritesOnly: true, sortBy: 'added_at', dir: 'desc' })),
    ['Zelda', 'Alien']
  );
});