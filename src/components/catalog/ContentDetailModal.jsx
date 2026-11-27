import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Alert from '../common/Alert.jsx';
import Icon from '../common/Icon.jsx';
import HeartIcon from '../common/HeartIcon.jsx';
import ReviewForm from './ReviewForm.jsx';
import CoverEditor from './CoverEditor.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getCategoryBySlug } from '../../config/categories.js';
import { saveReview, deleteReview, updateContent } from '../../services/contentService.js';
import { uploadCover, removeUploadedCover } from '../../services/storageService.js';
import { formatDateTime } from '../../utils/dates.js';
import { STATUS_LABEL } from '../../utils/status.js';

// Página da obra (janela). Modos: 'view' (informações), 'review' (editar a
// avaliação ou adicionar aos avaliados) e 'cover' (alterar a capa).
export default function ContentDetailModal({
  item,
  timeZone,
  onClose,
  onChanged,
  onToggleConsumed,
  onToggleFavorite,
  onRemove,
}) {
  const { user } = useAuth();
  const category = getCategoryBySlug(item.categorySlug);
  const [mode, setMode] = useState('view');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Executa uma ação mostrando "ocupado" e qualquer erro na janela
  async function run(task) {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const handleSaveReview = (values) =>
    run(async () => {
      const data = await saveReview(item.id, values);
      onChanged(data.content);
      setMode('view');
    });

  const handleClearText = () => {
    if (!window.confirm('Excluir o texto da review? A nota será mantida.')) return;
    run(async () => {
      const data = await saveReview(item.id, { rating: item.review.rating, reviewText: '' });
      onChanged(data.content);
    });
  };

  const handleMoveToList = () => {
    const target = category?.futureTitle ?? 'a lista';
    if (!window.confirm(`Mover para "${target}"? A nota e a review serão apagadas.`)) return;
    run(async () => {
      const data = await deleteReview(item.id, { toList: true });
      onChanged(data.content);
    });
  };

  const handleSaveCover = (cover) =>
    run(async () => {
      let uploaded = null;
      try {
        let coverUrl = item.coverUrl ?? null;
        if (cover.kind === 'file') {
          uploaded = await uploadCover(cover.file, user.id);
          coverUrl = uploaded.url;
        } else if (cover.kind === 'none') {
          coverUrl = null;
        }

        if (coverUrl === (item.coverUrl ?? null)) {
          setMode('view'); // nada mudou
          return;
        }

        const data = await updateContent(item.id, { coverUrl });
        onChanged(data.content);
        setMode('view');
      } catch (err) {
        // Não deixa uma imagem "solta" no Storage se a troca falhou
        if (uploaded) removeUploadedCover(uploaded.path);
        throw err;
      }
    });

  const handleToggle = () =>
    run(async () => {
      const result = await onToggleConsumed(item);
      if (!result.ok) throw new Error(result.message);
    });

  const handleToggleFavorite = () =>
    run(async () => {
      const result = await onToggleFavorite(item);
      if (!result.ok) throw new Error(result.message);
    });

  async function handleRemove() {
    const extra = item.review ? ' Sua nota e sua review também serão apagadas.' : '';
    if (!window.confirm(`Remover "${item.title}" do catálogo?${extra}`)) return;
    setBusy(true);
    setError('');
    const result = await onRemove(item);
    if (result.ok) {
      onClose();
      return;
    }
    setError(result.message);
    setBusy(false);
  }

  const meta = [item.releaseYear, item.contentType, category?.name].filter(Boolean).join(' · ');
  const favorite = Boolean(item.isFavorite);

  return (
    <Modal title={item.title} onClose={onClose} size="lg" closeDisabled={busy}>
      <Alert type="error">{error}</Alert>

      <div className="detail-layout">
        <div className="detail-cover">
          {item.coverUrl ? (
            <img src={item.coverUrl} alt={`Capa de ${item.title}`} />
          ) : (
            <span className="media-cover-empty" aria-hidden="true">
              {item.title.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="detail-info">
          <p className="muted">{meta}</p>
          {item.genre && <p>{item.genre}</p>}
          <p className="media-date">Adicionado em {formatDateTime(item.addedAt, timeZone)}</p>
          {item.consumedAt && (
            <p className="media-date">Consumido em {formatDateTime(item.consumedAt, timeZone)}</p>
          )}

          <span className={`status-chip status-${item.status}`}>{STATUS_LABEL[item.status]}</span>

          {item.status !== 'avaliado' && (
            <label className="check">
              <input
                type="checkbox"
                checked={item.status === 'consumido'}
                onChange={handleToggle}
                disabled={busy}
              />
              Marcar como consumido
            </label>
          )}

          <button
            type="button"
            className={
              favorite
                ? 'btn btn-ghost btn-sm fav-toggle fav-active'
                : 'btn btn-ghost btn-sm fav-toggle'
            }
            onClick={handleToggleFavorite}
            disabled={busy}
            aria-pressed={favorite}
          >
            <HeartIcon filled={favorite} size={16} />
            {favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          </button>

          {item.description && <p className="detail-description">{item.description}</p>}
        </div>
      </div>

      {mode === 'cover' && (
        <section className="review-box">
          <h3>Alterar capa</h3>
          <CoverEditor
            currentUrl={item.coverUrl}
            submitting={busy}
            onSave={handleSaveCover}
            onCancel={() => setMode('view')}
          />
        </section>
      )}

      {mode === 'review' && (
        <section className="review-box">
          <h3>{item.review ? 'Editar avaliação' : 'Adicionar aos avaliados'}</h3>
          <ReviewForm
            initialRating={item.review?.rating}
            initialText={item.review?.reviewText}
            submitLabel={item.review ? 'Salvar alterações' : 'Salvar avaliação'}
            submitting={busy}
            onSubmit={handleSaveReview}
            onCancel={() => setMode('view')}
          />
        </section>
      )}

      {mode === 'view' && (
        <>
          <section className="review-box">
            <h3>Avaliação</h3>

            {item.review ? (
              <>
                <div className="review-head">
                  <span className="rating-badge rating-inline">
                    {item.review.rating}
                    <small>/10</small>
                  </span>
                  <span className="muted">
                    Avaliada em {formatDateTime(item.review.createdAt, timeZone)}
                  </span>
                </div>

                {item.review.reviewText ? (
                  <p className="review-text">{item.review.reviewText}</p>
                ) : (
                  <p className="muted">Sem review escrita.</p>
                )}

                <div className="detail-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setMode('review')}
                    disabled={busy}
                  >
                    <Icon name="edit" size={16} />
                    Editar avaliação
                  </button>
                  {item.review.reviewText && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={handleClearText}
                      disabled={busy}
                    >
                      Excluir review
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleMoveToList}
                    disabled={busy}
                  >
                    <Icon name="bookmark" size={16} />
                    Mover para {category?.futureTitle ?? 'a lista'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="muted">Esta obra ainda não foi avaliada.</p>
                <div className="detail-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setMode('review')}
                    disabled={busy}
                  >
                    <Icon name="star" size={16} />
                    Adicionar aos avaliados
                  </button>
                </div>
              </>
            )}
          </section>

          <div className="detail-actions detail-actions-end">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setMode('cover')}
              disabled={busy}
            >
              Alterar capa
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleRemove}
              disabled={busy}
            >
              <Icon name="trash" size={16} />
              Remover obra
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}