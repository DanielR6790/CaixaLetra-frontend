import { useEffect } from 'react';
import Icon from './Icon.jsx';

// Janela sobre a página. Fecha com Esc, clique fora ou no X
// (desativado enquanto "closeDisabled" for verdadeiro, ex.: durante um envio).
export default function Modal({ title, onClose, children, size = 'md', closeDisabled = false }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabled) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // trava a rolagem da página ao fundo
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, closeDisabled]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Fechar"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}