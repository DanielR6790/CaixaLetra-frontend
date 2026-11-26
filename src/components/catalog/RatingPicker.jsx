// Seletor de nota de 1 a 10.
export default function RatingPicker({ value, onChange, disabled = false, error }) {
  return (
    <div className={error ? 'field field-invalid' : 'field'}>
      <span className="field-label">Nota (obrigatória)</span>
      <div className="rating-picker" role="group" aria-label="Nota de 1 a 10">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            className={value === number ? 'rating-pill rating-pill-active' : 'rating-pill'}
            onClick={() => onChange(number)}
            disabled={disabled}
            aria-pressed={value === number}
          >
            {number}
          </button>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}