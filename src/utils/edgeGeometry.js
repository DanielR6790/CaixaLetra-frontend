// Geometria das setas "flutuantes": a linha liga os centros dos dois elementos
// e termina na BORDA de cada um, então fica limpa em qualquer posição relativa.
function centerOf(node) {
  const { x, y } = node.internals.positionAbsolute;
  return { x: x + node.measured.width / 2, y: y + node.measured.height / 2 };
}

// Ponto da borda de "node" na direção de "towards"
function borderPoint(node, towards) {
  const center = centerOf(node);
  const dx = towards.x - center.x;
  const dy = towards.y - center.y;
  const halfW = node.measured.width / 2;
  const halfH = node.measured.height / 2;

  const scale = Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH);
  if (!Number.isFinite(scale) || scale === 0) return center;
  return { x: center.x + dx / scale, y: center.y + dy / scale };
}

const isMeasured = (node) =>
  Boolean(node?.measured?.width && node?.measured?.height && node?.internals?.positionAbsolute);

// Devolve { sx, sy, tx, ty } ou null enquanto os elementos ainda não foram medidos
export function getEdgeEndpoints(sourceNode, targetNode) {
  if (!isMeasured(sourceNode) || !isMeasured(targetNode)) return null;

  const sourceCenter = centerOf(sourceNode);
  const targetCenter = centerOf(targetNode);
  const start = borderPoint(sourceNode, targetCenter);
  const end = borderPoint(targetNode, sourceCenter);

  return { sx: start.x, sy: start.y, tx: end.x, ty: end.y };
}