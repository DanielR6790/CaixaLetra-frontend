import { NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import Icon from '../common/Icon.jsx';
import { useBoardActions } from './BoardActionsContext.js';
import { FONT_SIZES } from '../../utils/boardElements.js';
import { readableTextColor } from '../../utils/color.js';

const ALIGNMENTS = [
  { value: 'left', icon: 'alignLeft', label: 'Alinhar à esquerda' },
  { value: 'center', icon: 'alignCenter', label: 'Centralizar' },
  { value: 'right', icon: 'alignRight', label: 'Alinhar à direita' },
];

// Barra de formatação que aparece acima da caixa selecionada.
export default function TextToolbar({ id, data, selected }) {
  const { boardTheme, updateData } = useBoardActions();
  const { deleteElements } = useReactFlow();

  const set = (patch) => updateData(id, patch);

  // Cores mostradas nos seletores quando o valor é "automático"
  const themeText = boardTheme === 'dark' ? '#ffffff' : '#000000';
  const shownText = data.color ?? (data.background ? readableTextColor(data.background) : themeText);
  const shownBackground = data.background ?? (boardTheme === 'dark' ? '#1f2933' : '#f1f5f9');

  const sizes = FONT_SIZES.includes(data.fontSize)
    ? FONT_SIZES
    : [...FONT_SIZES, data.fontSize].sort((a, b) => a - b);

  return (
    <NodeToolbar isVisible={selected} position={Position.Top} offset={12}>
      <div className="board-toolbar nodrag nopan nowheel" role="toolbar" aria-label="Formatação do texto">
        <select
          className="tb-select"
          value={data.fontSize}
          onChange={(event) => set({ fontSize: Number(event.target.value) })}
          aria-label="Tamanho da fonte"
          title="Tamanho da fonte"
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <span className="tb-sep" aria-hidden="true" />

        <label className="tb-color" title="Cor do texto">
          <span className="tb-label">Texto</span>
          <input
            type="color"
            value={shownText}
            onChange={(event) => set({ color: event.target.value })}
            aria-label="Cor do texto"
          />
        </label>
        {data.color !== null && (
          <button
            type="button"
            className="tb-text-btn"
            onClick={() => set({ color: null })}
            title="Voltar à cor automática (segue o fundo do quadro)"
          >
            Auto
          </button>
        )}

        <label className="tb-color" title="Cor de fundo da caixa">
          <span className="tb-label">Fundo</span>
          <input
            type="color"
            value={shownBackground}
            onChange={(event) => set({ background: event.target.value })}
            aria-label="Cor de fundo da caixa"
          />
        </label>
        {data.background !== null && (
          <button
            type="button"
            className="tb-text-btn"
            onClick={() => set({ background: null })}
            title="Remover a cor de fundo"
          >
            Sem fundo
          </button>
        )}

        <span className="tb-sep" aria-hidden="true" />

        {ALIGNMENTS.map((alignment) => (
          <button
            key={alignment.value}
            type="button"
            className={data.align === alignment.value ? 'tb-btn tb-btn-active' : 'tb-btn'}
            onClick={() => set({ align: alignment.value })}
            aria-pressed={data.align === alignment.value}
            aria-label={alignment.label}
            title={alignment.label}
          >
            <Icon name={alignment.icon} size={16} />
          </button>
        ))}

        <span className="tb-sep" aria-hidden="true" />

        <button
          type="button"
          className={data.bold ? 'tb-btn tb-btn-active' : 'tb-btn'}
          onClick={() => set({ bold: !data.bold })}
          aria-pressed={data.bold}
          aria-label="Negrito"
          title="Negrito"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={data.italic ? 'tb-btn tb-btn-active' : 'tb-btn'}
          onClick={() => set({ italic: !data.italic })}
          aria-pressed={data.italic}
          aria-label="Itálico"
          title="Itálico"
        >
          <em>I</em>
        </button>

        <span className="tb-sep" aria-hidden="true" />

        <button
          type="button"
          className="tb-btn tb-btn-danger"
          onClick={() => deleteElements({ nodes: [{ id }] })}
          aria-label="Excluir caixa de texto"
          title="Excluir"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </NodeToolbar>
  );
}