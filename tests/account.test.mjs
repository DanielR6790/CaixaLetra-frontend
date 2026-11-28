// Testes automáticos das regras de cores, fusos, exportação e CSV. Rode com:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contrastRatio,
  normalizeHex,
  readableTextColor,
  shadeHex,
} from '../src/utils/color.js';
import { resolveAccent } from '../src/utils/themeColors.js';
import { buildCatalogCsv, csvCell, exportFilename } from '../src/utils/exportData.js';
import { isValidTimeZone, listTimeZones, timeZoneLabel } from '../src/utils/timezones.js';

const BRAND = { accent: '#3ddc97', accentHover: '#2fbf82', accentText: '#04130c' };

// ------------------------------------------------------------- cores
test('normalizeHex aceita #RRGGBB, RRGGBB e o formato curto', () => {
  assert.equal(normalizeHex('#10B981'), '#10b981');
  assert.equal(normalizeHex('10b981'), '#10b981');
  assert.equal(normalizeHex('  #1B8 '), '#11bb88');
  assert.equal(normalizeHex('abc'), '#aabbcc');
});

test('normalizeHex recusa códigos inválidos', () => {
  for (const value of ['', 'xyz', '#12345', '#1234567', '#gggggg', null, undefined]) {
    assert.equal(normalizeHex(value), null, `deveria recusar ${String(value)}`);
  }
});

test('contraste: preto contra branco é 21; cores iguais dão 1', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01);
  assert.ok(Math.abs(contrastRatio('#336699', '#336699') - 1) < 0.001);
});

test('shadeHex clareia e escurece', () => {
  assert.equal(shadeHex('#000000', 0.5), '#808080');
  assert.equal(shadeHex('#ffffff', -0.5), '#808080');
  assert.equal(shadeHex('#336699', 0), '#336699');
  assert.equal(shadeHex('invalida', 0.5), 'invalida');
});

test('o texto sobre a cor de destaque é sempre legível', () => {
  assert.equal(readableTextColor('#ffffff'), '#000000');
  assert.equal(readableTextColor('#000000'), '#ffffff');
  assert.equal(readableTextColor('#10b981'), '#000000');
  assert.equal(readableTextColor('#1e3a8a'), '#ffffff');
});

test('cor de destaque: sem escolha, vale a do tema', () => {
  assert.deepEqual(resolveAccent('dark', null, BRAND), {
    accent: '#3ddc97',
    hover: '#2fbf82',
    text: '#04130c',
  });
  assert.deepEqual(resolveAccent('light', null, BRAND).accent, '#3ddc97');
  assert.deepEqual(resolveAccent('slate', null, BRAND), {
    accent: '#10b981',
    hover: '#059669',
    text: '#022c22',
  });
});

test('cor de destaque personalizada vale em qualquer tema, com texto e hover coerentes', () => {
  const light = resolveAccent('dark', '#FFFF00', BRAND);
  assert.equal(light.accent, '#ffff00');
  assert.equal(light.text, '#000000');
  assert.notEqual(light.hover, light.accent);

  const dark = resolveAccent('slate', '#1e3a8a', BRAND);
  assert.equal(dark.accent, '#1e3a8a');
  assert.equal(dark.text, '#ffffff');
});

test('cor personalizada inválida cai para a cor do tema', () => {
  assert.equal(resolveAccent('dark', 'banana', BRAND).accent, '#3ddc97');
});

// ------------------------------------------------------------- fusos
test('validação de fuso horário', () => {
  assert.equal(isValidTimeZone('America/Sao_Paulo'), true);
  assert.equal(isValidTimeZone('UTC'), true);
  assert.equal(isValidTimeZone('Nao/Existe'), false);
});

test('lista de fusos: Brasil à parte, sem repetição, com os fusos extras', () => {
  const { brazil, others } = listTimeZones(['Asia/Tokyo', 'Nao/Existe']);
  assert.ok(brazil.includes('America/Sao_Paulo'));
  assert.ok(others.includes('UTC'));
  assert.ok(others.includes('Asia/Tokyo'));
  assert.equal(others.includes('Nao/Existe'), false);
  assert.equal(brazil.filter((zone) => others.includes(zone)).length, 0);
  assert.equal(new Set(others).size, others.length);
});

test('rótulo do fuso mostra o nome e o deslocamento', () => {
  const label = timeZoneLabel('America/Sao_Paulo', new Date('2026-11-27T12:00:00Z'));
  assert.ok(label.includes('Sao Paulo'));
  assert.ok(label.includes('GMT-3'));
});

// --------------------------------------------------------------- CSV
test('csvCell: aspas, separador e quebras de linha', () => {
  assert.equal(csvCell('simples'), 'simples');
  assert.equal(csvCell('a;b'), '"a;b"');
  assert.equal(csvCell('ele disse "oi"'), '"ele disse ""oi"""');
  assert.equal(csvCell('linha 1\nlinha 2'), '"linha 1\nlinha 2"');
  assert.equal(csvCell('a,b', ','), '"a,b"');
});

test('csvCell: vazios, números e booleanos', () => {
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(undefined), '');
  assert.equal(csvCell(9), '9');
  assert.equal(csvCell(-5), '-5');
  assert.equal(csvCell(true), 'Sim');
  assert.equal(csvCell(false), 'Não');
});

test('csvCell: textos que a planilha leria como fórmula ganham um apóstrofo', () => {
  assert.equal(csvCell('=SOMA(A1:A2)'), "'=SOMA(A1:A2)");
  assert.equal(csvCell('+55 85'), "'+55 85");
  assert.equal(csvCell('-cuidado'), "'-cuidado");
  assert.equal(csvCell('@fulano'), "'@fulano");
});

test('o CSV do catálogo tem BOM, cabeçalho, uma linha por obra e quebras CRLF', () => {
  const catalog = [
    {
      category: 'filmes',
      title: 'Matrix',
      releaseYear: 1999,
      genre: 'Ação',
      contentType: 'Filme',
      status: 'avaliado',
      favorite: true,
      addedAt: '2026-01-02T12:00:00Z',
      consumedAt: null,
      source: 'cinemeta',
      externalId: 'tt0133093',
      description: 'Um hacker; e "a realidade"',
      coverUrl: null,
      review: { rating: 10, text: 'Obra-prima' },
    },
    {
      category: 'outros',
      title: '=CUIDADO()',
      releaseYear: null,
      genre: null,
      contentType: 'Livro',
      status: 'para_consumir',
      favorite: false,
      addedAt: '2026-01-03T12:00:00Z',
      consumedAt: null,
      source: 'manual',
      externalId: null,
      description: null,
      coverUrl: null,
      review: null,
    },
  ];

  const csv = buildCatalogCsv(catalog);
  assert.ok(csv.startsWith('\uFEFFCategoria;Título;Ano de lançamento;'));
  assert.ok(csv.endsWith('\r\n'));

  const lines = csv.trimEnd().split('\r\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[1].startsWith('Filmes;Matrix;1999;Ação;Filme;Avaliado;Sim;10;Obra-prima;'));
  assert.ok(lines[1].includes('"Um hacker; e ""a realidade"""'));
  assert.ok(lines[2].startsWith("Outros;'=CUIDADO();;;Livro;Na lista;Não;;;"));
});

test('nome do arquivo exportado usa a data local', () => {
  const date = new Date(2026, 10, 27, 15, 30);
  assert.equal(exportFilename('json', 'meus-dados', date), 'meus-dados-2026-11-27.json');
  assert.equal(exportFilename('csv', 'catalogo', date), 'catalogo-2026-11-27.csv');
});