import { useState } from 'react';
import CoverPicker from './CoverPicker.jsx';

// Troca da capa de uma obra já cadastrada.
// "kind: current" = a capa que já existe (nada será enviado ao salvar).
export default function CoverEditor({ currentUrl, submitting, onSave, onCancel }) {
  const [cover, setCover] = useState(
    currentUrl
      ? { kind: 'current', url: currentUrl, file: null }
      : { kind: 'none', url: '', file: null }
  );

  return (
    <div>
      <CoverPicker cover={cover} onChange={setCover} disabled={submitting} />
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onSave(cover)}
          disabled={submitting}
        >
          {submitting ? 'Salvando…' : 'Salvar capa'}
        </button>
      </div>
    </div>
  );
}