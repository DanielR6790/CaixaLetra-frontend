import { Link } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { formatDate, formatDateTime } from '../../utils/dates.js';

// Card de um projeto: nome, descrição, datas e ações (abrir, editar, duplicar, excluir).
export default function ProjectCard({
  project,
  timeZone,
  busy = false,
  duplicateDisabled = false,
  onEdit,
  onDuplicate,
  onDelete,
}) {
  return (
    <article className="project-card">
      <Link to={`/ideias/${project.id}`} className="project-card-main">
        <span className="tile-icon">
          <Icon name="lightbulb" size={22} />
        </span>
        <h3 title={project.name}>{project.name}</h3>
        <p className="project-desc">{project.description || 'Sem descrição'}</p>
      </Link>

      <div className="project-meta">
        <span>Criado em {formatDate(project.createdAt, timeZone)}</span>
        <span>Atualizado em {formatDateTime(project.updatedAt, timeZone)}</span>
      </div>

      <div className="project-actions">
        <Link to={`/ideias/${project.id}`} className="btn btn-primary btn-sm">
          Abrir
        </Link>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(project)}>
          <Icon name="edit" size={16} />
          Editar
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onDuplicate(project)}
          disabled={busy || duplicateDisabled}
          title="Cria uma cópia do projeto, com o quadro inteiro"
        >
          <Icon name="copy" size={16} />
          {busy ? 'Duplicando…' : 'Duplicar'}
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(project)}>
          <Icon name="trash" size={16} />
          Excluir
        </button>
      </div>
    </article>
  );
}
