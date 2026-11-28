import { api, ApiError } from './api.js';

export async function getMe() {
  const data = await api.get('/me');
  // Se a resposta vier sem perfil, mostra um erro em vez de ficar carregando para sempre
  if (!data?.profile) {
    throw new ApiError(
      'O servidor respondeu sem os dados do perfil. Reinicie o backend e recarregue a página.',
      500,
      'EMPTY_PROFILE'
    );
  }
  return data;
}

// patch: { username?, timezone?, avatarUrl? } (avatarUrl: null remove a foto). Devolve o perfil novo.
export async function updateMe(patch) {
  const data = await api.patch('/me', patch);
  if (!data?.profile) {
    throw new ApiError('O servidor respondeu sem os dados do perfil.', 500, 'EMPTY_PROFILE');
  }
  return data.profile;
}

export const getCategories = () => api.get('/categories');