import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import Alert from '../../components/common/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  hasErrors,
} from '../../utils/validation.js';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const found = {
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirmPassword(password, confirm),
    };
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    const result = await signUp({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (!result.ok) {
      setFormError(result.message);
      setSubmitting(false);
      return;
    }

    // Se o Supabase exige confirmação por e-mail, avisamos o usuário.
    // Caso contrário, ele já está logado e o PublicOnlyRoute redireciona.
    if (result.needsConfirmation) {
      setNeedsConfirmation(true);
      setSubmitting(false);
    }
  }

  if (needsConfirmation) {
    return (
      <AuthLayout
        title="Verifique seu e-mail"
        footer={
          <p>
            <Link to="/login">Voltar para o login</Link>
          </p>
        }
      >
        <Alert type="success">
          Conta criada! Enviamos um link de confirmação para <strong>{email.trim()}</strong>. Depois
          de confirmar, volte e entre.
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={
        <p>
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error">{formError}</Alert>

        <TextField
          id="username"
          label="Nome de usuário"
          value={username}
          onChange={setUsername}
          error={errors.username}
          hint="3 a 30 caracteres: letras, números e _"
          autoComplete="username"
          disabled={submitting}
        />
        <TextField
          id="email"
          label="E-mail"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
          disabled={submitting}
        />
        <TextField
          id="password"
          label="Senha"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          hint="Mínimo de 8 caracteres, com letras e números"
          autoComplete="new-password"
          disabled={submitting}
        />
        <TextField
          id="confirm"
          label="Confirmar senha"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
          disabled={submitting}
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
    </AuthLayout>
  );
}