import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import Loading from '../../components/common/Loading.jsx';
import AddContentModal from '../../components/catalog/AddContentModal.jsx';
import ContentDetailModal from '../../components/catalog/ContentDetailModal.jsx';
import CategoryPickerModal from '../../components/home/CategoryPickerModal.jsx';
import HomeSearch from '../../components/home/HomeSearch.jsx';
import MonthStats from '../../components/home/MonthStats.jsx';
import ProjectsPanel from '../../components/home/ProjectsPanel.jsx';
import QueueCard from '../../components/home/QueueCard.jsx';
import ReviewRow from '../../components/home/ReviewRow.jsx';
import { categories, getCategoryBySlug } from '../../config/categories.js';
import { useCategoryContents } from '../../hooks/useCategoryContents.js';
import { useProfile } from '../../hooks/useProfile.js';
import { useProjects } from '../../hooks/useProjects.js';
import {
  QUEUE_LIMIT,
  REVIEW_LIMIT,
  filterByCategory,
  getMonthStats,
  getQueue,
  getRecentReviews,
  queueLabel,
} from '../../utils/homeData.js';
import '../../styles/home.css';

// Página inicial: fila, últimas avaliações, projetos e estatísticas do mês.
// O filtro de categoria fica no endereço (?categoria=jogos), então F5 mantém a escolha.
export default function HomePage() {
  const { profile, error: profileError, reload: reloadProfile } = useProfile();
  const timeZone = profile?.timezone ?? 'America/Sao_Paulo';

  const {
    items,
    loading,
    error,
    reload,
    addItem,
    replaceItem,
    toggleConsumed,
    toggleFavorite,
    removeItem,
  } = useCategoryContents('all');
  const projects = useProjects();

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(null);
  // null = nada aberto | 'pick' = escolhendo a categoria | objeto da categoria = cadastro aberto
  const [adding, setAdding] = useState(null);

  // Valor inválido no endereço volta para "Todos"
  const activeCategory = getCategoryBySlug(searchParams.get('categoria'));
  const categorySlug = activeCategory ? activeCategory.slug : 'all';

  function chooseCategory(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug === 'all') next.delete('categoria');
    else next.set('categoria', slug);
    setSearchParams(next, { replace: true });
  }

  function openRegister() {
    setAdding(activeCategory ?? 'pick');
  }

  const scoped = useMemo(() => filterByCategory(items, categorySlug), [items, categorySlug]);
  const queue = useMemo(() => getQueue(scoped), [scoped]);
  const reviews = useMemo(() => getRecentReviews(scoped).slice(0, REVIEW_LIMIT), [scoped]);
  const stats = useMemo(() => getMonthStats(scoped, timeZone), [scoped, timeZone]);

  // A obra aberta é lida da lista, então a janela reflete as alterações na hora
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const openItem = (item) => setSelectedId(item.id);

  const queueTitle = activeCategory ? activeCategory.futureTitle : 'Para assistir / jogar';
  const queueMoreLink = activeCategory
    ? `/catalogo/${activeCategory.slug}?secao=lista`
    : '/linha-do-tempo?status=lista';
  const diaryLink = `/linha-do-tempo?status=avaliados${
    activeCategory ? `&categoria=${activeCategory.slug}` : ''
  }`;

  return (
    <div className="main-content home">
      <header className="home-header">
        <div>
          <h1>{profile ? `Olá, ${profile.username}!` : 'Olá!'}</h1>
          <p>O que você assistiu ou jogou recentemente?</p>
        </div>

        <div className="home-actions">
          <HomeSearch items={items} onOpen={openItem} />
          <button type="button" className="btn btn-primary" onClick={openRegister}>
            <Icon name="plus" size={18} />
            Registrar obra
          </button>
        </div>
      </header>

      {profileError && (
        <Alert type="error">
          {profileError}{' '}
          <button type="button" className="link-button" onClick={reloadProfile}>
            Tentar novamente
          </button>
        </Alert>
      )}

      <div className="chip-row home-chips" role="group" aria-label="Filtrar por categoria">
        <button
          type="button"
          aria-pressed={categorySlug === 'all'}
          className={categorySlug === 'all' ? 'chip chip-active' : 'chip'}
          onClick={() => chooseCategory('all')}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            aria-pressed={categorySlug === category.slug}
            className={categorySlug === category.slug ? 'chip chip-active' : 'chip'}
            onClick={() => chooseCategory(category.slug)}
          >
            <Icon name={category.icon} size={15} />
            {category.name}
          </button>
        ))}
      </div>

      {loading && <Loading label="Carregando seu catálogo…" />}

      {!loading && error && (
        <Alert type="error">
          {error}{' '}
          <button type="button" className="link-button" onClick={reload}>
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && (
        <>
          <section className="home-section" aria-labelledby="queue-title">
            <div className="home-section-head">
              <h2 id="queue-title">
                <Icon name="bookmark" size={18} />
                {queueTitle}
              </h2>
              <span className="muted">
                {queueLabel(queue.length)}
                {queue.length > QUEUE_LIMIT && (
                  <>
                    {' · '}
                    <Link to={queueMoreLink} className="home-link">
                      Ver todos →
                    </Link>
                  </>
                )}
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="empty-state">
                <Icon name="bookmark" size={32} />
                <h2>Sua fila está vazia</h2>
                <p>Registre o que você quer assistir ou jogar mais tarde.</p>
                <button type="button" className="btn btn-primary" onClick={openRegister}>
                  <Icon name="plus" size={18} />
                  Registrar obra
                </button>
              </div>
            ) : (
              <div className="queue-grid">
                {queue.slice(0, QUEUE_LIMIT).map((item) => (
                  <QueueCard key={item.id} item={item} timeZone={timeZone} onOpen={openItem} />
                ))}
              </div>
            )}
          </section>

          <div className="home-columns">
            <section aria-labelledby="reviews-title">
              <div className="home-section-head">
                <h2 id="reviews-title">
                  <Icon name="star" size={18} />
                  Últimas avaliações
                </h2>
                <Link to={diaryLink} className="home-link">
                  Ver diário completo →
                </Link>
              </div>

              {reviews.length === 0 ? (
                <div className="empty-state">
                  <Icon name="star" size={32} />
                  <h2>Nenhuma avaliação ainda</h2>
                  <p>As obras que você avaliar, com nota e review, aparecem aqui.</p>
                </div>
              ) : (
                <ul className="review-list">
                  {reviews.map((item) => (
                    <li key={item.id}>
                      <ReviewRow item={item} timeZone={timeZone} onOpen={openItem} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="home-column-stack">
              <ProjectsPanel
                projects={projects.projects}
                loading={projects.loading}
                error={projects.error}
                timeZone={timeZone}
                onRetry={projects.reload}
              />
              <MonthStats stats={stats} scopeLabel={activeCategory?.name} />
            </aside>
          </div>
        </>
      )}

      {adding === 'pick' && (
        <CategoryPickerModal onPick={setAdding} onClose={() => setAdding(null)} />
      )}

      {adding && adding !== 'pick' && (
        <AddContentModal
          category={adding}
          existingItems={items.filter((item) => item.categorySlug === adding.slug)}
          defaultDestination="lista"
          onClose={() => setAdding(null)}
          onCreated={addItem}
        />
      )}

      {selected && (
        <ContentDetailModal
          key={selected.id}
          item={selected}
          timeZone={timeZone}
          onClose={() => setSelectedId(null)}
          onChanged={replaceItem}
          onToggleConsumed={toggleConsumed}
          onToggleFavorite={toggleFavorite}
          onRemove={removeItem}
        />
      )}
    </div>
  );
}