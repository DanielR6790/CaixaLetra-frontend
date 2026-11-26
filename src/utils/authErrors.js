// Traduz os erros do Supabase Auth para mensagens claras em português.
export function translateAuthError(error) {
  if (!error) return '';

  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (
    error.name === 'AuthRetryableFetchError' ||
    message.includes('failed to fetch') ||
    message.includes('network')
  ) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.';
  }
  if (code === 'weak_password' || message.includes('password should')) {
    return 'A senha é muito fraca. Use ao menos 8 caracteres, com letras e números.';
  }
  if (code === 'same_password') {
    return 'A nova senha precisa ser diferente da atual.';
  }
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    error.status === 429
  ) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (code === 'signup_disabled') {
    return 'Novos cadastros estão desativados no momento.';
  }

  console.error('[Auth]', error);
  return 'Ocorreu um erro inesperado. Tente novamente.';
}