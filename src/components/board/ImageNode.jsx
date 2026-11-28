import { useState } from 'react';
import { Handle, NodeResizer, NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import Icon from '../common/Icon.jsx';
import { useBoardActions } from './BoardActionsContext.js';

// Imagem do quadro. Mantém as proporções ao redimensionar.
export default function ImageNode({ id, data, selected }) {
  const { deleteElements } = useReactFlow();
  const { duplicateSelected, beginGesture, endGesture } = useBoardActions();
  const [failed, setFailed] = useState(false);

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={40}
        keepAspectRatio
        lineClassName="board-resizer-line"
        handleClassName="board-resizer-handle"
        onResizeStart={() => beginGesture()}
        onResizeEnd={() => endGesture()}
      />

      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div className="board-toolbar nodrag nopan" role="toolbar" aria-label="Imagem">
          <button
            type="button"
            className="tb-btn"
            onClick={() => duplicateSelected()}
            aria-label="Duplicar imagem"
            title="Duplicar (Ctrl+D)"
          >
            <Icon name="copy" size={16} />
          </button>
          <button
            type="button"
            className="tb-btn tb-btn-danger"
            onClick={() => deleteElements({ nodes: [{ id }] })}
            aria-label="Excluir imagem"
            title="Excluir (Ctrl+Z desfaz)"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </NodeToolbar>

      <div className="board-image">
        {failed ? (
          <div className="board-image-error">Imagem indisponível</div>
        ) : (
          <img
            src={data.url}
            alt="Imagem do quadro"
            draggable={false}
            onError={() => setFailed(true)}
          />
        )}
      </div>

      {/* Pontos de ligação invisíveis: as setas usam a borda do elemento */}
      <Handle type="target" position={Position.Top} className="board-handle" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className="board-handle" isConnectable={false} />
    </>
  );
}
