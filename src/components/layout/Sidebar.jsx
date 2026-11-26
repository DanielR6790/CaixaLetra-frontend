import { NavLink } from 'react-router-dom';
import Brand from '../common/Brand.jsx';
import Icon from '../common/Icon.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { categories } from '../../config/categories.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useProfile } from '../../hooks/useProfile.js';

const linkClass = ({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link');

// Menu lateral. "onClose" é usado apenas no celular (botão de fechar).
export default function Sidebar({ onClose }) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const displayName = profile?.username ?? user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase() || '?';

  return (
    <div className="sidebar-inner">
      <div className="sidebar-head">
        <Brand />
        <button
          type="button"
          className="icon-btn sidebar-close"
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <Icon name="close" />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        <NavLink to="/" end className={linkClass}>
          <Icon name="home" />
          <span>Início</span>
        </NavLink>

        <p className="nav-title">Catálogo</p>
        {categories.map((category) => (
          <NavLink key={category.slug} to={`/catalogo/${category.slug}`} className={linkClass}>
            <Icon name={category.icon} />
            <span>{category.name}</span>
          </NavLink>
        ))}
        <NavLink to="/linha-do-tempo" className={linkClass}>
          <Icon name="calendar" />
          <span>Linha do tempo</span>
        </NavLink>

        <p className="nav-title">Projetos</p>
        <NavLink to="/ideias" className={linkClass}>
          <Icon name="lightbulb" />
          <span>Quadro infinito</span>
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        <ThemeToggle />
        <div className="user-box">
          <span className="avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="user-name" title={displayName}>
            {displayName}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => signOut()}
            aria-label="Sair da conta"
            title="Sair"
          >
            <Icon name="logout" />
          </button>
        </div>
      </div>
    </div>
  );
}