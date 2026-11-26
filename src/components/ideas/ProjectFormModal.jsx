import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Alert from '../common/Alert.jsx';
import TextField from '../common/TextField.jsx';
import TextArea from '../common/TextArea.jsx';

// Janela para criar um projeto ou editar nome e descrição de um existente.
// "onSubmit" recebe { name, description } e deve lançar erro se falhar.
export default function ProjectFormModal({ mode, initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setNameError('Informe o nome do projeto.');
      return;
    }
    setNameError('');

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={mode === 'edit' ? 'Editar projeto' : 'Novo projeto'}
      onClose={onClose}
      closeDisabled={submitting}
    >
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error">{error}</Alert>

        <TextField
          id="project-name"
          label="Nome do projeto"
          value={name}
          onChange={setName}
          error={nameError}
          maxLength={120}
          placeholder="Ex.: Planejamento da história"
          disabled={submitting}
          autoFocus
        />
        <TextArea
          id="project-description"
          label="Descrição (opcional)"
          value={description}
          onChange={setDescription}
          maxLength={2000}
          rows={4}
          disabled={submitting}
        />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Salvando…' : mode === 'edit' ? 'Salvar' : 'Criar projeto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}