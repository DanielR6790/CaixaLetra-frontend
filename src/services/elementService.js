import { api } from './api.js';

export const listElements = (projectId) => api.get(`/projects/${projectId}/elements`);

// payload: { upsert: [elementos], remove: [ids] }
export const syncElements = (projectId, payload) =>
  api.post(`/projects/${projectId}/elements/sync`, payload);