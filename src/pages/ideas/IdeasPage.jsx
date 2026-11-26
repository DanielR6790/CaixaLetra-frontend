import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import Loading from '../../components/common/Loading.jsx';
import ProjectCard from '../../components/ideas/ProjectCard.jsx';
import ProjectFormModal from '../../components/ideas/ProjectFormModal.jsx';
import { useProjects } from '../../hooks/useProjects.js';
import { useProfile } from '../../hooks/useProfile.js';

// Lista dos projetos de ideias do usuário.
export default function IdeasPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const timeZone = profile?.timezone ?? 'America/Sao_Paulo';
  const { projects, loading, error, reload, create, update, remove } = useProjects();

  // null = nenhuma janela aberta | { mode: 'create' } | { mode: 'edit', project }
  const [form, setForm] = useState(null);
  const [actionError, setActionError] = useState('');

  async function handleDelete(project) {
    const confirmed = window.confirm(
      `Excluir o projeto "${project.name}"?\n\n` +
        'Todo o quadro (textos, imagens e conexões) será apagado e isso não pode ser desfeito.'
    );
    if (!confirmed) return;

    setActionError('');
    const result = await remove(project);
    if (!result.ok) setActionError(result.message);
  }

  async function handleSubmit(values) {
    if (form.mode === 'edit') {
      await update(form.project.id, values);
      return;
    }
    const project = await create(values);
    // Depois de criar, já abre o quadro do novo projeto
    navigate(`/ideias/${project.id}`);
  }

  return (
    <div className="main-content">
      <header className="page-header page-header-row">
        <div>
          <h1>Organização de ideias</h1>
          <p>Seus projetos, cada um com um quadro infinito para organizar suas ideias.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setForm({ mode: 'create' })}>
          <Icon name="plus" size={18} />
          Novo projeto
        </button>
      </header>

      {actionError && <Alert type="error">{actionError}</Alert>}

      {loading && <Loading label="Carregando projetos…" />}

      {!loading && error && (
        <Alert type="error">
          {error}{' '}
          <button type="button" className="link-button" onClick={reload}>
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="empty-state">
          <Icon name="lightbulb" size={36} />
          <h2>Nenhum projeto ainda</h2>
          <p>
            Crie um projeto para cada assunto: uma história, ideias de jogos, estudos... Cada um tem
            o seu próprio quadro livre.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setForm({ mode: 'create' })}>
            <Icon name="plus" size={18} />
            Criar primeiro projeto
          </button>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              timeZone={timeZone}
              onEdit={(entry) => setForm({ mode: 'edit', project: entry })}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {form && (
        <ProjectFormModal
          mode={form.mode}
          initial={form.project}
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}