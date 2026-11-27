import { Link } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import Loading from '../common/Loading.jsx';
import { formatDate } from '../../utils/dates.js';
import { PROJECT_LIMIT } from '../../utils/homeData.js';

// Os projetos de ideias mais recentes, com atalho para abrir o quadro.
export default function ProjectsPanel({ projects, loading, error, timeZone, onRetry }) {
  const shown = projects.slice(0, PROJECT_LIMIT);

  return (
    <section className="home-card" aria-labelledby="projects-title">
      <div className="panel-head">
        <h2 id="projects-title">
          <Icon name="lightbulb" size={18} />
          Meus projetos
        </h2>
        <Link to="/ideias" className="home-link">
          Ver todos →
        </Link>
      </div>

      {loading && <Loading label="Carregando projetos…" />}

      {!loading && error && (
        <p className="muted">
          {error}{' '}
          <button type="button" className="link-button" onClick={onRetry}>
            Tentar novamente
          </button>
        </p>
      )}

      {!loading && !error && shown.length === 0 && (
        <div className="panel-empty">
          <p className="muted">Nenhum projeto ainda. Crie um quadro para organizar suas ideias.</p>
          <Link to="/ideias" className="btn btn-ghost btn-sm">
            Criar projeto
          </Link>
        </div>
      )}

      {!loading && !error && shown.length > 0 && (
        <ul className="project-mini-list">
          {shown.map((project) => (
            <li key={project.id}>
              <Link to={`/ideias/${project.id}`} className="project-mini">
                <span className="project-mini-head">
                  <span className="tile-icon">
                    <Icon name="lightbulb" size={16} />
                  </span>
                  <h3 title={project.name}>{project.name}</h3>
                </span>
                <p>{project.description || 'Sem descrição'}</p>
                <span className="project-mini-foot">
                  <span>Atualizado em {formatDate(project.updatedAt, timeZone)}</span>
                  <span className="project-mini-open">Abrir quadro →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}