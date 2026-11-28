import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import Loading from '../../components/common/Loading.jsx';
import BoardCanvas from '../../components/board/BoardCanvas.jsx';
import ProjectFormModal from '../../components/ideas/ProjectFormModal.jsx';
import { useBoardElements } from '../../hooks/useBoardElements.js';
import { useBoardImages } from '../../hooks/useBoardImages.js';
import { getProject, updateProject } from '../../services/projectService.js';

const SAVE_DELAY_MS = 1000;
const round = (value) => Math.round(value * 100) / 100;

const SAVE_LABEL = {
  saved: 'Tudo salvo',
  saving: 'Salvando…',
  error: 'Erro ao salvar (tentando de novo)',
};

// Página de um projeto: barra de ferramentas + quadro infinito.
export default function ProjectBoardPage() {
  const { projectId } = useParams();
  // "key" reinicia tudo ao trocar de projeto
  return <ProjectBoard key={projectId} projectId={projectId} />;
}

function ProjectBoard({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectSave, setProjectSave] = useState('saved'); // posição, zoom e tema
  const [editing, setEditing] = useState(false);

  // Elementos e conexões do quadro, com salvamento automático, desfazer e cópias
  const board = useBoardElements(projectId);
  // Envio de imagens (botão, Ctrl + V e arrastar)
  const images = useBoardImages({ projectId, addImage: board.addImage });

  const timer = useRef(null);
  const pendingViewport = useRef(null);

  // Carrega o projeto
  useEffect(() => {
    let active = true;
    getProject(projectId)
      .then((data) => active && setProject(data.project))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [projectId]);

  // Envia a posição/zoom pendente ao banco
  const flushViewport = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;

    const viewport = pendingViewport.current;
    if (!viewport) return;
    pendingViewport.current = null;

    setProjectSave('saving');
    try {
      await updateProject(projectId, { viewport });
      setProjectSave('saved');
    } catch {
      setProjectSave('error');
    }
  }, [projectId]);

  // Salvamento automático: espera 1 s sem movimento para não sobrecarregar o banco
  const handleViewportChange = useCallback(
    (viewport) => {
      pendingViewport.current = {
        x: round(viewport.x),
        y: round(viewport.y),
        zoom: round(viewport.zoom),
      };
      setProjectSave('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(flushViewport, SAVE_DELAY_MS);
    },
    [flushViewport]
  );

  // Ao sair da página, salva o que ainda estava pendente
  useEffect(
    () => () => {
      flushViewport();
    },
    [flushViewport]
  );

  async function toggleBoardTheme() {
    const previous = project.boardTheme;
    const next = previous === 'dark' ? 'light' : 'dark';

    setProject((current) => ({ ...current, boardTheme: next }));
    setProjectSave('saving');
    try {
      await updateProject(projectId, { boardTheme: next });
      setProjectSave('saved');
    } catch {
      setProject((current) => ({ ...current, boardTheme: previous }));
      setProjectSave('error');
    }
  }

  async function handleRename(values) {
    const data = await updateProject(projectId, values);
    setProject((current) => ({ ...current, ...data.project, viewport: current.viewport }));
  }

  if (loading || board.loading) {
    return (
      <div className="main-content">
        <Loading label="Abrindo o quadro…" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="main-content">
        <Alert type="error">{error || 'Projeto não encontrado.'}</Alert>
        <Link to="/ideias" className="btn btn-ghost">
          ← Voltar aos projetos
        </Link>
      </div>
    );
  }

  if (board.error) {
    return (
      <div className="main-content">
        <Alert type="error">{board.error}</Alert>
        <div className="project-actions">
          <button type="button" className="btn btn-primary" onClick={board.reload}>
            Tentar novamente
          </button>
          <Link to="/ideias" className="btn btn-ghost">
            ← Voltar aos projetos
          </Link>
        </div>
      </div>
    );
  }

  // Estado único de salvamento: erro > salvando > salvo
  const states = [projectSave, board.saveState];
  const saveState = states.includes('error')
    ? 'error'
    : states.includes('saving')
      ? 'saving'
      : 'saved';

  // Erros que não se resolvem sozinhos (ex.: limite do quadro) mostram o motivo
  const errorLabel =
    board.saveError && !board.saveError.retrying
      ? `Erro ao salvar: ${board.saveError.message}`
      : SAVE_LABEL.error;

  const isDark = project.boardTheme === 'dark';

  return (
    <div className="board-page">
      <header className="board-bar">
        <Link to="/ideias" className="btn btn-ghost btn-sm">
          ← Projetos
        </Link>

        <h1 className="board-title" title={project.name}>
          {project.name}
        </h1>

        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
          <Icon name="edit" size={16} />
          Editar
        </button>

        <div className="board-bar-end">
          <span className={`save-status save-${saveState}`} role="status">
            {saveState === 'error' ? errorLabel : SAVE_LABEL[saveState]}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={toggleBoardTheme}>
            <Icon name={isDark ? 'sun' : 'moon'} size={16} />
            {isDark ? 'Fundo branco' : 'Fundo preto'}
          </button>
        </div>
      </header>

      <BoardCanvas
        boardTheme={project.boardTheme}
        initialViewport={project.viewport}
        onViewportChange={handleViewportChange}
        nodes={board.nodes}
        edges={board.edges}
        onNodesChange={board.onNodesChange}
        onEdgesChange={board.onEdgesChange}
        onAddText={board.addText}
        onUpdateData={board.updateData}
        onConnect={board.addConnection}
        onAddImages={images.addFiles}
        uploading={images.uploading}
        uploadError={images.error}
        onDismissUploadError={images.dismissError}
        onUndo={board.undo}
        onRedo={board.redo}
        canUndo={board.canUndo}
        canRedo={board.canRedo}
        onCopyElements={board.copySelected}
        onPasteElements={board.pasteClipboard}
        onDuplicate={board.duplicateSelected}
        onGestureStart={board.beginGesture}
        onGestureEnd={board.endGesture}
      />

      {editing && (
        <ProjectFormModal
          mode="edit"
          initial={project}
          onSubmit={handleRename}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
