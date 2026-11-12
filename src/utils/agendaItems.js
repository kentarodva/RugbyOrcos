// Una sola agenda: eventos del calendario + partidos programados, con las mismas reglas
// de "próximo" y de formato en la vista del staff y en la del jugador.

const GRACE_MS = 3 * 60 * 60 * 1000; // un evento sigue visible hasta 3 h después de empezar

/** Fecha local YYYY-MM-DD (toISOString usa UTC y en Colombia cambia de día a las 19:00). */
export function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOf(event) {
  const [h = '0', min = '0'] = String(event.time || '').split(':');
  const [y, m, d] = String(event.date).split('-').map(Number);
  return new Date(y, m - 1, d, Number(h) || 0, Number(min) || 0);
}

/** ¿Sigue vigente? Con hora: hasta 3 h después de empezar. Sin hora: durante todo su día. */
export function isUpcomingEvent(event, now = new Date()) {
  if (!event?.date) return false;
  if (!event.time) return event.date >= localDateKey(now);
  return startOf(event).getTime() + GRACE_MS >= now.getTime();
}

export function fixtureToAgendaItem(fixture) {
  return {
    id: `fixture-${fixture.id}`,
    fixtureId: fixture.id,
    isFixture: true,
    isMatch: true,
    type: 'partido',
    title: `Partido: Orcos vs ${fixture.opponent}`,
    date: fixture.date,
    time: fixture.time || null,
    location: fixture.location || '',
    opponent: fixture.opponent,
    teamCategory: fixture.teamCategory,
    teamId: fixture.teamId,
    availabilities: fixture.availabilities,
  };
}

const sortKey = (e) => `${e.date} ${e.time ? formatEventTime(e.time) : '00:00'}`;

/** Eventos + partidos programados en una sola lista ordenada. */
export function mergeAgenda(events, fixtures) {
  return [...(events || []), ...(fixtures || []).map(fixtureToAgendaItem)]
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

/** "20:30:00" -> "20:30". */
export function formatEventTime(time) {
  if (!time) return '';
  const [h, m = '00'] = String(time).split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}
