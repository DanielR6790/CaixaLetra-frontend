// Cliente HTTP do backend. Envia automaticamente o token do usuário logado.
import { supabase } from './supabaseClient.js';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');

// Folga para o plano gratuito da hospedagem: depois de um tempo parado, o
// servidor leva cerca de 1 minuto para "acordar" na primeira requisição.
const REQUEST_TIMEOUT_MS = 60000;

export class ApiError extends Error {
  constructor(message, status = 0, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// Acorda o servidor assim que o site abre (enquanto a pessoa ainda digita o login).
// Não espera resposta e ignora erros.
export function warmUpBackend() {
  fetch(`${API_URL}/health`, { cache: 'no-store', signal: AbortSignal.timeout(90000) }).catch(
    () => {}
  );
}

// Rejeita com erro claro se a promessa demorar demais
function withTimeout(promise, ms, message, code) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ApiError(message, 0, code)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function request(path, { method = 'GET', params, body } = {}) {
  const {
    data: { session },
  } = await withTimeout(
    supabase.auth.getSession(),
    5000,
    'Não foi possível ler sua sessão de login. Recarregue a página ou entre novamente.',
    'SESSION_TIMEOUT'
  );

  if (!session) throw new ApiError('Você precisa estar logado.', 401, 'UNAUTHENTICATED');

  const query = params ? `?${new URLSearchParams(params).toString()}` : '';

  let response;
  try {
    response = await fetch(`${API_URL}${path}${query}`, {
      method,
      cache: 'no-store', // nunca reaproveitar respostas guardadas
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      throw new ApiError(
        'O servidor demorou demais para responder. Se ele estava em repouso, leva cerca de 1 minuto para acordar: aguarde um pouco e tente de novo.',
        0,
        'TIMEOUT'
      );
    }
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente de novo.',
      0,
      'NETWORK_ERROR'
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // resposta sem corpo
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? 'Erro ao se comunicar com o servidor.',
      response.status,
      payload?.error?.code
    );
  }
  return payload;
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};