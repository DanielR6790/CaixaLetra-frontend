import { useMemo, useState } from 'react';
import Modal from '../common/Modal.jsx';
import Alert from '../common/Alert.jsx';
import ContentForm from './ContentForm.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { searchContent, getContentDetails } from '../../services/searchService.js';
import { createContent } from '../../services/contentService.js';
import { uploadCover, removeUploadedCover } from '../../services/storageService.js';

const keyOf = (item) => `${item.source}:${item.externalId}`;

// Fluxo: buscar nas APIs -> escolher -> conferir/editar os dados -> confirmar.
// Se não achar, cadastro manual. A categoria "Outros" não tem API: vai direto ao manual.
export default function AddContentModal({ category, existingItems, defaultDestination, onClose, onCreated }) {
  const { user } = useAuth();
  const manualOnly = category.slug === 'outros';

  const [step, setStep] = useState(manualOnly ? 'form' : 'search');
  const [initial, setInitial] = useState(manualOnly ? { source: 'manual' } : null);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [picking, setPicking] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Obras da API que o usuário já tem nesta categoria
  const alreadyAdded = useMemo(
    () =>
      new Set(
        existingItems.filter((item) => item.externalId).map((item) => `${item.source}:${item.externalId}`)
      ),
    [existingItems]
  );

  async function handleSearch(event) {
    event.preventDefault();
    setSearchError('');
    if (query.trim().length < 2) {
      setSearchError('Digite ao menos 2 caracteres.');
      return;
    }
    setSearching(true);
    try {
      const data = await searchContent({ q: query.trim(), category: category.slug });
      setResults(data.results);
      setWarnings(data.warnings ?? []);
    } catch (err) {
      setSearchError(err.message);
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  async function handlePick(item) {
    setPicking(keyOf(item));
    setSearchError('');
    let merged = item;
    try {
      // Busca os dados completos; se falhar, usa os da lista de resultados
      const data = await getContentDetails({ category: category.slug, id: item.externalId });
      merged = { ...item, ...data.item };
    } catch {
      merged = item;
    }
    setInitial(merged);
    setSubmitError('');
    setStep('form');
    setPicking('');
  }

  function startManual() {
    setInitial({ source: 'manual', title: query.trim() });
    setSubmitError('');
    setStep('form');
  }

  async function handleSubmit(form) {
    setSubmitting(true);
    setSubmitError('');
    let uploaded = null;

    try {
      let coverUrl = form.cover.kind === 'external' ? form.cover.url : null;
      if (form.cover.kind === 'file') {
        uploaded = await uploadCover(form.cover.file, user.id);
        coverUrl = uploaded.url;
      }

      const payload = {
        categorySlug: category.slug,
        title: form.title,
        releaseYear: form.releaseYear,
        genre: form.genre,
        description: form.description,
        contentType: form.contentType,
        coverUrl,
        source: form.source,
        destination: form.destination,
      };
      if (form.externalId) payload.externalId = form.externalId;
      if (form.destination === 'avaliado') {
        payload.rating = form.rating;
        payload.reviewText = form.reviewText;
      }

      const data = await createContent(payload);
      onCreated(data.content);
      onClose();
    } catch (err) {
      // Não deixa uma imagem "solta" no Storage se o cadastro falhou
      if (uploaded) removeUploadedCover(uploaded.path);
      setSubmitError(err.message);
      setSubmitting(false);
    }
  }

  const title = step === 'search' ? `Adicionar em ${category.name}` : 'Confirmar dados';

  return (
    <Modal title={title} onClose={onClose} size="lg" closeDisabled={submitting}>
      {step === 'search' && (
        <>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Digite o nome do ${category.slug === 'jogos' ? 'jogo' : 'título'}`}
              aria-label="Nome da obra"
              disabled={searching}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={searching}>
              {searching ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          {searchError && <Alert type="error">{searchError}</Alert>}
          {warnings.map((warning) => (
            <Alert key={warning.provider} type="info">
              {warning.provider}: {warning.message}
            </Alert>
          ))}

          {results && results.length === 0 && (
            <p className="muted">Nenhum resultado encontrado para "{query.trim()}".</p>
          )}

          {results && results.length > 0 && (
            <ul className="pick-list">
              {results.map((item) => {
                const added = alreadyAdded.has(keyOf(item));
                return (
                  <li key={keyOf(item)}>
                    <button
                      type="button"
                      className="pick-item"
                      onClick={() => handlePick(item)}
                      disabled={added || Boolean(picking)}
                    >
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt="" loading="lazy" />
                      ) : (
                        <span className="pick-placeholder" aria-hidden="true" />
                      )}
                      <span className="pick-text">
                        <strong>{item.title}</strong>
                        <span className="muted">
                          {[item.year, item.contentType].filter(Boolean).join(' · ') || 'Sem detalhes'}
                        </span>
                      </span>
                      {added && <span className="status-chip status-avaliado">Já adicionado</span>}
                      {picking === keyOf(item) && <span className="muted">Carregando…</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="manual-cta">
            <p className="muted">Não encontrou a obra que procurava?</p>
            <button type="button" className="btn btn-ghost" onClick={startManual}>
              Cadastrar manualmente
            </button>
          </div>
        </>
      )}

      {step === 'form' && initial && (
        <ContentForm
          category={category}
          initial={initial}
          defaultDestination={defaultDestination}
          submitting={submitting}
          error={submitError}
          onSubmit={handleSubmit}
          onBack={manualOnly ? undefined : () => setStep('search')}
        />
      )}
    </Modal>
  );
}