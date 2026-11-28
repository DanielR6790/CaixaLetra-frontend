import { NavLink } from 'react-router-dom';
import Avatar from '../common/Avatar.jsx';
import Brand from '../common/Brand.jsx';
import Icon from '../common/Icon.jsx';
import { categories } from '../../config/categories.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useProfile } from '../../hooks/useProfile.js';
import '../../styles/settings.css';

const linkClass = ({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link');
const userLinkClass = ({ isActive }) =>
  isActive ? 'user-box user-box-link user-box-active' : 'user-box user-box-link';

// Menu lateral. "onClose" fecha a gaveta (celular) ou recolhe o menu (computador).
export default function Sidebar({ onClose }) {
  const { user } = useAuth();
  const { profile } = useProfile();

  const displayName = profile?.username ?? user?.email ?? '';

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

        <p className="nav-title">Quadro infinito</p>
        <NavLink to="/ideias" className={linkClass}>
          <Icon name="lightbulb" />
          <span>Quadros</span>
        </NavLink>
      </nav>

      <div className="sidebar-foot">
        <NavLink
          to="/configuracoes"
          className={userLinkClass}
          aria-label="Abrir as configurações do perfil"
          title="Configurações"
        >
          <Avatar url={profile?.avatar_url} name={displayName} size={32} />
          <span className="user-info">
            <span className="user-name" title={displayName}>
              {displayName}
            </span>
            <span className="user-sub">Configurações</span>
          </span>
          <Icon name="settings" size={18} />
        </NavLink>
      </div>
    </div>
  );
}