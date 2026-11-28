// Utilitários de cor. Todas as cores são "#RRGGBB".

// Aceita "#10B981", "10b981", "#1b8" ou "1b8". Devolve "#rrggbb" em minúsculas, ou null.
export function normalizeHex(value) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value ?? '').trim());
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = [...hex].map((char) => char + char).join('');
  return `#${hex}`;
}

const toChannels = (hex) => {
  const number = parseInt(hex.slice(1), 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
};

const toHex = (channels) =>
  `#${channels
    .map((value) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0'))
    .join('')}`;

// Luminância relativa (como nas regras de acessibilidade WCAG)
export function relativeLuminance(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return 0;
  const [r, g, b] = toChannels(normalized).map((value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Escolhe preto ou branco para o texto ficar legível sobre uma cor de fundo
export function readableTextColor(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return '#000000';
  return relativeLuminance(normalized) > 0.179 ? '#000000' : '#ffffff';
}

// Razão de contraste entre duas cores (de 1 a 21). Abaixo de 3, a cor fica difícil de ver.
export function contrastRatio(first, second) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const [light, dark] = a >= b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

// amount > 0 clareia (mistura com branco); amount < 0 escurece (mistura com preto)
export function shadeHex(hex, amount) {
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;
  const target = amount >= 0 ? 255 : 0;
  const strength = Math.min(1, Math.abs(amount));
  return toHex(toChannels(normalized).map((value) => value + (target - value) * strength));
}