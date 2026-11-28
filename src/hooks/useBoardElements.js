// Carrega os elementos e as conexões do quadro, salva automaticamente no banco e guarda
// o histórico (desfazer e refazer) e a área de cópia.
//
// SALVAMENTO: toda alteração marca o item como "pendente"; 1 segundo sem novas alterações,
// o lote pendente é enviado ao backend. Se o envio falhar (servidor fora do ar, por
// exemplo), as alterações continuam pendentes e são reenviadas.
// Ordem de envio (evita erros de dependência no banco):
//   1) criar/atualizar elementos   2) apagar conexões   3) criar conexões   4) apagar elementos
//
// HISTÓRICO: guarda "retratos" do quadro. O retrato "base" é o estado do último momento de
// calma (600 ms sem alterações, ou o fim de um arrastar/redimensionar). Quando o estado muda,
// o retrato base vai para a pilha do desfazer. Desfazer volta ao retrato anterior e marca
// as diferenças como pendentes, então o salvamento automático também as grava.
import { useCallback, useEffect, useRef, useState } from 'react';
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { cleanupImages, listElements, syncElements } from '../services/elementService.js';
import { listConnections, syncConnections } from '../services/connectionService.js';
import {
  elementToNode,
  nodeToPayload,
  createTextNode,
  createImageNode,
} from '../utils/boardElements.js';
import {
  HISTORY_LIMIT,
  MAX_ELEMENTS,
  cloneElements,
  diffSnapshots,
  groupBounds,
  isEmptyDiff,
  takeSnapshot,
} from '../utils/boardHistory.js';

const SAVE_DELAY_MS = 1000;
const RETRY_DELAY_MS = 5000;
const HISTORY_QUIET_MS = 600; // calma que fecha um passo do desfazer
const NODE_CHUNK = 10; // elementos por requisição
const EDGE_CHUNK = 50; // conexões por requisição
const REMOVE_CHUNK = 100; // exclusões por requisição
const PASTE_STEP = 24; // deslocamento entre colagens seguidas
const DUPLICATE_OFFSET = 30; // deslocamento da cópia ao duplicar

const chunks = (list, size) => {
  const result = [];
  for (let i = 0; i < list.length; i += size) result.push(list.slice(i, i + size));
  return result;
};

// Erros de conexão, limite de requisições ou do servidor: vale tentar de novo sozinho
const isRetryable = (err) => err.status === 0 || err.status === 429 || err.status >= 500;

const toEdge = (connection) => ({
  id: connection.id,
  source: connection.sourceId,
  target: connection.targetId,
  type: 'floating',
});

const limitMessage = `O quadro chegou ao limite de ${MAX_ELEMENTS} elementos.`;
const cleanupStorageKey = (projectId) => `caixaletra:cleanup:${projectId}`;

function readPendingCleanup(projectId) {
  try {
    const raw = sessionStorage.getItem(cleanupStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((path) => typeof path === 'string') : [];
  } catch {
    return [];
  }
}

function writePendingCleanup(projectId, paths) {
  try {
    if (paths.length === 0) sessionStorage.removeItem(cleanupStorageKey(projectId));
    else sessionStorage.setItem(cleanupStorageKey(projectId), JSON.stringify(paths));
  } catch {
    // sessionStorage indisponível
  }
}

async function sendCleanup(projectId, paths = [], options) {
  if (paths.length === 0) return cleanupImages(projectId, [], options);
  for (const part of chunks(paths, REMOVE_CHUNK)) {
    await cleanupImages(projectId, part, options);
  }
}

export function useBoardElements(projectId) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [saveError, setSaveError] = useState(null); // { message, retrying }
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });

  const nodesRef = useRef([]); // sempre a versão mais recente
  const edgesRef = useRef([]);
  const dirtyNodes = useRef(new Set()); // IDs para criar/atualizar
  const removedNodes = useRef(new Set()); // IDs para apagar
  const dirtyEdges = useRef(new Set());
  const removedEdges = useRef(new Set());
  const timer = useRef(null);
  const queue = useRef(Promise.resolve());
  const busy = useRef(false);
  const flushRef = useRef(() => {});

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const baseline = useRef(null); // retrato do estado no último momento de calma
  const historyDirty = useRef(false); // houve alteração ainda não fechada em um passo
  const historyTimer = useRef(null);
  const gestures = useRef(0); // arrastar/redimensionar em andamento
  const clipboard = useRef(null); // { token, nodes, edges, pastes }
  const deletedImagePaths = useRef(new Set()); // caminhos de imagens removidas nesta sessão

  const getOrphanCandidatePaths = useCallback(() => {
    const active = new Set(
      nodesRef.current
        .filter((node) => node.type === 'image' && typeof node.data?.storagePath === 'string')
        .map((node) => node.data.storagePath)
    );
    return [...deletedImagePaths.current].filter((path) => !active.has(path));
  }, []);

  const syncPendingCleanup = useCallback(() => {
    writePendingCleanup(projectId, getOrphanCandidatePaths());
  }, [projectId, getOrphanCandidatePaths]);

  const commitNodes = useCallback((updater) => {
    const next = updater(nodesRef.current);
    nodesRef.current = next;
    setNodes(next);
  }, []);

  const commitEdges = useCallback((updater) => {
    const next = updater(edgesRef.current);
    edgesRef.current = next;
    setEdges(next);
  }, []);

  const markNodeDirty = (id) => {
    removedNodes.current.delete(id);
    dirtyNodes.current.add(id);
  };
  const markNodeRemoved = (id) => {
    dirtyNodes.current.delete(id);
    removedNodes.current.add(id);
  };
  const markEdgeDirty = (id) => {
    removedEdges.current.delete(id);
    dirtyEdges.current.add(id);
  };
  const markEdgeRemoved = (id) => {
    dirtyEdges.current.delete(id);
    removedEdges.current.add(id);
  };

  const hasPending = () =>
    busy.current ||
    dirtyNodes.current.size > 0 ||
    removedNodes.current.size > 0 ||
    dirtyEdges.current.size > 0 ||
    removedEdges.current.size > 0;

  // ------------------------------------------------------------ salvamento
  const scheduleSave = useCallback(() => {
    clearTimeout(timer.current);
    setSaveState('saving');
    timer.current = setTimeout(() => flushRef.current(), SAVE_DELAY_MS);
  }, []);

  // Envia ao banco o que estiver pendente
  const doFlush = useCallback(async () => {
    const nodeIds = [...dirtyNodes.current];
    const goneNodes = [...removedNodes.current];
    const edgeIds = [...dirtyEdges.current];
    const goneEdges = [...removedEdges.current];
    if (nodeIds.length + goneNodes.length + edgeIds.length + goneEdges.length === 0) return;

    dirtyNodes.current.clear();
    removedNodes.current.clear();
    dirtyEdges.current.clear();
    removedEdges.current.clear();
    busy.current = true;
    setSaveState('saving');

    const upsertNodes = nodeIds
      .map((id) => nodesRef.current.find((node) => node.id === id))
      .filter(Boolean)
      .map(nodeToPayload);

    // Só conexões cujos dois elementos ainda existem
    const existingNodeIds = new Set(nodesRef.current.map((node) => node.id));
    const upsertEdges = edgeIds
      .map((id) => edgesRef.current.find((edge) => edge.id === id))
      .filter((edge) => edge && existingNodeIds.has(edge.source) && existingNodeIds.has(edge.target))
      .map((edge) => ({ id: edge.id, sourceId: edge.source, targetId: edge.target }));

    try {
      for (const part of chunks(upsertNodes, NODE_CHUNK)) {
        await syncElements(projectId, { upsert: part, remove: [] });
      }
      for (const part of chunks(goneEdges, REMOVE_CHUNK)) {
        await syncConnections(projectId, { upsert: [], remove: part });
      }
      for (const part of chunks(upsertEdges, EDGE_CHUNK)) {
        await syncConnections(projectId, { upsert: part, remove: [] });
      }
      for (const part of chunks(goneNodes, REMOVE_CHUNK)) {
        await syncElements(projectId, { upsert: [], remove: part });
      }

      setSaveError(null);
      setSaveState(
        dirtyNodes.current.size +
          removedNodes.current.size +
          dirtyEdges.current.size +
          removedEdges.current.size >
          0
          ? 'saving'
          : 'saved'
      );
    } catch (err) {
      // Devolve ao pendente para não perder nada (repetir um envio é seguro)
      nodeIds.forEach((id) => dirtyNodes.current.add(id));
      goneNodes.forEach((id) => removedNodes.current.add(id));
      edgeIds.forEach((id) => dirtyEdges.current.add(id));
      goneEdges.forEach((id) => removedEdges.current.add(id));

      const retrying = isRetryable(err);
      setSaveState('error');
      setSaveError({ message: err.message, retrying });

      if (retrying) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flushRef.current(), RETRY_DELAY_MS);
      }
    } finally {
      busy.current = false;
    }
  }, [projectId]);

  // Garante que dois envios nunca rodem ao mesmo tempo
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = null;
    queue.current = queue.current.then(doFlush);
    return queue.current;
  }, [doFlush]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // ------------------------------------------------------------- histórico
  const refreshHistory = useCallback(() => {
    const next = {
      canUndo: undoStack.current.length > 0 || historyDirty.current,
      canRedo: redoStack.current.length > 0,
    };
    setHistory((current) =>
      current.canUndo === next.canUndo && current.canRedo === next.canRedo ? current : next
    );
  }, []);

  // Fecha o passo em andamento: se o estado mudou desde o retrato base, ele vai para o desfazer
  const commitHistory = useCallback(() => {
    clearTimeout(historyTimer.current);
    historyTimer.current = null;
    if (!historyDirty.current || !baseline.current) return;

    historyDirty.current = false;
    const now = takeSnapshot(nodesRef.current, edgesRef.current);
    if (!isEmptyDiff(diffSnapshots(baseline.current, now))) {
      undoStack.current.push(baseline.current);
      if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
      baseline.current = now;
    }
    refreshHistory();
  }, [refreshHistory]);

  // Chamada a cada alteração feita pela pessoa (não pelo desfazer/refazer)
  const noteHistoryChange = useCallback(() => {
    historyDirty.current = true;
    redoStack.current.length = 0; // uma ação nova apaga o "refazer"
    clearTimeout(historyTimer.current);
    if (gestures.current === 0) historyTimer.current = setTimeout(commitHistory, HISTORY_QUIET_MS);
    refreshHistory();
  }, [commitHistory, refreshHistory]);

  // Salvar + registrar no histórico: usada em toda alteração feita pela pessoa
  const schedule = useCallback(() => {
    scheduleSave();
    noteHistoryChange();
  }, [scheduleSave, noteHistoryChange]);

  // Arrastar e redimensionar são um passo só, mesmo com pausas no meio
  const beginGesture = useCallback(() => {
    gestures.current += 1;
    clearTimeout(historyTimer.current);
  }, []);

  const endGesture = useCallback(() => {
    gestures.current = Math.max(0, gestures.current - 1);
    if (gestures.current === 0 && historyDirty.current) {
      clearTimeout(historyTimer.current);
      historyTimer.current = setTimeout(commitHistory, HISTORY_QUIET_MS);
    }
  }, [commitHistory]);

  // Coloca o quadro no estado do retrato "target" e marca as diferenças como pendentes
  const restoreSnapshot = useCallback(
    (target, current) => {
      const diff = diffSnapshots(current, target);
      diff.removeNodes.forEach(markNodeRemoved);
      diff.upsertNodes.forEach(markNodeDirty);
      diff.removeEdges.forEach(markEdgeRemoved);
      diff.upsertEdges.forEach(markEdgeDirty);

      for (const payload of current.nodes) {
        if (payload.type === 'image' && typeof payload.data?.storagePath === 'string') {
          deletedImagePaths.current.add(payload.data.storagePath);
        }
      }
      for (const payload of target.nodes) {
        if (payload.type === 'image' && typeof payload.data?.storagePath === 'string') {
          deletedImagePaths.current.delete(payload.data.storagePath);
        }
      }

      const existing = new Map(nodesRef.current.map((node) => [node.id, node]));
      const nextNodes = target.nodes.map((payload) => {
        const fresh = elementToNode(payload);
        const old = existing.get(payload.id);
        // Elementos que já existem mantêm o que o quadro controla (seleção, medidas)
        return old
          ? {
              ...old,
              position: fresh.position,
              width: fresh.width,
              height: fresh.height,
              zIndex: fresh.zIndex,
              data: fresh.data,
            }
          : fresh;
      });
      const nextEdges = target.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'floating',
      }));

      nodesRef.current = nextNodes;
      setNodes(nextNodes);
      edgesRef.current = nextEdges;
      setEdges(nextEdges);
      syncPendingCleanup();
      scheduleSave(); // grava no banco, sem apagar o "refazer"
    },
    [scheduleSave, syncPendingCleanup]
  );

  const undo = useCallback(() => {
    gestures.current = 0;
    commitHistory();
    const target = undoStack.current.pop();
    if (!target) {
      refreshHistory();
      return false;
    }
    const current = takeSnapshot(nodesRef.current, edgesRef.current);
    redoStack.current.push(current);
    restoreSnapshot(target, current);
    baseline.current = target;
    refreshHistory();
    return true;
  }, [commitHistory, refreshHistory, restoreSnapshot]);

  const redo = useCallback(() => {
    gestures.current = 0;
    commitHistory();
    const target = redoStack.current.pop();
    if (!target) {
      refreshHistory();
      return false;
    }
    const current = takeSnapshot(nodesRef.current, edgesRef.current);
    undoStack.current.push(current);
    restoreSnapshot(target, current);
    baseline.current = target;
    refreshHistory();
    return true;
  }, [commitHistory, refreshHistory, restoreSnapshot]);

  // -------------------------------------------------------------- carregar
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [elementsData, connectionsData] = await Promise.all([
        listElements(projectId),
        listConnections(projectId),
      ]);
      const loadedNodes = elementsData.elements.map(elementToNode);
      const loadedEdges = connectionsData.connections.map(toEdge);
      nodesRef.current = loadedNodes;
      edgesRef.current = loadedEdges;
      setNodes(loadedNodes);
      setEdges(loadedEdges);

      // Começa um histórico novo a partir do que veio do banco
      undoStack.current = [];
      redoStack.current = [];
      historyDirty.current = false;
      baseline.current = takeSnapshot(loadedNodes, loadedEdges);
      refreshHistory();

      // Apaga do Storage as imagens que não são mais usadas (incluindo as excluídas antes de recarregar)
      const active = new Set(
        loadedNodes
          .filter((node) => node.type === 'image' && typeof node.data?.storagePath === 'string')
          .map((node) => node.data.storagePath)
      );
      const pendingPaths = readPendingCleanup(projectId).filter((path) => !active.has(path));
      writePendingCleanup(projectId, pendingPaths);
      deletedImagePaths.current = new Set(pendingPaths);

      sendCleanup(projectId, pendingPaths)
        .then(() => {
          for (const path of pendingPaths) deletedImagePaths.current.delete(path);
          syncPendingCleanup();
        })
        .catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, refreshHistory, syncPendingCleanup]);

  useEffect(() => {
    load();
  }, [load]);

  // Salva ao esconder a aba, avisa antes de fechar com algo pendente
  // e salva/limpa o que sobrou ao sair da página.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushRef.current();
    };
    const onBeforeUnload = (event) => {
      if (hasPending()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const onPageHide = () => {
      const pathsToClean = getOrphanCandidatePaths();
      if (pathsToClean.length > 0 && !hasPending()) {
        sendCleanup(projectId, pathsToClean, { keepalive: true }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
      clearTimeout(timer.current);
      clearTimeout(historyTimer.current);
      const pathsToClean = getOrphanCandidatePaths();
      const pendingFlush = flushRef.current();
      if (pathsToClean.length > 0) {
        Promise.resolve(pendingFlush)
          .then(() => sendCleanup(projectId, pathsToClean, { keepalive: true }))
          .then(() => {
            for (const path of pathsToClean) deletedImagePaths.current.delete(path);
            syncPendingCleanup();
          })
          .catch(() => {});
      }
    };
  }, [projectId, getOrphanCandidatePaths, syncPendingCleanup]);

  // ------------------------------------------- mudanças feitas pelo quadro
  // Mover, redimensionar, selecionar e remover
  const onNodesChange = useCallback(
    (changes) => {
      const previousNodes = nodesRef.current;
      commitNodes((previous) => applyNodeChanges(changes, previous));

      let touched = false;
      let removedImage = false;
      const removedIds = [];
      for (const change of changes) {
        if (change.type === 'remove') {
          const target = previousNodes.find((node) => node.id === change.id);
          if (target?.type === 'image' && typeof target.data?.storagePath === 'string') {
            deletedImagePaths.current.add(target.data.storagePath);
            removedImage = true;
          }
          markNodeRemoved(change.id);
          removedIds.push(change.id);
          touched = true;
        } else if (change.type === 'position' && change.position) {
          markNodeDirty(change.id);
          touched = true;
        } else if (change.type === 'dimensions' && change.setAttributes) {
          // Só conta quando a pessoa redimensiona (e não a medição automática inicial)
          markNodeDirty(change.id);
          touched = true;
        }
      }

      // As conexões de um elemento apagado somem junto (o banco também faz isso)
      if (removedIds.length > 0) {
        commitEdges((previous) =>
          previous.filter(
            (edge) => !removedIds.includes(edge.source) && !removedIds.includes(edge.target)
          )
        );
      }

      if (removedImage) syncPendingCleanup();
      if (touched) schedule();
    },
    [commitNodes, commitEdges, schedule, syncPendingCleanup]
  );

  // Mudanças nas conexões: selecionar e remover
  const onEdgesChange = useCallback(
    (changes) => {
      commitEdges((previous) => applyEdgeChanges(changes, previous));

      let touched = false;
      for (const change of changes) {
        if (change.type === 'remove') {
          markEdgeRemoved(change.id);
          touched = true;
        }
      }
      if (touched) schedule();
    },
    [commitEdges, schedule]
  );

  // Altera o conteúdo/formatação de uma caixa de texto
  const updateData = useCallback(
    (id, patch) => {
      commitNodes((previous) =>
        previous.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...patch } } : node))
      );
      markNodeDirty(id);
      schedule();
    },
    [commitNodes, schedule]
  );

  const topZIndex = () => nodesRef.current.reduce((max, node) => Math.max(max, node.zIndex ?? 0), 0);

  const insertNode = useCallback(
    (node) => {
      commitNodes((previous) => [
        ...previous.map((item) => (item.selected ? { ...item, selected: false } : item)),
        node,
      ]);
      markNodeDirty(node.id);
      schedule();
      return node.id;
    },
    [commitNodes, schedule]
  );

  // Cria uma caixa de texto na posição indicada (coordenadas do quadro)
  const addText = useCallback(
    (position) => insertNode(createTextNode({ position, zIndex: topZIndex() + 1 })),
    [insertNode]
  );

  // Coloca uma imagem (já enviada ao Storage) no quadro
  const addImage = useCallback(
    ({ position, width, height, url, storagePath }) =>
      insertNode(
        createImageNode({ position, zIndex: topZIndex() + 1, width, height, url, storagePath })
      ),
    [insertNode]
  );

  // Cria uma seta de "sourceId" para "targetId". Devolve { ok } ou { ok: false, message }.
  const addConnection = useCallback(
    (sourceId, targetId) => {
      if (sourceId === targetId) {
        return { ok: false, message: 'Escolha dois elementos diferentes.' };
      }
      const exists = (id) => nodesRef.current.some((node) => node.id === id);
      if (!exists(sourceId) || !exists(targetId)) {
        return { ok: false, message: 'Elemento não encontrado.' };
      }
      if (edgesRef.current.some((edge) => edge.source === sourceId && edge.target === targetId)) {
        return { ok: false, message: 'Essa conexão já existe.' };
      }

      const edge = { id: crypto.randomUUID(), source: sourceId, target: targetId, type: 'floating' };
      commitEdges((previous) => [...previous.map((item) => ({ ...item, selected: false })), edge]);
      markEdgeDirty(edge.id);
      schedule();
      return { ok: true };
    },
    [commitEdges, schedule]
  );

  // ------------------------------------------------- copiar, colar, duplicar
  // Coloca as cópias no quadro, já selecionadas (as demais deixam de estar)
  const insertClones = useCallback(
    (clones) => {
      commitNodes((previous) => [
        ...previous.map((item) => (item.selected ? { ...item, selected: false } : item)),
        ...clones.nodes.map((payload) => ({ ...elementToNode(payload), selected: true })),
      ]);
      commitEdges((previous) => [
        ...previous.map((item) => (item.selected ? { ...item, selected: false } : item)),
        ...clones.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'floating',
        })),
      ]);
      clones.nodes.forEach((payload) => markNodeDirty(payload.id));
      clones.edges.forEach((edge) => markEdgeDirty(edge.id));
      schedule();
    },
    [commitNodes, commitEdges, schedule]
  );

  const buildClones = (payloads, links, dx, dy) =>
    cloneElements({
      nodes: payloads,
      edges: links,
      dx,
      dy,
      baseZIndex: topZIndex(),
      makeId: () => crypto.randomUUID(),
    });

  // Guarda os elementos selecionados (e as conexões entre eles) na área de cópia.
  // Devolve { token, count } ou null se não há nada selecionado.
  const copySelected = useCallback(() => {
    const selected = nodesRef.current.filter((node) => node.selected);
    if (selected.length === 0) return null;

    const ids = new Set(selected.map((node) => node.id));
    const token = crypto.randomUUID();
    clipboard.current = {
      token,
      nodes: selected.map(nodeToPayload),
      edges: edgesRef.current
        .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
        .map((edge) => ({ source: edge.source, target: edge.target })),
      pastes: 0,
    };
    return { token, count: selected.length };
  }, []);

  // Cola o que foi copiado, com o grupo centralizado em "center" (coordenadas do quadro).
  // Colagens seguidas se afastam um pouco, para não ficarem uma em cima da outra.
  const pasteClipboard = useCallback(
    (token, center) => {
      const clip = clipboard.current;
      if (!clip || clip.token !== token) {
        return { ok: false, message: 'Copie os elementos neste quadro antes de colar.' };
      }
      if (nodesRef.current.length + clip.nodes.length > MAX_ELEMENTS) {
        return { ok: false, message: limitMessage };
      }

      const bounds = groupBounds(clip.nodes);
      const offset = clip.pastes * PASTE_STEP;
      clip.pastes += 1;
      const dx = center.x - (bounds.x + bounds.width / 2) + offset;
      const dy = center.y - (bounds.y + bounds.height / 2) + offset;

      insertClones(buildClones(clip.nodes, clip.edges, dx, dy));
      return { ok: true, count: clip.nodes.length };
    },
    [insertClones]
  );

  // Cria uma cópia ao lado dos elementos selecionados.
  // Devolve { ok, count } | { ok: false, empty: true } | { ok: false, message }
  const duplicateSelected = useCallback(() => {
    const selected = nodesRef.current.filter((node) => node.selected);
    if (selected.length === 0) return { ok: false, empty: true };
    if (nodesRef.current.length + selected.length > MAX_ELEMENTS) {
      return { ok: false, message: limitMessage };
    }

    const ids = new Set(selected.map((node) => node.id));
    const links = edgesRef.current
      .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
      .map((edge) => ({ source: edge.source, target: edge.target }));

    insertClones(buildClones(selected.map(nodeToPayload), links, DUPLICATE_OFFSET, DUPLICATE_OFFSET));
    return { ok: true, count: selected.length };
  }, [insertClones]);

  return {
    nodes,
    edges,
    loading,
    error,
    saveState,
    saveError,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    reload: load,
    onNodesChange,
    onEdgesChange,
    updateData,
    addText,
    addImage,
    addConnection,
    undo,
    redo,
    beginGesture,
    endGesture,
    copySelected,
    pasteClipboard,
    duplicateSelected,
  };
}
