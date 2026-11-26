// Conexão com o Supabase no navegador.
// Usa SOMENTE a chave pública "anon". A segurança dos dados vem do RLS.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isFilled = (value) => Boolean(value) && !value.startsWith('COLE_AQUI');

export const isSupabaseConfigured = isFilled(url) && isFilled(anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true, // mantém o login ao recarregar a página
        autoRefreshToken: true,
        detectSessionInUrl: true, // necessário para o link de recuperar senha
      },
    })
  : null;