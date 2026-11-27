// Carrega e mantém a lista de obras de uma categoria (ou de todas, com "all").
// Toda a comunicação com o backend fica aqui, fora dos componentes visuais.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listContents,
  updateContent,
  deleteContent,
} from '../services/contentService.js';

export function useCategoryContents(slug) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await listContents(slug);
      if (id === requestId.current) setState({ items: data.contents, loading: false, error: '' });
    } catch (err) {
      if (id === requestId.current) {
        setState((current) => ({ ...current, loading: false, error: err.message }));
      }
    }
  }, [slug]);

  useEffect(() => {
    setState({ items: [], loading: true, error: '' });
    load();
  }, [load]);

  const addItem = useCallback((item) => {
    setState((current) => ({ ...current, items: [item, ...current.items] }));
  }, []);

  const replaceItem = useCallback((updated) => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === updated.id ? updated : item)),
    }));
  }, []);

  // Marca/desmarca como consumido. A tela atualiza na hora e volta atrás se o servidor recusar.
  const toggleConsumed = useCallback(
    async (item) => {
      const next = item.status === 'consumido' ? 'para_consumir' : 'consumido';
      replaceItem({ ...item, status: next });
      try {
        const data = await updateContent(item.id, { status: next });
        replaceItem(data.content);
        return { ok: true };
      } catch (err) {
        replaceItem(item);
        return { ok: false, message: err.message };
      }
    },
    [replaceItem]
  );

  // Marca/desmarca como favorito. Muda só o campo do coração (e não a obra inteira),
  // então cliques rápidos seguidos não sobrescrevem outras alterações.
  const setFavorite = useCallback((id, value) => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, isFavorite: value } : item)),
    }));
  }, []);

  const toggleFavorite = useCallback(
    async (item) => {
      const next = !item.isFavorite;
      setFavorite(item.id, next);
      try {
        await updateContent(item.id, { isFavorite: next });
        return { ok: true };
      } catch (err) {
        setFavorite(item.id, !next);
        return { ok: false, message: err.message };
      }
    },
    [setFavorite]
  );

  const removeItem = useCallback(async (item) => {
    try {
      await deleteContent(item.id);
      setState((current) => ({
        ...current,
        items: current.items.filter((entry) => entry.id !== item.id),
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }, []);

  return {
    ...state,
    reload: load,
    addItem,
    replaceItem,
    toggleConsumed,
    toggleFavorite,
    removeItem,
  };
}