import { formatAverage } from '../../utils/homeData.js';
import { MONTH_NAMES } from '../../utils/timeline.js';

// Estatísticas do mês atual (no fuso horário do perfil).
export default function MonthStats({ stats, scopeLabel }) {
  const { period } = stats;

  return (
    <section className="home-card" aria-labelledby="stats-title">
      <h2 id="stats-title" className="stats-title">
        Estatísticas do mês
      </h2>
      <p className="stats-period">
        {MONTH_NAMES[period.month - 1]} de {period.year}
        {scopeLabel ? ` · ${scopeLabel}` : ''}
      </p>

      <div className="stats-grid">
        <div className="stat">
          <strong>{stats.added}</strong>
          <span>Obras registradas</span>
        </div>
        <div className="stat">
          <strong>
            {stats.average === null ? (
              '—'
            ) : (
              <>
                {formatAverage(stats.average)}
                <small>/10</small>
              </>
            )}
          </strong>
          <span>
            {stats.rated === 0
              ? 'Média de notas'
              : `Média de ${stats.rated} ${stats.rated === 1 ? 'nota' : 'notas'}`}
          </span>
        </div>
      </div>
    </section>
  );
}