import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Brand from '../common/Brand.jsx';
import Icon from '../common/Icon.jsx';
import Sidebar from './Sidebar.jsx';
import { ProfileProvider } from '../../contexts/ProfileContext.jsx';

// Estrutura das páginas internas: menu lateral + conteúdo.
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Fecha o menu (celular) ao trocar de página
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Fecha o menu com a tecla Esc
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <ProfileProvider>
      <div className="app-shell">
        <header className="mobile-bar">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="sidebar"
          >
            <Icon name="menu" />
          </button>
          <Brand />
        </header>

        <aside id="sidebar" className={menuOpen ? 'sidebar sidebar-open' : 'sidebar'}>
          <Sidebar onClose={() => setMenuOpen(false)} />
        </aside>

        {menuOpen && (
          <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        )}

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </ProfileProvider>
  );
}