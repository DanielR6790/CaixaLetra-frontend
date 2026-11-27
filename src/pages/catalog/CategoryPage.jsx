import { useMemo, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import Loading from '../../components/common/Loading.jsx';
import AddContentModal from '../../components/catalog/AddContentModal.jsx';
import CatalogToolbar from '../../components/catalog/CatalogToolbar.jsx';
import ContentCard from '../../components/catalog/ContentCard.jsx';
import ContentDetailModal from '../../components/catalog/ContentDetailModal.jsx';
import TimelineView from '../../components/catalog/TimelineView.jsx';
import { getCategoryBySlug } from '../../config/categories.js';
import { useCategoryContents } from '../../hooks/useCategoryContents.js';
import { useProfile } from '../../hooks/useProfile.js';
import { applyFilters, DEFAULT_FILTERS } from '../../utils/catalogFilters.js';

// Página de uma categoria. A seção aberta fica no endereço (?secao=lista),
// então F5 e o botão "voltar" do navegador funcionam direito.
export default function CategoryPage() {
  const { slug } = useParams();
  const category = getCategoryBySlug(slug);

  if (!category) return <Navigate to="/" replace />;
  // "key" reinicia filtros e lista ao trocar de categoria
  return <CategoryView key={category.slug} category={category} />;
}

function CategoryView({ category }) {
  const { profile } = useProfile();
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
  } = useCategoryContents(category.slug);

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [actionError, setActionError] = useState('');

  const sections = [
    {
      id: 'avaliados',
      label: 'Avaliados',
      icon: 'star',
      filter: (item) => item.status === 'avaliado',
      emptyTitle: 'Nada avaliado ainda',
      emptyText: `O que você avaliar em ${category.name}, com nota e review, aparecerá aqui.`,
    },
    {
      id: 'lista',
      label: category.futureTitle,
      icon: 'bookmark',
      filter: (item) => item.status !== 'avaliado',
      emptyTitle: 'Sua lista está vazia',
      emptyText: `Guarde aqui o que você quer ${category.futureVerb} mais tarde.`,
    },
    {
      id: 'todos',
      label: 'Todos os conteúdos',
      icon: 'list',
      filter: () => true,
      emptyTitle: 'Nenhum conteúdo cadastrado',
      emptyText: `Tudo o que você adicionar em ${category.name} aparecerá aqui.`,
    },
    {
      id: 'datas',
      label: 'Por data',
      icon: 'calendar',
      filter: () => true,
      emptyTitle: 'Nada por aqui ainda',
      emptyText: `As obras de ${category.name} aparecerão organizadas por ano e mês de adição.`,
    },
  ];

  const requested = searchParams.get('secao');
  const active = sections.find((section) => section.id === requested) ?? sections[0];

  const sectionItems = useMemo(() => items.filter(active.filter), [items, active]);
  const visibleItems = useMemo(() => applyFilters(sectionItems, filters), [sectionItems, filters]);
  const favoritesCount = useMemo(
    () => sectionItems.filter((item) => item.isFavorite).length,
    [sectionItems]
  );
  const types = useMemo(
    () => [...new Set(items.map((item) => item.contentType).filter(Boolean))].sort(),
    [items]
  );

  // A obra aberta é sempre lida da lista, então reflete as alterações na hora
  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function handleToggle(item) {
    setActionError('');
    const result = await toggleConsumed(item);
    if (!result.ok) setActionError(result.message);
  }

  async function handleToggleFavorite(item) {
    setActionError('');
    const result = await toggleFavorite(item);
    if (!result.ok) setActionError(result.message);
  }

  async function handleRemove(item) {
    const extra = item.review ? ' Sua nota e sua review também serão apagadas.' : '';
    if (!window.confirm(`Remover "${item.title}" do catálogo?${extra}`)) return;
    setActionError('');
    const result = await removeItem(item);
    if (!result.ok) setActionError(result.message);
  }

  return (
    <div className="main-content">
      <header className="page-header page-header-row">
        <div>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Icon name="plus" size={18} />
          Adicionar
        </button>
      </header>

      <div className="tabs" role="tablist" aria-label={`Seções de ${category.name}`}>
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            role="tab"
            id={`tab-${section.id}`}
            aria-selected={section.id === active.id}
            aria-controls="tabpanel"
            className={section.id === active.id ? 'tab tab-active' : 'tab'}
            onClick={() => setSearchParams({ secao: section.id }, { replace: true })}
          >
            <Icon name={section.icon} size={18} />
            {section.label}
            {!loading && <span className="tab-count">{items.filter(section.filter).length}</span>}
          </button>
        ))}
      </div>

      <section
        id="tabpanel"
        role="tabpanel"
        aria-labelledby={`tab-${active.id}`}
        key={active.id}
        className="tab-panel"
      >
        {actionError && <Alert type="error">{actionError}</Alert>}

        {loading && <Loading label="Carregando catálogo…" />}

        {!loading && error && (
          <Alert type="error">
            {error}{' '}
            <button type="button" className="link-button" onClick={reload}>
              Tentar novamente
            </button>
          </Alert>
        )}

        {!loading && !error && sectionItems.length === 0 && (
          <div className="empty-state">
            <Icon name={active.icon} size={36} />
            <h2>{active.emptyTitle}</h2>
            <p>{active.emptyText}</p>
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Icon name="plus" size={18} />
              Adicionar
            </button>
          </div>
        )}

        {!loading && !error && sectionItems.length > 0 && active.id === 'datas' && (
          <TimelineView
            items={sectionItems}
            timeZone={timeZone}
            onOpen={(item) => setSelectedId(item.id)}
          />
        )}

        {!loading && !error && sectionItems.length > 0 && active.id !== 'datas' && (
          <>
            <CatalogToolbar
              filters={filters}
              onChange={setFilters}
              types={types}
              favoritesCount={favoritesCount}
            />

            {visibleItems.length === 0 ? (
              <p className="muted">
                {filters.favoritesOnly && favoritesCount === 0
                  ? 'Nenhum favorito aqui ainda. Use o coração nas obras para marcá-las.'
                  : 'Nenhum resultado para os filtros escolhidos.'}
              </p>
            ) : (
              <div className="media-grid">
                {visibleItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    timeZone={timeZone}
                    showCheckbox={active.id === 'lista'}
                    showStatus={active.id === 'todos'}
                    showReview={active.id === 'avaliados'}
                    onOpen={(entry) => setSelectedId(entry.id)}
                    onToggle={handleToggle}
                    onToggleFavorite={handleToggleFavorite}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {modalOpen && (
        <AddContentModal
          category={category}
          existingItems={items}
          defaultDestination={active.id === 'avaliados' ? 'avaliado' : 'lista'}
          onClose={() => setModalOpen(false)}
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