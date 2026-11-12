/**
 * Marcador de un partido en vivo, solo desde sus eventos. Es la misma regla que usa
 * finish_live_match() en la BD (migración 94): try 5, conversión 2, penal y drop 3;
 * los puntos del rival anotados a mano llegan como score_adjust con details.points.
 */
export const SCORING = { try: 5, conversion: 2, penalty: 3, drop_goal: 3 };

export function liveScore(events = []) {
  let orcos = 0, opponent = 0;
  for (const ev of events) {
    const pts = ev.event_type === 'score_adjust'
      ? (ev.team === 'opponent' ? Number(ev.details?.points) || 0 : 0)
      : SCORING[ev.event_type] || 0;
    if (ev.team === 'orcos') orcos += pts;
    else if (ev.team === 'opponent') opponent += pts;
  }
  return { orcos, opponent };
}
