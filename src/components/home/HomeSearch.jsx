import { useEffect, useMemo, useRef, useState } from 'react';
import { getCategoryBySlug } from '../../config/categories.js';
import { searchItems } from '../../utils/homeData.js';

function SearchGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// Busca no catálogo já carregado. Ctrl + K (ou Cmd + K) foca o campo.
export default function HomeSearch({ items, onOpen }) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  const results = useMemo(() => searchItems(items, term), [items, term]);
  const showList = open && term.trim().length > 0;

  // Atalho Ctrl + K (ignorado se houver uma janela aberta)
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      if (document.querySelector('.modal-backdrop')) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Clicar fora fecha a lista de resultados
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  function choose(item) {
    setOpen(false);
    setTerm('');
    inputRef.current?.blur();
    onOpen(item);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      setTerm('');
      event.currentTarget.blur();
      return;
    }
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[Math.min(active, results.length - 1)]);
    }
  }

  return (
    <div className="home-search" ref={boxRef}>
      <div className="home-search-field">
        <SearchGlyph />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls="home-search-results"
          aria-autocomplete="list"
          aria-label="Buscar no seu catálogo"
          placeholder="Buscar no seu catálogo… (Ctrl+K)"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showList &&
        (results.length > 0 ? (
          <ul id="home-search-results" role="listbox" className="home-search-results">
            {results.map((item, index) => {
              const category = getCategoryBySlug(item.categorySlug);
              const meta = [category?.name, item.releaseYear].filter(Boolean).join(' · ');
              return (
                <li key={item.id} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    className="home-search-item"
                    data-active={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(item)}
                  >
                    {item.coverUrl ? (
                      <img className="home-search-thumb" src={item.coverUrl} alt="" loading="lazy" />
                    ) : (
                      <span className="home-search-thumb" aria-hidden="true" />
                    )}
                    <span className="home-search-text">
                      <strong>{item.title}</strong>
                      <span className="muted">{meta}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="home-search-results home-search-empty">Nenhuma obra encontrada.</div>
        ))}
    </div>
  );
}