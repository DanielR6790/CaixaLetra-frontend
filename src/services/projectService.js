import { api } from './api.js';

export const listProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (values) => api.post('/projects', values);

// patch: { name?, description?, boardTheme?, viewport? }
export const updateProject = (id, patch) => api.patch(`/projects/${id}`, patch);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Cria "Nome (cópia)" com os elementos, as conexões e as imagens do quadro
export const duplicateProject = (id) => api.post(`/projects/${id}/duplicate`);
