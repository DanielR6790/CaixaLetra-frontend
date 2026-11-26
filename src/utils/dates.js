// Exibe datas no fuso horário do perfil do usuário.
// O banco guarda em UTC; aqui só convertemos para mostrar.
const DEFAULT_ZONE = 'America/Sao_Paulo';

function partsOf(iso, options, timeZone) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('pt-BR', { ...options, timeZone });
  } catch {
    // fuso inválido: usa o do navegador
    formatter = new Intl.DateTimeFormat('pt-BR', options);
  }
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

// Ex.: 03/12/2026
export function formatDate(iso, timeZone = DEFAULT_ZONE) {
  const p = partsOf(iso, { day: '2-digit', month: '2-digit', year: 'numeric' }, timeZone);
  return p ? `${p.day}/${p.month}/${p.year}` : '';
}

// Ex.: 03/12/2026 às 14:35
export function formatDateTime(iso, timeZone = DEFAULT_ZONE) {
  const p = partsOf(
    iso,
    { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
    timeZone
  );
  return p ? `${p.day}/${p.month}/${p.year} às ${p.hour}:${p.minute}` : '';
}