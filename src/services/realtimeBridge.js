/**
 * realtimeBridge.js — lleva los cambios de OTROS usuarios al bus 'data:changed'.
 *
 * Antes el bus solo avisaba dentro del mismo teléfono: si el entrenador creaba un
 * entreno, el jugador con la app abierta no se enteraba hasta recargar. Ahora una
 * sola suscripción de Supabase Realtime escucha las tablas compartidas (publicadas
 * en la migración 89) y reemite cada cambio como 'data:changed' con remote: true,
 * así los useDataListener existentes reaccionan sin cambios.
 *
 * Realtime aplica el RLS de quien escucha: solo llegan filas que puede leer.
 */
import { supabase } from '../supabaseClient.js';

export const SHARED_TABLES = [
  'players', 'injury_log', 'hia_assessments', 'wellness_logs', 'workout_logs',
  'attribute_history', 'training_plans',
  'schedule_events', 'event_rsvp', 'attendance', 'player_attendance_summary',
  'penalties', 'infractions',
  'future_fixtures', 'fixtures', 'fixture_players', 'match_stats', 'rivals',
  'match_invitations', 'guest_players', 'championships', 'lineups', 'tactical_plays',
  'messages', 'message_reactions', 'announcement_views', 'notification_history',
  'finances', 'player_payments', 'fundraising_campaigns', 'fundraising_assignments',
  'raffle_tickets', 'treasurer_deliveries', 'inventory',
  'makgora_teams', 'player_loans', 'tournaments', 'tournament_matches',
  'tournament_standings', 'tournament_teams',
];

const ACTIONS = { INSERT: 'create', UPDATE: 'update', DELETE: 'delete' };

/** Convierte un evento de Realtime en el detail del bus. */
export function toBusDetail(change) {
  const row = change.new && Object.keys(change.new).length ? change.new : change.old || {};
  return {
    table: change.table,
    action: ACTIONS[change.eventType] || 'update',
    payload: { id: row.id, playerId: row.player_id, row },
    remote: true,
    timestamp: Date.now(),
  };
}

/**
 * Abre la suscripción. Devuelve la función para cerrarla.
 * `client` se inyecta en los tests.
 */
export function startRealtimeBridge(userId, client = supabase, tables = SHARED_TABLES) {
  if (!userId || !client?.channel) return () => {};
  let channel;
  try {
    channel = client.channel(`club_sync_${userId}_${Math.random().toString(36).slice(2, 8)}`);
    tables.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (change) => {
        window.dispatchEvent(new CustomEvent('data:changed', { detail: toBusDetail(change) }));
      });
    });
    channel.subscribe();
  } catch {
    return () => {};
  }
  return () => {
    try { client.removeChannel(channel); } catch { /* ya cerrado */ }
  };
}
