import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../styles/board-elements.css';
import '../../styles/board-extras.css';
import Icon from '../common/Icon.jsx';
import TextNode from './TextNode.jsx';
import ImageNode from './ImageNode.jsx';
import FloatingEdge from './FloatingEdge.jsx';
import { BoardActionsContext } from './BoardActionsContext.js';
import { DEFAULT_TEXT_SIZE } from '../../utils/boardElements.js';
import { ACCEPTED_IMAGE_TYPES } from '../../services/storageService.js';
import { appConfig } from '../../config/app.config.js';

// Cores do quadro. O fundo é preto por padrão.
// "arrow" = cor das setas (branca no fundo preto, preta no fundo branco).
const THEMES = {
  dark: { background: '#000000', dots: '#3b3b3b', colorMode: 'dark', arrow: '#ffffff' },
  light: { background: '#ffffff', dots: '#c9c9c9', colorMode: 'light', arrow: '#000000' },
};

// Precisam ser constantes fora do componente
const NODE_TYPES = { text: TextNode, image: ImageNode };
const EDGE_TYPES = { floating: FloatingEdge };

// Elementos em que o duplo clique NÃO cria uma caixa nova
const IGNORE_DOUBLE_CLICK =
  '.react-flow__node, .react-flow__edge, .react-flow__controls, .react-flow__panel, .react-flow__attribution, .board-toolbar';

// Texto que o Ctrl + C grava na área de transferência do sistema ao copiar elementos.
// É assim que o Ctrl + V sabe se o que foi copiado por último foram elementos do quadro.
const CLIP_MARKER = 'caixaletra-quadro:';

// Campos de texto: neles, Ctrl + Z / C / V funcionam como em qualquer site
const isEditableTarget = (target) =>
  target instanceof Element &&
  Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'));

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

function BoardInner({
  boardTheme,
  initialViewport,
  onViewportChange,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onAddText,
  onUpdateData,
  onAddImages,
  onConnect,
  uploading,
  uploadError,
  onDismissUploadError,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onCopyElements,
  onPasteElements,
  onDuplicate,
  onGestureStart,
  onGestureEnd,
}) {
  const theme = THEMES[boardTheme] ?? THEMES.dark;
  const { screenToFlowPosition, deleteElements } = useReactFlow();
  const wrapperRef = useRef(null);
  const fileInputRef = useRef(null);
  const noticeTimer = useRef(null);

  // null = modo conexão desligado | { sourceId: null | id } = escolhendo origem/destino
  const [connectMode, setConnectMode] = useState(null);
  const [notice, setNotice] = useState('');

  // Centro da parte visível do quadro, em coordenadas do quadro
  const visibleCenter = useCallback(() => {
    const box = wrapperRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  }, [screenToFlowPosition]);

  const showNotice = useCallback((message) => {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(''), 3000);
  }, []);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  // Duplicar (botão das barras e Ctrl + D)
  const handleDuplicate = useCallback(() => {
    const result = onDuplicate();
    if (!result.ok && !result.empty) showNotice(result.message);
    return result;
  }, [onDuplicate, showNotice]);

  const actions = useMemo(
    () => ({
      boardTheme,
      updateData: onUpdateData,
      duplicateSelected: handleDuplicate,
      beginGesture: onGestureStart,
      endGesture: onGestureEnd,
    }),
    [boardTheme, onUpdateData, handleDuplicate, onGestureStart, onGestureEnd]
  );

  // ---------- Texto ----------
  // Duplo clique no fundo: cria uma caixa de texto ali
  const handleDoubleClick = useCallback(
    (event) => {
      if (event.target.closest(IGNORE_DOUBLE_CLICK)) return;
      onAddText(screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [onAddText, screenToFlowPosition]
  );

  // Botão "Adicionar texto": cria no centro da área visível
  const handleAddTextButton = useCallback(() => {
    const center = visibleCenter();
    onAddText({
      x: center.x - DEFAULT_TEXT_SIZE.width / 2,
      y: center.y - DEFAULT_TEXT_SIZE.height / 2,
    });
  }, [onAddText, visibleCenter]);

  // ---------- Teclado: desfazer, refazer e duplicar ----------
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (isEditableTarget(event.target) || document.querySelector('.modal-backdrop')) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
      } else if (key === 'y') {
        event.preventDefault();
        onRedo();
      } else if (key === 'd') {
        const result = handleDuplicate();
        // Sem nada selecionado, o Ctrl + D continua sendo do navegador (favoritos)
        if (!result.empty) event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onUndo, onRedo, handleDuplicate]);

  // ---------- Copiar elementos (Ctrl + C) ----------
  useEffect(() => {
    const onCopy = (event) => {
      if (isEditableTarget(event.target) || document.querySelector('.modal-backdrop')) return;
      // Se há texto selecionado na página, é uma cópia de texto normal
      if (window.getSelection()?.toString()) return;

      const copied = onCopyElements();
      if (!copied) return;
      event.preventDefault();
      event.clipboardData.setData('text/plain', `${CLIP_MARKER}${copied.token}`);
      showNotice(`${plural(copied.count, 'elemento copiado', 'elementos copiados')}. Ctrl+V cola.`);
    };
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, [onCopyElements, showNotice]);

  // ---------- Colar: imagens do sistema e elementos copiados (Ctrl + V) ----------
  // Só reage se a área de transferência tiver uma IMAGEM ou elementos copiados no quadro
  // (colar texto continua funcionando normalmente nas caixas).
  useEffect(() => {
    const onPaste = (event) => {
      if (event.target instanceof Element && event.target.closest('.modal')) return;

      const images = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith('image/')
      );
      if (images.length > 0) {
        event.preventDefault();
        onAddImages(images, visibleCenter());
        return;
      }

      if (isEditableTarget(event.target)) return;
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!text.startsWith(CLIP_MARKER)) return;

      event.preventDefault();
      const result = onPasteElements(text.slice(CLIP_MARKER.length), visibleCenter());
      if (!result.ok) showNotice(result.message);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [onAddImages, onPasteElements, visibleCenter, showNotice]);

  // ---------- Imagens ----------
  // Arrastar arquivos do computador para dentro do quadro
  const handleDragOver = useCallback((event) => {
    if (!event.dataTransfer?.types?.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (event) => {
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      // Sempre cancela: evita o navegador abrir o arquivo solto. Arquivos que não
      // são imagem recebem uma mensagem de erro em vez de serem ignorados.
      event.preventDefault();
      onAddImages(files, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [onAddImages, screenToFlowPosition]
  );

  const handleFileInput = useCallback(
    (event) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = '';
      if (files.length > 0) onAddImages(files, visibleCenter());
    },
    [onAddImages, visibleCenter]
  );

  // ---------- Conexões ----------
  const toggleConnectMode = useCallback(() => {
    setConnectMode((current) => (current ? null : { sourceId: null }));
  }, []);

  // No modo conexão: 1º clique = origem, 2º clique = destino
  const handleNodeClick = useCallback(
    (event, node) => {
      if (!connectMode) return;

      if (!connectMode.sourceId) {
        setConnectMode({ sourceId: node.id });
        return;
      }
      if (connectMode.sourceId === node.id) {
        setConnectMode({ sourceId: null }); // clicou na origem de novo: escolhe outra
        return;
      }

      const result = onConnect(connectMode.sourceId, node.id);
      setConnectMode({ sourceId: null }); // continua no modo, para criar outra conexão
      showNotice(result.ok ? 'Conexão criada.' : result.message);
    },
    [connectMode, onConnect, showNotice]
  );

  // Esc sai do modo conexão
  useEffect(() => {
    if (!connectMode) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setConnectMode(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [connectMode]);

  const selectedEdges = useMemo(() => edges.filter((edge) => edge.selected), [edges]);

  const handleDeleteSelectedEdges = useCallback(() => {
    deleteElements({ edges: selectedEdges.map((edge) => ({ id: edge.id })) });
  }, [deleteElements, selectedEdges]);

  // Realça o elemento de origem escolhido no modo conexão
  const displayNodes = useMemo(() => {
    if (!connectMode?.sourceId) return nodes;
    return nodes.map((node) =>
      node.id === connectMode.sourceId ? { ...node, className: 'board-node-source' } : node
    );
  }, [nodes, connectMode]);

  // Setas: cor do tema, ponta no destino e destaque quando selecionada
  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const color = edge.selected ? appConfig.colors.accent : theme.arrow;
        return {
          ...edge,
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
          style: { stroke: color, strokeWidth: 2 },
        };
      }),
    [edges, theme.arrow]
  );

  // Excluir não pergunta mais: o Ctrl + Z desfaz
  const handleNodesDelete = useCallback(
    (deleted) => {
      if (deleted.length > 0) showNotice('Excluído. Ctrl+Z desfaz.');
    },
    [showNotice]
  );

  // Arrastar e redimensionar contam como um passo só no desfazer
  const handleGestureStart = useCallback(() => onGestureStart(), [onGestureStart]);
  const handleGestureEnd = useCallback(() => onGestureEnd(), [onGestureEnd]);

  return (
    <BoardActionsContext.Provider value={actions}>
      <div className="board-canvas" data-board-theme={boardTheme}>
        <div
          className={connectMode ? 'board-canvas-inner board-connecting' : 'board-canvas-inner'}
          ref={wrapperRef}
          onDoubleClick={handleDoubleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onNodesDelete={handleNodesDelete}
            onNodeDragStart={handleGestureStart}
            onNodeDragStop={handleGestureEnd}
            onSelectionDragStart={handleGestureStart}
            onSelectionDragStop={handleGestureEnd}
            deleteKeyCode="Delete"
            nodesConnectable={false}
            defaultViewport={initialViewport}
            minZoom={0.1}
            maxZoom={4}
            colorMode={theme.colorMode}
            zoomOnDoubleClick={false}
            onMoveEnd={(event, viewport) => onViewportChange(viewport)}
            style={{ background: theme.background }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color={theme.dots} />
            <Controls showInteractive={false} aria-label="Controles de zoom" />

            <Panel position="top-left" className="board-panel">
              <div className="board-panel-row">
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAddTextButton}>
                  <Icon name="text" size={16} />
                  Adicionar texto
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="image" size={16} />
                  Adicionar imagem
                </button>
                <button
                  type="button"
                  className={connectMode ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={toggleConnectMode}
                  aria-pressed={Boolean(connectMode)}
                >
                  <Icon name="link" size={16} />
                  Conectar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Desfazer (Ctrl+Z)"
                >
                  <Icon name="undo" size={16} />
                  Desfazer
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Refazer (Ctrl+Y)"
                >
                  <Icon name="redo" size={16} />
                  Refazer
                </button>
                {selectedEdges.length > 0 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteSelectedEdges}>
                    <Icon name="trash" size={16} />
                    Excluir conexão
                  </button>
                )}
              </div>

              {connectMode && (
                <div className="board-banner">
                  <span>
                    {connectMode.sourceId
                      ? 'Agora clique no elemento de DESTINO (a seta aponta para ele).'
                      : 'Modo conexão: clique no elemento de ORIGEM.'}
                  </span>
                  <button type="button" className="board-banner-close" onClick={() => setConnectMode(null)}>
                    Sair
                  </button>
                </div>
              )}

              {uploading > 0 && (
                <div className="board-banner" role="status">
                  Enviando imagem…
                </div>
              )}

              {uploadError && (
                <div className="board-banner board-banner-error" role="alert">
                  <span>{uploadError}</span>
                  <button type="button" className="board-banner-close" onClick={onDismissUploadError}>
                    Fechar
                  </button>
                </div>
              )}

              {notice && (
                <div className="board-banner" role="status">
                  {notice}
                </div>
              )}
            </Panel>
          </ReactFlow>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            multiple
            hidden
            onChange={handleFileInput}
          />
        </div>

        <p className="board-hint">
          Arraste o fundo para mover · Zoom na roda do mouse · Duplo clique no fundo cria um texto ·
          Shift + arrastar seleciona vários · Ctrl+Z desfaz · Ctrl+C e Ctrl+V copiam · Ctrl+D duplica
        </p>
      </div>
    </BoardActionsContext.Provider>
  );
}

// Quadro infinito: arraste o fundo para mover e use a roda do mouse para o zoom.
// O espaço não tem limites em nenhuma direção.
export default function BoardCanvas(props) {
  return (
    <ReactFlowProvider>
      <BoardInner {...props} />
    </ReactFlowProvider>
  );
}
