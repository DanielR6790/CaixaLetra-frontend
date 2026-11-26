import { BaseEdge, getStraightPath, useInternalNode } from '@xyflow/react';
import { getEdgeEndpoints } from '../../utils/edgeGeometry.js';

// Seta entre dois elementos: sai da borda do primeiro e chega na borda do
// segundo, e se reposiciona sozinha quando qualquer um dos dois é movido.
export default function FloatingEdge({ id, source, target, markerEnd, style }) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  const points = getEdgeEndpoints(sourceNode, targetNode);
  if (!points) return null;

  const [path] = getStraightPath({
    sourceX: points.sx,
    sourceY: points.sy,
    targetX: points.tx,
    targetY: points.ty,
  });

  // interactionWidth: área invisível maior em volta da linha, para facilitar o clique
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} interactionWidth={24} />;
}