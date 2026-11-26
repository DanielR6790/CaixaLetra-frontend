import { api } from './api.js';

export const listConnections = (projectId) => api.get(`/projects/${projectId}/connections`);

// payload: { upsert: [{ id, sourceId, targetId }], remove: [ids] }
export const syncConnections = (projectId, payload) =>
  api.post(`/projects/${projectId}/connections/sync`, payload);