import { useEffect, useRef } from 'react';

/**
 * Avisos en vivo dentro de la app (auditoría, punto 9).
 *
 * Lo que crea otro usuario llega por Realtime al bus 'data:changed' (realtimeBridge).
 * Aquí se decide si le importa a quien está mirando y se muestra como toast +
 * notificación del sistema. No depende de Firebase ni de VAPID: funciona en el
 * navegador y en la app mientras esté abierta o en segundo plano. El push con la
 * app cerrada sigue siendo send-push / web-push.
 */

const fmtDate = (d) => {
  if (!d) return '';
  const [y, m, day] = String(d).split('-');
  return y && m && day ? `${day}/${m}` : String(d);
};
const fmtTime = (t) => (t ? ` ${String(t).slice(0, 5)}` : '');

const sameTeam = (row, me) =>
  !me.teamCategory || !row.team_category || row.team_category === me.teamCategory;

/**
 * Decide el aviso para un cambio remoto. Devuelve null si no corresponde.
 * me: { userId, playerId, teamCategory, isPlayer }
 */
export function noticeFor(detail, me) {
  if (!detail?.remote || !me?.userId) return null;
  const row = detail.payload?.row || {};
  const author = row.user_id || row.sender_id;
  if (author && author === me.userId) return null; // lo hice yo

  if (detail.table === 'messages' && detail.action === 'create') {
    if (row.channel === 'announcement') {
      return { kind: 'announcement', title: '📣 Nuevo anuncio del club', body: String(row.text || '').slice(0, 140) };
    }
    if (row.receiver_id === me.userId) {
      return { kind: 'message', title: '💬 Nuevo mensaje', body: String(row.text || '').slice(0, 140) };
    }
    return null;
  }

  if (!me.isPlayer) return null; // el staff ya ve estos cambios en sus pantallas

  if (detail.action === 'create') {
    switch (detail.table) {
      case 'schedule_events':
        if (!sameTeam(row, me)) return null;
        return {
          kind: 'event',
          title: `📅 Nuevo ${row.type === 'partido' ? 'partido' : row.type || 'evento'}: ${row.title || ''}`.trim(),
          body: `${fmtDate(row.date)}${fmtTime(row.time)}${row.location ? ` · ${row.location}` : ''}`,
        };
      case 'future_fixtures':
        if (!sameTeam(row, me)) return null;
        return {
          kind: 'fixture',
          title: `🏉 Nuevo partido vs ${row.opponent || 'rival'}`,
          body: `${fmtDate(row.date)}${fmtTime(row.time)}${row.location ? ` · ${row.location}` : ''}`,
        };
      case 'tactical_plays':
      case 'custom_tactics':
        return { kind: 'play', title: '🧠 Nueva jugada en la pizarra', body: row.name || '' };
      case 'fundraising_assignments':
        if (!me.playerId || row.player_id !== me.playerId) return null;
        return {
          kind: 'assignment', title: '🎟️ Te asignaron un pro-fondos',
          body: row.amount_due ? `Por $${Number(row.amount_due).toLocaleString('es-CO')}` : '',
        };
      default:
        return null;
    }
  }

  // Convocatoria: el partido se actualiza y ahora me incluye.
  if (detail.table === 'future_fixtures' && detail.action === 'update' && me.playerId) {
    // squad = { startingXV: [playerId], substitutes: [playerId] } (MatchSquadModal)
    const sq = row.squad || {};
    const ids = Array.isArray(sq) ? sq : [...(sq.startingXV || []), ...(sq.substitutes || [])];
    const inSquad = ids.some(s => (typeof s === 'string' ? s : s?.id || s?.playerId) === me.playerId);
    if (inSquad) {
      return {
        kind: 'squad', key: `squad:${row.id}`,
        title: `✅ Estás convocado vs ${row.opponent || 'rival'}`,
        body: `${fmtDate(row.date)}${fmtTime(row.time)}`,
      };
    }
  }
  return null;
}

/**
 * Monta el escucha. `notify(title, body)` muestra el aviso; `onNotice(notice)` deja
 * que la pantalla reaccione (p. ej. abrir el anuncio).
 */
export function useLiveNotices(me, { notify, onNotice }) {
  const seen = useRef(new Set());
  const meRef = useRef(me);
  meRef.current = me;
  const cbRef = useRef({ notify, onNotice });
  cbRef.current = { notify, onNotice };

  useEffect(() => {
    if (!me?.userId) return undefined;
    const handler = (e) => {
      const notice = noticeFor(e.detail, meRef.current);
      if (!notice) return;
      // Una convocatoria se avisa una sola vez aunque el partido se edite de nuevo.
      if (notice.key) {
        if (seen.current.has(notice.key)) return;
        seen.current.add(notice.key);
      }
      cbRef.current.notify?.(notice.title, notice.body);
      cbRef.current.onNotice?.(notice);
    };
    window.addEventListener('data:changed', handler);
    return () => window.removeEventListener('data:changed', handler);
  }, [me?.userId]);
}
