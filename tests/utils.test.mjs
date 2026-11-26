// Testes automáticos da lógica do frontend (sem banco e sem internet).
// Rode com:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readableTextColor } from '../src/utils/color.js';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validateConfirmPassword,
  hasErrors,
} from '../src/utils/validation.js';
import { formatDate, formatDateTime } from '../src/utils/dates.js';
import { groupByYearMonth } from '../src/utils/timeline.js';
import { applyFilters } from '../src/utils/catalogFilters.js';
import { getEdgeEndpoints } from '../src/utils/edgeGeometry.js';
import {
  elementToNode,
  fitImageSize,
  nodeToPayload,
  pickTextData,
} from '../src/utils/boardElements.js';

// ---------------------------------------------------------------- cores
test('texto automático: preto sobre fundo claro e branco sobre fundo escuro', () => {
  assert.equal(readableTextColor('#ffffff'), '#000000');
  assert.equal(readableTextColor('#ffff00'), '#000000');
  assert.equal(readableTextColor('#000000'), '#ffffff');
  assert.equal(readableTextColor('#0000ff'), '#ffffff');
});

test('cor inválida ou ausente volta para preto', () => {
  assert.equal(readableTextColor('abc'), '#000000');
  assert.equal(readableTextColor(null), '#000000');
});

// ----------------------------------------------------------- validações
test('e-mail', () => {
  assert.equal(validateEmail(''), 'Digite seu e-mail.');
  assert.notEqual(validateEmail('sem-arroba'), '');
  assert.notEqual(validateEmail('a@b'), '');
  assert.equal(validateEmail('  a@b.co  '), '');
});

test('nome de usuário: mesma regra do banco', () => {
  assert.notEqual(validateUsername(''), '');
  assert.notEqual(validateUsername('ab'), '');
  assert.notEqual(validateUsername('joao silva'), '');
  assert.notEqual(validateUsername('João'), '');
  assert.notEqual(validateUsername('a'.repeat(31)), '');
  assert.equal(validateUsername('ok_user1'), '');
});

test('senha', () => {
  assert.equal(validatePassword(''), 'Digite uma senha.');
  assert.equal(validatePassword('curta1'), 'A senha precisa ter ao menos 8 caracteres.');
  assert.equal(validatePassword('a1'.repeat(37)), 'A senha pode ter no máximo 72 caracteres.');
  assert.equal(validatePassword('somenteletras'), 'A senha precisa ter letras e números.');
  assert.equal(validatePassword('12345678'), 'A senha precisa ter letras e números.');
  assert.equal(validatePassword('Senha1234'), '');
});

test('confirmação de senha e hasErrors', () => {
  assert.equal(validateConfirmPassword('a', ''), 'Confirme sua senha.');
  assert.equal(validateConfirmPassword('a', 'b'), 'As senhas não são iguais.');
  assert.equal(validateConfirmPassword('a', 'a'), '');
  assert.equal(hasErrors({ a: '', b: '' }), false);
  assert.equal(hasErrors({ a: '', b: 'erro' }), true);
});

// ---------------------------------------------------------------- datas
test('data de adição respeita o fuso horário do usuário', () => {
  // 01:30 em UTC ainda é dia 3, às 22:30, em São Paulo
  const iso = '2026-12-04T01:30:00Z';
  assert.equal(formatDate(iso, 'America/Sao_Paulo'), '03/12/2026');
  assert.equal(formatDateTime(iso, 'America/Sao_Paulo'), '03/12/2026 às 22:30');
  assert.equal(formatDateTime(iso, 'UTC'), '04/12/2026 às 01:30');
});

test('datas inválidas ou vazias viram texto vazio; fuso inválido não quebra', () => {
  assert.equal(formatDate(null), '');
  assert.equal(formatDate(''), '');
  assert.equal(formatDate('lixo'), '');
  assert.match(formatDate('2026-12-03T15:00:00Z', 'Nao/Existe'), /^\d{2}\/\d{2}\/\d{4}$/);
});

// ------------------------------------------------------ ano e mês
test('agrupamento por ano e mês usa a data de ADIÇÃO e o fuso do usuário', () => {
  const items = [
    { id: 'a', addedAt: '2026-12-03T15:00:00Z' },
    { id: 'b', addedAt: '2026-11-10T12:00:00Z' },
    { id: 'c', addedAt: '2026-01-01T02:00:00Z' }, // 31/12/2025 às 23:00 em São Paulo
    { id: 'd', addedAt: '2026-12-20T10:00:00Z' },
  ];

  const sp = groupByYearMonth(items, 'America/Sao_Paulo');
  assert.deepEqual(sp.map((group) => group.year), [2026, 2025]);
  assert.equal(sp[0].total, 3);
  assert.deepEqual(sp[0].months.map((month) => month.month), [12, 11]);
  // dentro do mês, o mais recente vem primeiro
  assert.deepEqual(sp[0].months[0].items.map((item) => item.id), ['d', 'a']);
  assert.deepEqual(sp[1].months.map((month) => month.month), [12]);
  assert.equal(sp[1].months[0].items[0].id, 'c');

  // Em UTC, a mesma obra "c" cairia em janeiro de 2026
  const utc = groupByYearMonth(items, 'UTC');
  assert.deepEqual(utc.map((group) => group.year), [2026]);
  assert.deepEqual(utc[0].months.map((month) => month.month), [12, 11, 1]);
});

// ------------------------------------------------- filtros e ordenação
const CATALOG = [
  { title: 'Zelda', releaseYear: 2017, contentType: 'Jogo', addedAt: '2026-01-03T00:00:00Z', review: { rating: 9 } },
  { title: 'Alien', releaseYear: 1979, contentType: 'Filme', addedAt: '2026-01-01T00:00:00Z', review: null },
  { title: 'Matrix', releaseYear: 1999, contentType: 'Filme', addedAt: '2026-01-02T00:00:00Z', review: { rating: 10 } },
  { title: 'Sem ano', releaseYear: null, contentType: '', addedAt: '2026-01-04T00:00:00Z', review: { rating: 5 } },
];
const titles = (list) => list.map((item) => item.title);
const base = { search: '', type: '', sortBy: 'added_at', dir: 'desc' };

test('ordenação por data de adição, nome e ano', () => {
  assert.deepEqual(titles(applyFilters(CATALOG, base)), ['Sem ano', 'Zelda', 'Matrix', 'Alien']);
  assert.deepEqual(
    titles(applyFilters(CATALOG, { ...base, sortBy: 'title', dir: 'asc' })),
    ['Alien', 'Matrix', 'Sem ano', 'Zelda']
  );
  // quem não tem o dado (ano) fica sempre no fim
  assert.deepEqual(
    titles(applyFilters(CATALOG, { ...base, sortBy: 'release_year', dir: 'desc' })),
    ['Zelda', 'Matrix', 'Alien', 'Sem ano']
  );
});

test('ordenação por nota deixa os sem nota no fim, nos dois sentidos', () => {
  assert.deepEqual(
    titles(applyFilters(CATALOG, { ...base, sortBy: 'rating', dir: 'desc' })),
    ['Matrix', 'Zelda', 'Sem ano', 'Alien']
  );
  assert.deepEqual(
    titles(applyFilters(CATALOG, { ...base, sortBy: 'rating', dir: 'asc' })),
    ['Sem ano', 'Zelda', 'Matrix', 'Alien']
  );
});

test('filtros por nome, tipo e ordenação por tipo', () => {
  assert.deepEqual(titles(applyFilters(CATALOG, { ...base, search: 'MAT' })), ['Matrix']);
  assert.deepEqual(
    titles(applyFilters(CATALOG, { ...base, type: 'Filme', sortBy: 'title', dir: 'asc' })),
    ['Alien', 'Matrix']
  );
  assert.deepEqual(
    titles(applyFilters(CATALOG, { ...base, sortBy: 'content_type', dir: 'asc' })),
    ['Alien', 'Matrix', 'Zelda', 'Sem ano']
  );
});

// ------------------------------------------------------ setas do quadro
const box = (x, y) => ({
  measured: { width: 100, height: 100 },
  internals: { positionAbsolute: { x, y } },
});

test('a seta sai da borda de um elemento e chega na borda do outro', () => {
  assert.deepEqual(getEdgeEndpoints(box(0, 0), box(300, 0)), { sx: 100, sy: 50, tx: 300, ty: 50 });
  assert.deepEqual(getEdgeEndpoints(box(0, 0), box(0, 300)), { sx: 50, sy: 100, tx: 50, ty: 300 });
});

test('a seta espera os elementos serem medidos', () => {
  assert.equal(getEdgeEndpoints({}, box(0, 0)), null);
  assert.equal(getEdgeEndpoints(box(0, 0), undefined), null);
});

// ------------------------------------------------ elementos do quadro
test('tamanho inicial da imagem mantém a proporção', () => {
  assert.deepEqual(fitImageSize(1000, 500), { width: 420, height: 210 });
  assert.deepEqual(fitImageSize(100, 50), { width: 100, height: 50 });
  assert.deepEqual(fitImageSize(10, 10), { width: 40, height: 40 });
});

test('só os campos permitidos de uma caixa de texto vão para o banco', () => {
  const data = pickTextData({ text: 'oi', isNew: true, lixo: 1 });
  assert.equal('isNew' in data, false);
  assert.equal('lixo' in data, false);
  assert.deepEqual(data, {
    text: 'oi',
    fontSize: 18,
    color: null,
    background: null,
    align: 'left',
    bold: false,
    italic: false,
  });
});

test('elemento do banco -> nó do quadro -> elemento do banco', () => {
  const element = {
    id: '1',
    type: 'text',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    zIndex: 3,
    data: { text: 'oi' },
  };
  assert.deepEqual(nodeToPayload(elementToNode(element)), {
    id: '1',
    type: 'text',
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    zIndex: 3,
    data: { text: 'oi', fontSize: 18, color: null, background: null, align: 'left', bold: false, italic: false },
  });
});

test('imagem: só url e caminho do arquivo vão para o banco, e a posição é arredondada', () => {
  const node = {
    id: 'n',
    type: 'image',
    position: { x: 10.126, y: 20 },
    width: 100.004,
    height: 50,
    zIndex: 2,
    data: { url: 'https://x/y.png', storagePath: 'a/b.png', extra: 'descartado' },
  };
  const payload = nodeToPayload(node);
  assert.equal(payload.x, 10.13);
  assert.equal(payload.width, 100);
  assert.deepEqual(payload.data, { url: 'https://x/y.png', storagePath: 'a/b.png' });
});