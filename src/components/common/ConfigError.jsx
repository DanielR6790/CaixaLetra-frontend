// Mostrado quando o arquivo frontend/.env ainda não foi preenchido.
export default function ConfigError() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Configuração pendente</h1>
        <p className="auth-subtitle">
          Preencha o arquivo <code>frontend/.env</code> com <code>VITE_SUPABASE_URL</code> e{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> (use o modelo <code>frontend/.env.example</code>).
        </p>
        <p className="auth-subtitle">
          Depois, pare o servidor com <code>Ctrl + C</code> e rode <code>npm run dev</code> de novo.
        </p>
      </div>
    </main>
  );
}