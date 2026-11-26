import { useState } from 'react';
import Alert from '../../components/common/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import Loading from '../../components/common/Loading.jsx';
import ContentDetailModal from '../../components/catalog/ContentDetailModal.jsx';
import TimelineView from '../../components/catalog/TimelineView.jsx';
import { useCategoryContents } from '../../hooks/useCategoryContents.js';
import { useProfile } from '../../hooks/useProfile.js';

// Linha do tempo geral: tudo o que foi adicionado, de todas as categorias,
// organizado por ano e mês.
export default function TimelinePage() {
  const { profile } = useProfile();
  const timeZone = profile?.timezone ?? 'America/Sao_Paulo';
  const { items, loading, error, reload, replaceItem, toggleConsumed, removeItem } =
    useCategoryContents('all');
  const [selectedId, setSelectedId] = useState(null);

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
        <TimelineView
          items={items}
          timeZone={timeZone}
          showCategory
          onOpen={(item) => setSelectedId(item.id)}
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
          onRemove={removeItem}
        />
      )}
    </div>
  );
}