import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import Loading from '../../components/common/Loading.jsx';
import ContentDetailModal from '../../components/catalog/ContentDetailModal.jsx';
import TimelineFilters from '../../components/catalog/TimelineFilters.jsx';
import TimelineView from '../../components/catalog/TimelineView.jsx';
import { getCategoryBySlug } from '../../config/categories.js';
import { useCategoryContents } from '../../hooks/useCategoryContents.js';
import { useProfile } from '../../hooks/useProfile.js';
import '../../styles/timeline.css';

// Mesma regra das páginas de categoria:
//   avaliados = com nota | lista = ainda não avaliados (inclui os já consumidos)
const STATUS_FILTERS = {
  todos: () => true,
  avaliados: (item) => item.status === 'avaliado',
  lista: (item) => item.status !== 'avaliado',
};
const STATUS_IDS = Object.keys(STATUS_FILTERS);

// Linha do tempo geral: tudo o que foi adicionado, organizado por ano e mês.
// Os filtros ficam no endereço (?categoria=jogos&status=avaliados), então
// F5 e o botão "voltar" do navegador funcionam direito.
export default function TimelinePage() {
  const { profile } = useProfile();
  const timeZone = profile?.timezone ?? 'America/Sao_Paulo';
  const { items, loading, error, reload, replaceItem, toggleConsumed, removeItem } =
    useCategoryContents('all');

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(null);

  // Valores inválidos no endereço voltam para o padrão (todas / todos)
  const category = getCategoryBySlug(searchParams.get('categoria')) ? searchParams.get('categoria') : 'all';
  const rawStatus = searchParams.get('status');
  const status = STATUS_IDS.includes(rawStatus) ? rawStatus : 'todos';
  const hasFilters = category !== 'all' || status !== 'todos';

  function applyFilters({ category: nextCategory = category, status: nextStatus = status }) {
    const next = new URLSearchParams(searchParams);
    if (nextCategory === 'all') next.delete('categoria');
    else next.set('categoria', nextCategory);
    if (nextStatus === 'todos') next.delete('status');
    else next.set('status', nextStatus);
    setSearchParams(next, { replace: true });
  }

  // Quantas obras há em cada categoria, dentro da situação escolhida
  const categoryCounts = useMemo(() => {
    const matchStatus = STATUS_FILTERS[status];
    const counts = { all: 0 };
    for (const item of items) {
      if (!matchStatus(item)) continue;
      counts.all += 1;
      counts[item.categorySlug] = (counts[item.categorySlug] ?? 0) + 1;
    }
    return counts;
  }, [items, status]);

  // Quantas obras há em cada situação, dentro da categoria escolhida
  const statusCounts = useMemo(() => {
    const inCategory = category === 'all' ? items : items.filter((item) => item.categorySlug === category);
    return {
      todos: inCategory.length,
      avaliados: inCategory.filter(STATUS_FILTERS.avaliados).length,
      lista: inCategory.filter(STATUS_FILTERS.lista).length,
    };
  }, [items, category]);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (category === 'all' || item.categorySlug === category) && STATUS_FILTERS[status](item)
      ),
    [items, category, status]
  );

  // A obra aberta é lida da lista completa, então a janela continua certa
  // mesmo se a alteração feita nela tirar a obra do filtro atual
  const selected = items.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="main-content">
      <header className="page-header">
        <h1>Linha do tempo</h1>
        <p>Tudo o que você adicionou ao catálogo, organizado por ano e mês.</p>
      </header>

      {loading && <Loading label="Carregando…" />}

      {!loading && error && (
        <Alert type="error">
          {error}{' '}
          <button type="button" className="link-button" onClick={reload}>
            Tentar novamente
          </button>
        </Alert>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <Icon name="calendar" size={36} />
          <h2>Nada por aqui ainda</h2>
          <p>Quando você adicionar obras ao catálogo, elas aparecerão aqui, por data.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <TimelineFilters
            category={category}
            status={status}
            categoryCounts={categoryCounts}
            statusCounts={statusCounts}
            hasFilters={hasFilters}
            onCategoryChange={(value) => applyFilters({ category: value })}
            onStatusChange={(value) => applyFilters({ status: value })}
            onClear={() => applyFilters({ category: 'all', status: 'todos' })}
          />

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Icon name="calendar" size={36} />
              <h2>Nenhuma obra com esses filtros</h2>
              <p>Tente outra categoria ou outra situação.</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => applyFilters({ category: 'all', status: 'todos' })}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <TimelineView
              // Reinicia o ano e o mês escolhidos ao trocar de filtro
              key={`${category}-${status}`}
              items={filtered}
              timeZone={timeZone}
              showCategory={category === 'all'}
              onOpen={(item) => setSelectedId(item.id)}
            />
          )}
        </>
      )}

      {selected && (
        <ContentDetailModal
          key={selected.id}
          item={selected}
          timeZone={timeZone}
          onClose={() => setSelectedId(null)}
          onChanged={replaceItem}
          onToggleConsumed={toggleConsumed}
          onRemove={removeItem}
        />
      )}
    </div>
  );
}