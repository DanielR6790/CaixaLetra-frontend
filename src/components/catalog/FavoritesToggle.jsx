import HeartIcon from '../common/HeartIcon.jsx';

// Botão de filtro "Favoritos".
// variant: 'button' (barra de filtros das categorias) | 'chip' (linha do tempo)
export default function FavoritesToggle({ active, count, onChange, variant = 'button' }) {
  const base = variant === 'chip' ? 'chip fav-chip' : 'btn btn-ghost fav-btn';

  return (
    <button
      type="button"
      className={active ? `${base} fav-active` : base}
      aria-pressed={active}
      onClick={() => onChange(!active)}
      title={active ? 'Mostrando só os favoritos' : 'Mostrar só os favoritos'}
    >
      <HeartIcon filled={active} size={16} />
      Favoritos
      {count !== undefined && <span className="chip-count">{count}</span>}
    </button>
  );
}