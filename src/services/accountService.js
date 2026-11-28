import { api } from './api.js';
import { supabase } from './supabaseClient.js';
import { translateAuthError } from '../utils/authErrors.js';

// Troca a senha. Primeiro confere a senha atual (entrando de novo com ela).
export async function changePassword({ email, currentPassword, newPassword }) {
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (checkError) {
    return {
      ok: false,
      field: 'current',
      message:
        checkError.code === 'invalid_credentials'
          ? 'Senha atual incorreta.'
          : translateAuthError(checkError),
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? { ok: false, message: translateAuthError(error) } : { ok: true };
}

export const exportAccount = () => api.get('/account/export');
export const deleteAccount = (password) => api.post('/account/delete', { password });