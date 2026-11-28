// Controla a aparência do site: tema (escuro, claro ou ardósia) e cor de destaque.
// Aqui o armazenamento local guarda APENAS preferências visuais deste navegador.
// Os dados do catálogo e dos projetos ficam sempre no banco de dados.
import { createContext, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { appConfig } from '../config/app.config.js';
import { normalizeHex } from '../utils/color.js';
import { resolveAccent } from '../utils/themeColors.js';
import '../styles/themes.css';

export const ThemeContext = createContext(null);

// Para adicionar um tema novo: inclua aqui e crie o bloco de cores em styles/themes.css.
export const THEMES = [
  { id: 'dark', label: 'Escuro' },
  { id: 'light', label: 'Claro' },
  { id: 'slate', label: 'Ardósia' },
];

const THEME_KEY = 'app-theme';
const ACCENT_KEY = 'app-accent';
const THEME_IDS = THEMES.map((theme) => theme.id);

function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (THEME_IDS.includes(saved)) return saved;
  } catch {
    // armazenamento indisponível: usa o padrão
  }
  return 'dark'; // tema escuro é o padrão
}

// Cor de destaque escolhida pela pessoa (null = usa a do tema)
function readAccent() {
  try {
    return normalizeHex(localStorage.getItem(ACCENT_KEY));
  } catch {
    return null;
  }
}

// O applyBrand() grava a cor de destaque direto no <html>, o que vence qualquer CSS.
// Por isso a cor também é ajustada por aqui.
function applyAccent(colors) {
  const style = document.documentElement.style;
  style.setProperty('--accent', colors.accent);
  style.setProperty('--accent-hover', colors.hover);
  style.setProperty('--accent-text', colors.text);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readTheme);
  const [accent, setAccentState] = useState(readAccent);

  const effective = useMemo(
    () => resolveAccent(theme, accent, appConfig.colors),
    [theme, accent]
  );

  // useLayoutEffect: aplica antes de a tela ser desenhada (sem "piscar" de cor)
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applyAccent(effective);
    try {
      localStorage.setItem(THEME_KEY, theme);
      if (accent) localStorage.setItem(ACCENT_KEY, accent);
      else localStorage.removeItem(ACCENT_KEY);
    } catch {
      // ignora: a preferência só não será lembrada
    }
  }, [theme, accent, effective]);

  const setTheme = useCallback((next) => {
    if (THEME_IDS.includes(next)) setThemeState(next);
  }, []);

  // Passa para o próximo tema da lista
  const toggleTheme = useCallback(() => {
    setThemeState((current) => THEME_IDS[(THEME_IDS.indexOf(current) + 1) % THEME_IDS.length]);
  }, []);

  // null volta para a cor do tema. Uma cor inválida é ignorada.
  const setAccent = useCallback((hex) => {
    if (hex === null) {
      setAccentState(null);
      return;
    }
    const normalized = normalizeHex(hex);
    if (normalized) setAccentState(normalized);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, themes: THEMES, accent, setAccent, effective }),
    [theme, setTheme, toggleTheme, accent, setAccent, effective]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}