/**
 * Pasar lista con lo que el jugador avisó (auditoría, punto 8).
 * Entrenos y eventos: confirmación en event_rsvp. Partidos programados: disponibilidad
 * en future_fixtures.availabilities. Las dos usan going / maybe / not_going.
 */
export const FIXTURE_PREFIX = 'fixture:';

export const isFixtureOption = (id) => typeof id === 'string' && id.startsWith(FIXTURE_PREFIX);
export const fixtureIdOf = (id) => (isFixtureOption(id) ? id.slice(FIXTURE_PREFIX.length) : null);

/** Eventos del calendario + partidos programados, como opciones de "Evento vinculado". */
export function attendanceOptions(events = [], fixtures = []) {
  const fromEvents = events.map(e => ({ ...e, kind: 'event' }));
  const fromFixtures = fixtures.map(f => ({
    id: FIXTURE_PREFIX + f.id,
    kind: 'fixture',
    type: 'partido',
    date: f.date,
    time: f.time || '',
    title: `Partido vs ${f.opponent || 'rival'}`,
    availabilities: f.availabilities || {},
  }));
  return [...fromEvents, ...fromFixtures].sort((a, b) =>
    `${a.date || ''}T${a.time || '00:00'}`.localeCompare(`${b.date || ''}T${b.time || '00:00'}`));
}

/** Mapa jugador -> estado avisado, desde la disponibilidad de un partido. */
export function rsvpFromAvailabilities(availabilities) {
  const map = {};
  Object.entries(availabilities || {}).forEach(([playerId, status]) => {
    if (['going', 'maybe', 'not_going'].includes(status)) map[playerId] = status;
  });
  return map;
}

/** Quién avisó qué, en orden de lista, para mostrarlo arriba al pasar lista. */
export function rsvpGroups(players = [], rsvpMap = {}) {
  const groups = { going: [], maybe: [], not_going: [], silent: [] };
  players.forEach(p => { (groups[rsvpMap[p.id]] || groups.silent).push(p); });
  return groups;
}
