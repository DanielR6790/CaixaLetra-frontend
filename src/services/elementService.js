import { api } from './api.js';

export const listElements = (projectId) => api.get(`/projects/${projectId}/elements`);

// payload: { upsert: [elementos], remove: [ids] }
export const syncElements = (projectId, payload) =>
  api.post(`/projects/${projectId}/elements/sync`, payload);

// Pede ao servidor para apagar as imagens do quadro que nenhum elemento usa mais
export const cleanupImages = (projectId, paths = [], options) =>
  api.post(`/projects/${projectId}/elements/cleanup`, { paths }, options);
