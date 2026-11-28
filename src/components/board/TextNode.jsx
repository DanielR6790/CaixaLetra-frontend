import { useEffect, useRef, useState } from 'react';
import { Handle, NodeResizer, Position } from '@xyflow/react';
import TextToolbar from './TextToolbar.jsx';
import { useBoardActions } from './BoardActionsContext.js';
import { readableTextColor } from '../../utils/color.js';

// Caixa de texto do quadro.
// - Duplo clique: edita o texto (Esc ou clicar fora termina).
// - Arrastar: move. Alças nas bordas (quando selecionada): redimensiona.
export default function TextNode({ id, data, selected }) {
  const { updateData, beginGesture, endGesture } = useBoardActions();
  const [editing, setEditing] = useState(Boolean(data.isNew));
  const textareaRef = useRef(null);

  // Ao entrar em edição, foca o campo e põe o cursor no fim do texto
  useEffect(() => {
    if (!editing) return undefined;
    const frame = requestAnimationFrame(() => {
      const field = textareaRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [editing]);

  // Cor "automática": segue o tema do quadro (variável --board-text) ou,
  // se a caixa tem fundo colorido, escolhe preto/branco pelo contraste.
  const color =
    data.color ?? (data.background ? readableTextColor(data.background) : 'var(--board-text)');

  const style = {
    color,
    background: data.background ?? 'transparent',
    fontSize: `${data.fontSize}px`,
    fontWeight: data.bold ? 700 : 400,
    fontStyle: data.italic ? 'italic' : 'normal',
    textAlign: data.align,
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={40}
        lineClassName="board-resizer-line"
        handleClassName="board-resizer-handle"
        onResizeStart={() => beginGesture()}
        onResizeEnd={() => endGesture()}
      />
      <TextToolbar id={id} data={data} selected={selected} />

      <div
        className={editing ? 'board-text board-text-editing' : 'board-text'}
        style={style}
        onDoubleClick={() => setEditing(true)}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            className="board-text-input nodrag nowheel nopan"
            value={data.text}
            maxLength={20000}
            placeholder="Escreva aqui…"
            aria-label="Texto da caixa"
            onChange={(event) => updateData(id, { text: event.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
          />
        ) : data.text ? (
          <div className="board-text-content">{data.text}</div>
        ) : (
          <div className="board-text-placeholder">Duplo clique para escrever</div>
        )}
      </div>

      {/* Pontos de ligação invisíveis: as setas usam a borda do elemento */}
      <Handle type="target" position={Position.Top} className="board-handle" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} className="board-handle" isConnectable={false} />
    </>
  );
}
