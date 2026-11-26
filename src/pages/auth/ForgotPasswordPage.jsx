import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import TextField from '../../components/common/TextField.jsx';
import Alert from '../../components/common/Alert.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { validateEmail } from '../../utils/validation.js';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;

    setSubmitting(true);
    const result = await requestPasswordReset(email.trim().toLowerCase());
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <p>
          <Link to="/login">Voltar para o login</Link>
        </p>
      }
    >
      {sent ? (
        // Mensagem igual exista ou não a conta, para não revelar quem tem cadastro
        <Alert type="success">
          Se existir uma conta com este e-mail, você receberá um link de recuperação em instantes.
          Verifique também a caixa de spam.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Alert type="error">{formError}</Alert>
          <TextField
            id="email"
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            error={error}
            autoComplete="email"
            disabled={submitting}
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}