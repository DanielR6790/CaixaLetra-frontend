// Testes automáticos do histórico (desfazer) e das cópias do quadro. Rode com:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneElements,
  diffSnapshots,
  groupBounds,
  isEmptyDiff,
  payloadEqual,
  takeSnapshot,
} from '../src/utils/boardHistory.js';

const node = (id, x, y, extra = {}) => ({
  id,
  type: 'text',
  position: { x, y },
  width: 100,
  height: 50,
  zIndex: 0,
  data: { text: id },
  ...extra,
});
const edge = (id, source, target) => ({ id, source, target, type: 'floating' });

test('o retrato guarda só o que vai para o banco', () => {
  const snapshot = takeSnapshot(
    [node('a', 10.126, 20, { selected: true, measured: { width: 1, height: 1 }, data: { text: 'oi', isNew: true } })],
    [edge('e1', 'a', 'b')]
  );
  assert.equal(snapshot.nodes[0].x, 10.13);
  assert.equal('selected' in snapshot.nodes[0], false);
  assert.equal('isNew' in snapshot.nodes[0].data, false);
  assert.deepEqual(snapshot.edges, [{ id: 'e1', source: 'a', target: 'b' }]);
});

test('diferenças: criar, apagar, mover e editar texto', () => {
  const before = takeSnapshot([node('a', 0, 0), node('b', 10, 10)], [edge('e1', 'a', 'b')]);
  const after = takeSnapshot([node('a', 5, 0), node('c', 0, 0)], []);
  assert.deepEqual(diffSnapshots(before, after), {
    removeNodes: ['b'],
    upsertNodes: ['a', 'c'],
    removeEdges: ['e1'],
    upsertEdges: [],
  });

  const edited = takeSnapshot([node('a', 0, 0, { data: { text: 'novo texto' } }), node('b', 10, 10)], [
    edge('e1', 'a', 'b'),
  ]);
  assert.deepEqual(diffSnapshots(before, edited).upsertNodes, ['a']);
});

test('desfazer e refazer são o inverso um do outro', () => {
  const first = takeSnapshot([node('a', 0, 0)], []);
  const second = takeSnapshot([node('a', 0, 0), node('b', 5, 5)], [edge('e1', 'a', 'b')]);

  const forward = diffSnapshots(first, second);
  assert.deepEqual(forward.upsertNodes, ['b']);
  assert.deepEqual(forward.upsertEdges, ['e1']);

  const backward = diffSnapshots(second, first);
  assert.deepEqual(backward.removeNodes, ['b']);
  assert.deepEqual(backward.removeEdges, ['e1']);
});

test('só mudar a ordem da lista, ou selecionar, não conta como alteração', () => {
  const one = takeSnapshot([node('a', 0, 0), node('b', 1, 1)], []);
  const two = takeSnapshot([node('b', 1, 1, { selected: true }), node('a', 0, 0)], []);
  assert.equal(isEmptyDiff(diffSnapshots(one, two)), true);
});

test('comparação de elementos: texto e imagem', () => {
  const text = { id: 't', type: 'text', x: 0, y: 0, width: 1, height: 1, zIndex: 0, data: { text: 'a', bold: false } };
  assert.equal(payloadEqual(text, { ...text, data: { text: 'a', bold: false } }), true);
  assert.equal(payloadEqual(text, { ...text, data: { text: 'a', bold: true } }), false);
  assert.equal(payloadEqual(text, { ...text, zIndex: 1 }), false);
  assert.equal(payloadEqual(text, { ...text, type: 'image' }), false);

  const image = { ...text, type: 'image', data: { url: 'https://x/y.png', storagePath: 'u/f.png' } };
  assert.equal(payloadEqual(image, { ...image, data: { ...image.data } }), true);
  assert.equal(payloadEqual(image, { ...image, data: { ...image.data, storagePath: 'u/g.png' } }), false);
});

test('retângulo que envolve um grupo', () => {
  const bounds = groupBounds([
    { x: 0, y: 0, width: 100, height: 50 },
    { x: 200, y: 100, width: 50, height: 50 },
  ]);
  assert.deepEqual(bounds, { x: 0, y: 0, width: 250, height: 150 });
});

const payload = (id, zIndex, extra = {}) => ({
  id,
  type: 'text',
  x: 0,
  y: 0,
  width: 100,
  height: 50,
  zIndex,
  data: { text: id },
  ...extra,
});

test('cópias: IDs novos, deslocamento, por cima dos demais e mantendo a ordem', () => {
  let counter = 0;
  const makeId = () => `novo-${++counter}`;

  const result = cloneElements({
    nodes: [payload('a', 5), payload('b', 2)],
    edges: [
      { source: 'a', target: 'b' },
      { source: 'a', target: 'fora' }, // aponta para quem não foi copiado
    ],
    dx: 30,
    dy: 40,
    baseZIndex: 10,
    makeId,
  });

  // "b" (zIndex 2) vem antes de "a" (zIndex 5), e as duas ficam acima do zIndex 10
  assert.deepEqual(result.nodes.map((n) => [n.id, n.zIndex]), [['novo-1', 11], ['novo-2', 12]]);
  assert.deepEqual(result.nodes.map((n) => [n.x, n.y]), [[30, 40], [30, 40]]);
  assert.equal(result.nodes[0].data.text, 'b');
  // só a conexão entre dois elementos copiados é copiada, ligada aos IDs novos
  assert.deepEqual(result.edges, [{ id: 'novo-3', source: 'novo-2', target: 'novo-1' }]);
});

test('cópias não dividem os dados com o original', () => {
  const original = payload('a', 0);
  const result = cloneElements({
    nodes: [original],
    edges: [],
    dx: 0,
    dy: 0,
    baseZIndex: 0,
    makeId: () => 'novo',
  });
  result.nodes[0].data.text = 'mudou';
  assert.equal(original.data.text, 'a');
});

test('cópia de imagem mantém o endereço do arquivo', () => {
  const image = payload('img', 0, {
    type: 'image',
    data: { url: 'https://x/board-images/u/f.png', storagePath: 'u/f.png' },
  });
  const result = cloneElements({ nodes: [image], edges: [], dx: 30, dy: 30, baseZIndex: 0, makeId: () => 'novo' });
  assert.deepEqual(result.nodes[0].data, image.data);
});
