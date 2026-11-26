// Carrega e mantém a lista de projetos de ideias.
// Toda a comunicação com o backend fica aqui, fora dos componentes visuais.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../services/projectService.js';

export function useProjects() {
  const [state, setState] = useState({ projects: [], loading: true, error: '' });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await listProjects();
      if (id === requestId.current) setState({ projects: data.projects, loading: false, error: '' });
    } catch (err) {
      if (id === requestId.current) {
        setState((current) => ({ ...current, loading: false, error: err.message }));
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // create e update lançam erro: quem chama (a janela do formulário) mostra a mensagem
  const create = useCallback(async (values) => {
    const data = await createProject(values);
    setState((current) => ({ ...current, projects: [data.project, ...current.projects] }));
    return data.project;
  }, []);

  const update = useCallback(async (id, patch) => {
    const data = await updateProject(id, patch);
    setState((current) => ({
      ...current,
      // o projeto atualizado sobe para o topo (lista ordenada por atualização)
      projects: [data.project, ...current.projects.filter((project) => project.id !== id)],
    }));
    return data.project;
  }, []);

  const remove = useCallback(async (project) => {
    try {
      await deleteProject(project.id);
      setState((current) => ({
        ...current,
        projects: current.projects.filter((entry) => entry.id !== project.id),
      }));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }, []);

  return { ...state, reload: load, create, update, remove };
}