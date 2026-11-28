import { useState } from 'react';
import Alert from '../common/Alert.jsx';
import TextField from '../common/TextField.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { changePassword } from '../../services/accountService.js';
import { hasErrors, validateConfirmPassword, validatePassword } from '../../utils/validation.js';

// Seção "Segurança": troca de senha.
export default function SecuritySection() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    const found = {
      current: current ? '' : 'Digite sua senha atual.',
      next: validatePassword(next),
      confirm: validateConfirmPassword(next, confirm),
    };
    if (!found.next && next === current) found.next = 'A nova senha precisa ser diferente da atual.';
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    const result = await changePassword({
      email: user.email,
      currentPassword: current,
      newPassword: next,
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.field === 'current') setErrors({ current: result.message });
      else setMessage({ type: 'error', text: result.message });
      return;
    }

    setCurrent('');
    setNext('');
    setConfirm('');
    setErrors({});
    setMessage({ type: 'success', text: 'Senha alterada com sucesso.' });
  }

  return (
    <section className="settings-card">
      <h2>Alterar senha</h2>
      <p className="muted">Por segurança, confirme a senha atual antes de definir a nova.</p>

      <form onSubmit={handleSubmit} noValidate>
        {message && <Alert type={message.type}>{message.text}</Alert>}

        <TextField
          id="settings-current-password"
          label="Senha atual"
          type="password"
          value={current}
          onChange={setCurrent}
          error={errors.current}
          autoComplete="current-password"
          disabled={submitting}
        />
        <TextField
          id="settings-new-password"
          label="Nova senha"
          type="password"
          value={next}
          onChange={setNext}
          error={errors.next}
          hint="Mínimo de 8 caracteres, com letras e números"
          autoComplete="new-password"
          disabled={submitting}
        />
        <TextField
          id="settings-confirm-password"
          label="Confirmar nova senha"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
          disabled={submitting}
        />

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Alterar senha'}
          </button>
        </div>
      </form>
    </section>
  );
}