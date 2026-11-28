// Lista de fusos horários para a tela de perfil.
export const BRAZIL_ZONES = [
  'America/Noronha', 'America/Belem', 'America/Fortaleza', 'America/Recife', 'America/Araguaina',
  'America/Maceio', 'America/Bahia', 'America/Sao_Paulo', 'America/Campo_Grande', 'America/Cuiaba',
  'America/Santarem', 'America/Porto_Velho', 'America/Boa_Vista', 'America/Manaus',
  'America/Eirunepe', 'America/Rio_Branco',
];

// Usada só se o navegador não souber listar os fusos
const FALLBACK_ZONES = [
  'UTC', 'America/New_York', 'America/Argentina/Buenos_Aires', 'Europe/Lisbon', 'Europe/London',
  'Europe/Madrid', 'Europe/Paris', 'Asia/Tokyo',
];

export function isValidTimeZone(value) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// { brazil: [...], others: [...] }. "extras" = fusos que precisam constar (o atual, o do navegador).
export function listTimeZones(extras = []) {
  let known = [];
  try {
    known = Intl.supportedValuesOf('timeZone');
  } catch {
    known = [];
  }

  const zones = new Set(known.length > 0 ? known : [...BRAZIL_ZONES, ...FALLBACK_ZONES]);
  zones.add('UTC');
  for (const extra of extras) {
    if (extra && isValidTimeZone(extra)) zones.add(extra);
  }

  return {
    brazil: BRAZIL_ZONES.filter((zone) => zones.has(zone)),
    others: [...zones]
      .filter((zone) => !BRAZIL_ZONES.includes(zone))
      .sort((a, b) => a.localeCompare(b)),
  };
}

// Ex.: "America/Sao Paulo (GMT-3)"
export function timeZoneLabel(zone, date = new Date()) {
  const name = zone.replace(/_/g, ' ');
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find((item) => item.type === 'timeZoneName');
    return part ? `${name} (${part.value})` : name;
  } catch {
    return name;
  }
}