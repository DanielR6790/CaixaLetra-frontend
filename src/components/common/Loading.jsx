export default function Loading({ fullscreen = false, label = 'Carregando…' }) {
  return (
    <div className={fullscreen ? 'loading loading-fullscreen' : 'loading'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="loading-label">{label}</span>
    </div>
  );
}