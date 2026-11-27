import { useTheme } from '../../hooks/useTheme.js';
import { THEMES } from '../../contexts/ThemeContext.jsx';

// Seletor de tema do menu lateral: Escuro, Claro e Ardósia.
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-picker" role="radiogroup" aria-label="Tema do site">
      {THEMES.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={theme === option.id}
          className="theme-option"
          onClick={() => setTheme(option.id)}
          title={`Tema ${option.label.toLowerCase()}`}
        >
          <span className={`theme-dot theme-dot-${option.id}`} aria-hidden="true" />
          {option.label}
        </button>
      ))}
    </div>
  );
}