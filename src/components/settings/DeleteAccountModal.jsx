import { useState } from 'react';
import Alert from '../common/Alert.jsx';
import Modal from '../common/Modal.jsx';
import TextField from '../common/TextField.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { deleteAccount } from '../../services/accountService.js';

const CONFIRM_WORD = 'EXCLUIR';

// Confirmação da exclusão da conta: digitar a palavra EXCLUIR e a senha.
export default function DeleteAccountModal({ onClose }) {
  const { signOut } = useAuth();
  const [word, setWord] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const ready = word.trim() === CONFIRM_WORD && password.length > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!ready) return;

    setSubmitting(true);
    setError('');
    try {
      await deleteAccount(password);
      window.alert('Sua conta foi excluída. Obrigado por ter usado a plataforma.');
      await signOut();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Excluir minha conta" onClose={onClose} closeDisabled={submitting}>
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error">{error}</Alert>

        <p>
          Isto apaga <strong>de forma definitiva</strong> o seu perfil, o catálogo (obras, notas e reviews),
          todos os projetos e quadros e as suas imagens. Não há como desfazer.
        </p>
        <p className="muted">Se quiser guardar seus dados, exporte-os antes, na seção “Meus dados”.</p>

        <TextField
          id="delete-confirm-word"
          label={`Digite ${CONFIRM_WORD} para confirmar`}
          value={word}
          onChange={setWord}
          autoComplete="off"
          disabled={submitting}
        />
        <TextField
          id="delete-password"
          label="Sua senha"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={submitting}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-danger" disabled={!ready || submitting}>
            {submitting ? 'Excluindo…' : 'Excluir minha conta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}