// Timezone-safe date utilities for Colombia (UTC-5)
const COL_TIMEZONE = 'America/Bogota';
const COL_LOCALE = 'es-CO';

export function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatLocalDate(date, opts = {}) {
  return date.toLocaleDateString(COL_LOCALE, { timeZone: COL_TIMEZONE, ...opts });
}
