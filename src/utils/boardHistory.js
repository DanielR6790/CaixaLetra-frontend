// Histórico (desfazer e refazer) e cópias do quadro.
// Funções puras, sem React, para poderem ser testadas.
import { nodeToPayload } from './boardElements.js';

export const HISTORY_LIMIT = 100; // passos que o desfazer guarda
export const MAX_ELEMENTS = 2000; // mesmo limite que o banco aplica por quadro

const round = (value) => Math.round(value * 100) / 100;

// Retrato do que é salvo no banco (sem seleção, medidas internas e outros detalhes do quadro)
export function takeSnapshot(nodes, edges) {
  return {
    nodes: nodes.map(nodeToPayload),
    edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
  };
}

// Dois elementos iguais? Todos os campos de "data" são textos, números, booleanos ou nulos.
export function payloadEqual(a, b) {
  if (
    a.type !== b.type ||
    a.x !== b.x ||
    a.y !== b.y ||
    a.width !== b.width ||
    a.height !== b.height ||
    a.zIndex !== b.zIndex
  ) {
    return false;
  }
  const keysA = Object.keys(a.data);
  if (keysA.length !== Object.keys(b.data).length) return false;
  return keysA.every((key) => a.data[key] === b.data[key]);
}

// O que muda para ir do retrato "from" ao retrato "to"
export function diffSnapshots(from, to) {
  const fromNodes = new Map(from.nodes.map((node) => [node.id, node]));
  const toNodeIds = new Set(to.nodes.map((node) => node.id));
  const fromEdges = new Map(from.edges.map((edge) => [edge.id, edge]));
  const toEdgeIds = new Set(to.edges.map((edge) => edge.id));

  return {
    removeNodes: from.nodes.filter((node) => !toNodeIds.has(node.id)).map((node) => node.id),
    upsertNodes: to.nodes
      .filter((node) => {
        const before = fromNodes.get(node.id);
        return !before || !payloadEqual(before, node);
      })
      .map((node) => node.id),
    removeEdges: from.edges.filter((edge) => !toEdgeIds.has(edge.id)).map((edge) => edge.id),
    upsertEdges: to.edges
      .filter((edge) => {
        const before = fromEdges.get(edge.id);
        return !before || before.source !== edge.source || before.target !== edge.target;
      })
      .map((edge) => edge.id),
  };
}

export const isEmptyDiff = (diff) => Object.values(diff).every((list) => list.length === 0);

// Retângulo que envolve um grupo de elementos
export function groupBounds(payloads) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const payload of payloads) {
    minX = Math.min(minX, payload.x);
    minY = Math.min(minY, payload.y);
    maxX = Math.max(maxX, payload.x + payload.width);
    maxY = Math.max(maxY, payload.y + payload.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

// Cria cópias dos elementos (com IDs novos, deslocadas em dx/dy e por cima dos demais)
// e das conexões que ligam dois elementos copiados.
// nodes: elementos como no banco | edges: [{ source, target }]
export function cloneElements({ nodes, edges, dx, dy, baseZIndex, makeId }) {
  // A ordem de empilhamento original é mantida
  const ordered = [...nodes].sort((a, b) => a.zIndex - b.zIndex);
  const idMap = new Map();

  const clonedNodes = ordered.map((node, index) => {
    const id = makeId();
    idMap.set(node.id, id);
    return {
      ...node,
      id,
      x: round(node.x + dx),
      y: round(node.y + dy),
      zIndex: baseZIndex + 1 + index,
      data: { ...node.data },
    };
  });

  const clonedEdges = edges
    .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
    .map((edge) => ({
      id: makeId(),
      source: idMap.get(edge.source),
      target: idMap.get(edge.target),
    }));

  return { nodes: clonedNodes, edges: clonedEdges };
}
