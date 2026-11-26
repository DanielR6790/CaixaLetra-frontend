import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import Alert from '../../components/common/Alert.jsx';
import Loading from '../../components/common/Loading.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import {
  validatePassword,
  validateConfirmPassword,
  hasErrors,
} from '../../utils/validation.js';

// Aberta pelo link enviado por e-mail. O Supabase cria uma sessão temporária
// a partir do link, e é ela que permite definir a nova senha.
export default function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <Loading fullscreen />;

  if (!session) {
    return (
      <AuthLayout
        title="Link inválido"
        footer={
          <p>
            <Link to="/recuperar-senha">Pedir um novo link</Link>
          </p>
        }
      >
        <Alert type="error">Este link de recuperação é inválido ou expirou.</Alert>
      </AuthLayout>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const found = {
      password: validatePassword(password),
      confirm: validateConfirmPassword(password, confirm),
    };
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthLayout title="Senha alterada">
        <Alert type="success">Sua senha foi atualizada com sucesso.</Alert>
        <Link to="/" className="btn btn-primary btn-block">
          Ir para o início
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Escolha uma nova senha para sua conta.">
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error">{formError}</Alert>
        <TextField
          id="password"
          label="Nova senha"
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
          label="Confirmar nova senha"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </AuthLayout>
  );
}