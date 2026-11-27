import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Brand from '../common/Brand.jsx';
import Icon from '../common/Icon.jsx';
import Sidebar from './Sidebar.jsx';
import { ProfileProvider } from '../../contexts/ProfileContext.jsx';
import '../../styles/sidebar-collapse.css';

// Preferência visual deste navegador (como o tema): se o menu fica recolhido no computador
const STORAGE_KEY = 'app-sidebar-collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

const isMobileScreen = () => window.matchMedia('(max-width: 860px)').matches;

// Estrutura das páginas internas: menu lateral + conteúdo.
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false); // gaveta do celular
  const [collapsed, setCollapsed] = useState(readCollapsed); // menu recolhido no computador
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

  // Lembra se o menu estava recolhido
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignora: a preferência só não será lembrada
    }
  }, [collapsed]);

  // O mesmo botão "fechar" serve para os dois casos:
  // no celular fecha a gaveta; no computador recolhe o menu.
  function handleClose() {
    if (isMobileScreen()) setMenuOpen(false);
    else setCollapsed(true);
  }

  return (
    <ProfileProvider>
      <div className={collapsed ? 'app-shell app-shell-collapsed' : 'app-shell'}>
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
          <Sidebar onClose={handleClose} />
        </aside>

        {menuOpen && (
          <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        )}

        {collapsed && (
          <button
            type="button"
            className="menu-reopen"
            onClick={() => setCollapsed(false)}
            aria-label="Abrir menu"
            aria-expanded="false"
            aria-controls="sidebar"
            title="Abrir menu"
          >
            <Icon name="menu" />
          </button>
        )}

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </ProfileProvider>
  );
}