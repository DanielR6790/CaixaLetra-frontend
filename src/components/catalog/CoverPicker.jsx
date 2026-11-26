import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCEPTED_IMAGE_TYPES, validateImageFile } from '../../services/storageService.js';

// Escolha da capa: arquivo do computador, arrastar e soltar, ou Ctrl + V.
// "cover" = { kind: 'none' | 'external' | 'file', url, file }
// O arquivo só é enviado ao Storage quando o usuário salva a obra.
export default function CoverPicker({ cover, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const coverRef = useRef(cover);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    coverRef.current = cover;
  }, [cover]);

  // Libera a pré-visualização da memória ao sair da tela
  useEffect(
    () => () => {
      if (coverRef.current.kind === 'file') URL.revokeObjectURL(coverRef.current.url);
    },
    []
  );

  const acceptFile = useCallback(
    (file) => {
      const problem = validateImageFile(file);
      if (problem) {
        setLocalError(problem);
        return;
      }
      setLocalError('');
      if (coverRef.current.kind === 'file') URL.revokeObjectURL(coverRef.current.url);
      onChange({ kind: 'file', file, url: URL.createObjectURL(file) });
    },
    [onChange]
  );

  // Ctrl + V: só reage se a área de transferência tiver uma IMAGEM.
  // Colar texto continua funcionando normalmente nos campos.
  useEffect(() => {
    if (disabled) return undefined;
    const onPaste = (event) => {
      const images = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith('image/')
      );
      if (images.length === 0) return;
      event.preventDefault();
      acceptFile(images[0]);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [disabled, acceptFile]);

  function removeCover() {
    if (coverRef.current.kind === 'file') URL.revokeObjectURL(coverRef.current.url);
    if (inputRef.current) inputRef.current.value = '';
    setLocalError('');
    onChange({ kind: 'none', url: '', file: null });
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = Array.from(event.dataTransfer?.files ?? [])[0];
    if (file) acceptFile(file);
  }

  return (
    <div className="field">
      <span className="field-label">Capa</span>
      <div
        className={dragging ? 'cover-picker cover-picker-drag' : 'cover-picker'}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div className="cover-preview">
          {cover.url ? <img src={cover.url} alt="Pré-visualização da capa" /> : <span>Sem capa</span>}
        </div>

        <div className="cover-actions">
          <div className="cover-buttons">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              {cover.url ? 'Trocar imagem' : 'Escolher imagem'}
            </button>
            {cover.url && (
              <button type="button" className="btn btn-ghost" onClick={removeCover} disabled={disabled}>
                Remover capa
              </button>
            )}
          </div>
          <p className="field-hint">
            Ou arraste uma imagem até aqui, ou cole com Ctrl + V. JPG, PNG, WEBP ou GIF, até 5 MB.
          </p>
          {cover.kind === 'external' && (
            <p className="field-hint">Capa encontrada na busca. Você pode trocá-la por uma sua.</p>
          )}
          {localError && <p className="field-error">{localError}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) acceptFile(file);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}