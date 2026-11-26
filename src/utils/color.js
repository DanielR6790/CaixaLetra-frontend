// Escolhe preto ou branco para o texto ficar legível sobre uma cor de fundo
// (usa a luminância relativa, como nas regras de acessibilidade WCAG).
export function readableTextColor(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!match) return '#000000';

  const value = parseInt(match[1], 16);
  const channel = (shift) => {
    const s = ((value >> shift) & 255) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);

  return luminance > 0.179 ? '#000000' : '#ffffff';
}