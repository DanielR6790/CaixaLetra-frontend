import { normalizeHex, readableTextColor, shadeHex } from './color.js';

// Fundo da página em cada tema (usado para avisar quando uma cor tem pouco contraste)
export const THEME_BG = { dark: '#14181c', light: '#f4f6f8', slate: '#0f172a' };

const SLATE_ACCENT = { accent: '#10b981', hover: '#059669', text: '#022c22' };

// Cor de destaque que vale agora: a escolhida pela pessoa ou, se não houver, a do tema.
// "brand" = { accent, accentHover, accentText } do config/app.config.js
export function resolveAccent(theme, custom, brand) {
  const base =
    theme === 'slate'
      ? SLATE_ACCENT
      : { accent: brand.accent, hover: brand.accentHover, text: brand.accentText };

  const hex = normalizeHex(custom);
  if (!hex) return base;

  // Cor clara escurece ao passar o mouse; cor escura clareia
  const text = readableTextColor(hex);
  return { accent: hex, hover: shadeHex(hex, text === '#000000' ? -0.14 : 0.14), text };
}