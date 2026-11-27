// Controla o tema do site: escuro (padrão), claro ou ardósia.
// Aqui o armazenamento local guarda APENAS a preferência visual do aparelho.
// Os dados do catálogo e dos projetos ficam sempre no banco de dados.
import { createContext, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { appConfig } from '../config/app.config.js';
import '../styles/themes.css';

export const ThemeContext = createContext(null);

// Para adicionar um tema novo: inclua aqui, crie o bloco de cores em styles/themes.css
// e, se ele tiver cor de destaque própria, inclua em THEME_ACCENTS.
export const THEMES = [
  { id: 'dark', label: 'Escuro' },
  { id: 'light', label: 'Claro' },
  { id: 'slate', label: 'Ardósia' },
];

const STORAGE_KEY = 'app-theme';
const THEME_IDS = THEMES.map((theme) => theme.id);

// Cor de destaque própria de um tema. Os demais usam a cor da marca (config/app.config.js).
const THEME_ACCENTS = {
  slate: { accent: '#10b981', hover: '#059669', text: '#022c22' },
};

// O applyBrand() grava a cor de destaque direto no <html>, o que vence qualquer CSS.
// Por isso o tema também a ajusta por aqui.
function applyAccent(theme) {
  const colors = THEME_ACCENTS[theme] ?? {
    accent: appConfig.colors.accent,
    hover: appConfig.colors.accentHover,
    text: appConfig.colors.accentText,
  };
  const style = document.documentElement.style;
  style.setProperty('--accent', colors.accent);
  style.setProperty('--accent-hover', colors.hover);
  style.setProperty('--accent-text', colors.text);
}

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEME_IDS.includes(saved)) return saved;
  } catch {
    // armazenamento indisponível: usa o padrão
  }
  return 'dark'; // tema escuro é o padrão
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  // useLayoutEffect: aplica antes de a tela ser desenhada (sem "piscar" de cor)
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applyAccent(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignora: a preferência só não será lembrada
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (THEME_IDS.includes(next)) setThemeState(next);
  }, []);

  // Passa para o próximo tema da lista
  const toggleTheme = useCallback(() => {
    setThemeState((current) => THEME_IDS[(THEME_IDS.indexOf(current) + 1) % THEME_IDS.length]);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, themes: THEMES }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}