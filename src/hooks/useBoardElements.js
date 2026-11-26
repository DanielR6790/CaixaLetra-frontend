// Carrega os elementos e as conexões do quadro e os salva automaticamente no banco.
// Fluxo: toda alteração marca o item como "pendente"; 1 segundo sem novas
// alterações, o lote pendente é enviado ao backend. Se o envio falhar (servidor
// fora do ar, por exemplo), as alterações continuam pendentes e são reenviadas.
//
// Ordem de envio (evita erros de dependência no banco):
//   1) criar/atualizar elementos   2) apagar conexões   3) criar conexões
//   4) apagar elementos
import { useCallback, useEffect, useRef, useState } from 'react';
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { listElements, syncElements } from '../services/elementService.js';
import { listConnections, syncConnections } from '../services/connectionService.js';
import {
  elementToNode,
  nodeToPayload,
  createTextNode,
  createImageNode,
} from '../utils/boardElements.js';

const SAVE_DELAY_MS = 1000;
const RETRY_DELAY_MS = 5000;
const NODE_CHUNK = 10; // elementos por requisição
const EDGE_CHUNK = 50; // conexões por requisição
const REMOVE_CHUNK = 100; // exclusões por requisição

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

export function useBoardElements(projectId) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving' | 'error'

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

  const schedule = useCallback(() => {
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
      setSaveState('error');

      if (isRetryable(err)) {
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

  // Carrega elementos e conexões do projeto
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Salva ao esconder a aba, avisa antes de fechar com algo pendente
  // e salva o que sobrou ao sair da página.
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

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      clearTimeout(timer.current);
      flushRef.current();
    };
  }, []);

  // Mudanças feitas pelo próprio quadro: mover, redimensionar, selecionar, remover
  const onNodesChange = useCallback(
    (changes) => {
      commitNodes((previous) => applyNodeChanges(changes, previous));

      let touched = false;
      const removedIds = [];
      for (const change of changes) {
        if (change.type === 'remove') {
          markNodeRemoved(change.id);
          removedIds.push(change.id);
          touched = true;
        } else if (change.type === 'position' && change.position) {
          markNodeDirty(change.id);
          touched = true;
        } else if (change.type === 'dimensions' && change.setAttributes) {
          // Só conta quando o usuário redimensiona (e não a medição automática inicial)
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

      if (touched) schedule();
    },
    [commitNodes, commitEdges, schedule]
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

  return {
    nodes,
    edges,
    loading,
    error,
    saveState,
    reload: load,
    onNodesChange,
    onEdgesChange,
    updateData,
    addText,
    addImage,
    addConnection,
  };
}