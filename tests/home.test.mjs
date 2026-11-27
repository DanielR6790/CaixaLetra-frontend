// Testes automáticos das regras da página inicial. Rode com:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterByCategory,
  formatAverage,
  getMonthStats,
  getQueue,
  getRecentReviews,
  queueLabel,
  searchItems,
} from '../src/utils/homeData.js';

const item = (overrides) => ({
  id: overrides.title,
  categorySlug: 'filmes',
  status: 'para_consumir',
  addedAt: '2026-01-01T12:00:00Z',
  review: null,
  ...overrides,
});
const titles = (list) => list.map((entry) => entry.title);

test('a fila só tem o que ainda não foi consumido, do mais recente ao mais antigo', () => {
  const items = [
    item({ title: 'Antigo', addedAt: '2026-01-01T12:00:00Z' }),
    item({ title: 'Consumido', status: 'consumido', addedAt: '2026-01-05T12:00:00Z' }),
    item({ title: 'Novo', addedAt: '2026-01-03T12:00:00Z' }),
    item({ title: 'Avaliado', status: 'avaliado', addedAt: '2026-01-06T12:00:00Z' }),
  ];
  assert.deepEqual(titles(getQueue(items)), ['Novo', 'Antigo']);
});

test('as últimas avaliações vêm da mais recente para a mais antiga', () => {
  const items = [
    item({ title: 'A', review: { rating: 7, createdAt: '2026-02-01T12:00:00Z' } }),
    item({ title: 'Sem nota' }),
    item({ title: 'B', review: { rating: 9, createdAt: '2026-03-01T12:00:00Z' } }),
  ];
  assert.deepEqual(titles(getRecentReviews(items)), ['B', 'A']);
});

test('filtro por categoria: "all" mantém tudo', () => {
  const items = [item({ title: 'F' }), item({ title: 'J', categorySlug: 'jogos' })];
  assert.deepEqual(titles(filterByCategory(items, 'all')), ['F', 'J']);
  assert.deepEqual(titles(filterByCategory(items, 'jogos')), ['J']);
  assert.deepEqual(titles(filterByCategory(items, 'animes')), []);
});

test('estatísticas do mês respeitam o fuso horário do usuário', () => {
  const items = [
    item({
      title: 'A',
      addedAt: '2026-11-10T12:00:00Z',
      review: { rating: 8, createdAt: '2026-11-12T12:00:00Z' },
    }),
    // 02:00 de 1º/12 em UTC ainda é 30/11, às 23:00, em São Paulo
    item({
      title: 'B',
      addedAt: '2026-12-01T02:00:00Z',
      review: { rating: 10, createdAt: '2026-12-01T02:00:00Z' },
    }),
    item({ title: 'C', addedAt: '2026-10-31T12:00:00Z' }),
  ];
  const now = new Date('2026-11-15T12:00:00Z');

  const sp = getMonthStats(items, 'America/Sao_Paulo', now);
  assert.deepEqual(sp.period, { year: 2026, month: 11 });
  assert.equal(sp.added, 2);
  assert.equal(sp.rated, 2);
  assert.equal(sp.average, 9);

  const utc = getMonthStats(items, 'UTC', now);
  assert.equal(utc.added, 1);
  assert.equal(utc.rated, 1);
  assert.equal(utc.average, 8);
});

test('sem avaliações no mês, a média é nula; fuso inválido não quebra', () => {
  const stats = getMonthStats([item({ title: 'A' })], 'Nao/Existe', new Date('2026-11-15T12:00:00Z'));
  assert.equal(stats.average, null);
  assert.equal(stats.rated, 0);
});

test('a busca ignora acentos e maiúsculas', () => {
  const items = [item({ title: 'Pokémon' }), item({ title: 'Alien' })];
  assert.deepEqual(titles(searchItems(items, 'POKEMON')), ['Pokémon']);
  assert.deepEqual(titles(searchItems(items, 'pokémon')), ['Pokémon']);
  assert.deepEqual(searchItems(items, '   '), []);
});

test('na busca, quem começa com o termo vem primeiro, e há limite de resultados', () => {
  const items = [item({ title: 'Wars of Stars' }), item({ title: 'Star Wars' })];
  assert.deepEqual(titles(searchItems(items, 'star')), ['Star Wars', 'Wars of Stars']);
  assert.equal(searchItems(items, 'star', 1).length, 1);
});

test('textos formatados', () => {
  assert.equal(formatAverage(9), '9,0');
  assert.equal(formatAverage(7.5), '7,5');
  assert.equal(queueLabel(1), '1 item na sua fila');
  assert.equal(queueLabel(4), '4 itens na sua fila');
});