import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import Alert from '../../components/common/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { validateEmail, hasErrors } from '../../utils/validation.js';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const found = {
      email: validateEmail(email),
      password: password ? '' : 'Digite sua senha.',
    };
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    const result = await signIn({ email: email.trim(), password });
    if (!result.ok) {
      setFormError(result.message);
      setSubmitting(false);
    }
    // Em caso de sucesso, o PublicOnlyRoute redireciona sozinho.
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse seu catálogo e seus projetos."
      footer={
        <p>
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error">{formError}</Alert>

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
          autoComplete="current-password"
          disabled={submitting}
        />

        <div className="auth-row">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  );
}