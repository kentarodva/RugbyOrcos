// Single source of truth for schedule_events.type.
// DB constraint chk_schedule_events_type allows: entrenamiento | partido | evento | reunion.
export const EVENT_TYPES = [
  { value: 'entrenamiento', label: 'Entrenamiento', emoji: '🏋️', chip: 'pro-chip-info' },
  { value: 'partido', label: 'Partido', emoji: '🏉', chip: 'pro-chip-warning' },
  { value: 'reunion', label: 'Reunión', emoji: '🗣️', chip: 'pro-chip-muted' },
  { value: 'evento', label: 'Otro evento', emoji: '📌', chip: 'pro-chip-muted' },
];

const BY_VALUE = Object.fromEntries(EVENT_TYPES.map(t => [t.value, t]));

/** Legacy rows/forms used 'otro', which the DB rejects; treat it as 'evento'. */
export function normalizeEventType(type) {
  if (!type) return 'entrenamiento';
  if (type === 'otro') return 'evento';
  return BY_VALUE[type] ? type : 'evento';
}

export function getEventTypeMeta(type) {
  return BY_VALUE[normalizeEventType(type)];
}
