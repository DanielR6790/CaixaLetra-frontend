import Icon from '../common/Icon.jsx';
import { useTheme } from '../../hooks/useTheme.js';

// Botão que alterna entre tema escuro e claro.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="nav-link nav-button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
    >
      <Icon name={isDark ? 'sun' : 'moon'} />
      <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
    </button>
  );
}