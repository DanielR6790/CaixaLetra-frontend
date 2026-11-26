import { api } from './api.js';

// categorySlug pode ser "all" para listar todas as categorias
export const listContents = (categorySlug) => api.get('/contents', { category: categorySlug });
export const createContent = (payload) => api.post('/contents', payload);
export const updateContent = (id, patch) => api.patch(`/contents/${id}`, patch);
export const deleteContent = (id) => api.delete(`/contents/${id}`);

// Cria ou atualiza a avaliação: { rating, reviewText }
export const saveReview = (id, review) => api.put(`/contents/${id}/review`, review);

// Remove nota e review. Com toList: true, a obra volta para a lista.
export const deleteReview = (id, { toList = false } = {}) =>
  api.delete(`/contents/${id}/review?toList=${toList}`);