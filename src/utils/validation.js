// Cada função devolve o texto do erro, ou '' quando o valor é válido.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Mesma regra do banco de dados (tabela profiles)
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,30}$/;

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Digite seu e-mail.';
  if (!EMAIL_REGEX.test(email)) return 'Digite um e-mail válido.';
  return '';
}

export function validateUsername(value) {
  const username = value.trim();
  if (!username) return 'Digite um nome de usuário.';
  if (!USERNAME_REGEX.test(username)) {
    return 'Use de 3 a 30 caracteres: letras, números e _ (sem espaços ou acentos).';
  }
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Digite uma senha.';
  if (value.length < 8) return 'A senha precisa ter ao menos 8 caracteres.';
  if (value.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'A senha precisa ter letras e números.';
  }
  return '';
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Confirme sua senha.';
  if (password !== confirm) return 'As senhas não são iguais.';
  return '';
}

export const hasErrors = (errors) => Object.values(errors).some(Boolean);