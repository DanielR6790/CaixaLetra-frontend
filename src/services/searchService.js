import { api } from './api.js';

// category: 'all' | 'filmes' | 'series' | 'animes' | 'jogos' | 'outros'
export const searchContent = ({ q, category = 'all' }) => api.get('/search', { q, category });

// Dados completos de uma obra escolhida nos resultados
export const getContentDetails = ({ category, id }) => api.get('/search/details', { category, id });