import { useState } from 'react';
import Alert from '../common/Alert.jsx';
import TextField from '../common/TextField.jsx';
import TextArea from '../common/TextArea.jsx';
import CoverPicker from './CoverPicker.jsx';
import RatingPicker from './RatingPicker.jsx';

const DEFAULT_TYPE = { filmes: 'Filme', series: 'Série', animes: 'Anime', jogos: 'Jogo', outros: '' };

// Formulário usado tanto para obras vindas da busca (já preenchido, editável)
// quanto para o cadastro manual (vazio).
export default function ContentForm({
  category,
  initial,
  defaultDestination,
  submitting,
  error,
  onSubmit,
  onBack,
}) {
  const [title, setTitle] = useState(initial.title ?? '');
  const [year, setYear] = useState(initial.year ? String(initial.year) : '');
  const [genre, setGenre] = useState((initial.genres ?? []).join(', ').slice(0, 200));
  const [contentType, setContentType] = useState(
    initial.contentType ?? DEFAULT_TYPE[category.slug] ?? ''
  );
  const [description, setDescription] = useState((initial.description ?? '').slice(0, 10000));
  const [cover, setCover] = useState(
    initial.coverUrl
      ? { kind: 'external', url: initial.coverUrl, file: null }
      : { kind: 'none', url: '', file: null }
  );
  const [destination, setDestination] = useState(defaultDestination);
  const [rating, setRating] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();

    const found = {};
    if (!title.trim()) found.title = 'Informe o título.';
    if (year.trim()) {
      const number = Number(year);
      if (!/^\d{4}$/.test(year.trim()) || number < 1800 || number > 2200) {
        found.year = 'Informe um ano com 4 dígitos (ex.: 2019).';
      }
    }
    if (destination === 'avaliado' && !rating) found.rating = 'Escolha uma nota de 1 a 10.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      title: title.trim(),
      releaseYear: year.trim() ? Number(year) : null,
      genre: genre.trim(),
      contentType: contentType.trim(),
      description: description.trim(),
      cover,
      destination,
      rating: destination === 'avaliado' ? rating : null,
      reviewText: destination === 'avaliado' ? reviewText.trim() : '',
      source: initial.source ?? 'manual',
      externalId: initial.externalId,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert type="error">{error}</Alert>

      <CoverPicker cover={cover} onChange={setCover} disabled={submitting} />

      <TextField
        id="title"
        label="Título"
        value={title}
        onChange={setTitle}
        error={errors.title}
        maxLength={300}
        disabled={submitting}
      />

      <div className="form-row">
        <TextField
          id="year"
          label="Ano de lançamento"
          value={year}
          onChange={setYear}
          error={errors.year}
          inputMode="numeric"
          maxLength={4}
          placeholder="Ex.: 2019"
          disabled={submitting}
        />
        <TextField
          id="contentType"
          label="Tipo de conteúdo"
          value={contentType}
          onChange={setContentType}
          maxLength={60}
          placeholder={category.slug === 'outros' ? 'Ex.: Livro, Quadrinho' : undefined}
          disabled={submitting}
        />
      </div>

      <TextField
        id="genre"
        label="Gênero"
        value={genre}
        onChange={setGenre}
        maxLength={200}
        placeholder="Ex.: Ação, Drama"
        disabled={submitting}
      />

      <TextArea
        id="description"
        label="Descrição"
        value={description}
        onChange={setDescription}
        maxLength={10000}
        disabled={submitting}
      />

      <fieldset className="destination" disabled={submitting}>
        <legend>Onde adicionar?</legend>
        <label className="radio">
          <input
            type="radio"
            name="destination"
            checked={destination === 'lista'}
            onChange={() => setDestination('lista')}
          />
          {category.futureTitle}
        </label>
        <label className="radio">
          <input
            type="radio"
            name="destination"
            checked={destination === 'avaliado'}
            onChange={() => setDestination('avaliado')}
          />
          Avaliados (com nota)
        </label>
      </fieldset>

      {destination === 'avaliado' && (
        <>
          <RatingPicker
            value={rating}
            onChange={setRating}
            error={errors.rating}
            disabled={submitting}
          />
          <TextArea
            id="reviewText"
            label="Review (opcional)"
            value={reviewText}
            onChange={setReviewText}
            maxLength={20000}
            rows={5}
            disabled={submitting}
          />
        </>
      )}

      <div className="modal-actions">
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack} disabled={submitting}>
            Voltar
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar no catálogo'}
        </button>
      </div>
    </form>
  );
}