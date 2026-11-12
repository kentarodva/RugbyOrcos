-- 89_realtime_publication.sql
-- Auditoría de recorridos, punto 6 (2026-11-12): lo que cambia otro usuario no se
-- veía hasta recargar. En producción la publicación supabase_realtime solo tenía
-- custom_tactics, live_matches y live_match_events: ni siquiera los mensajes, las
-- invitaciones o los préstamos (que ya tenían código suscrito) emitían cambios.
--
-- Agrega a la publicación las tablas que comparten los roles. Realtime aplica el RLS
-- de cada suscriptor: nadie recibe filas que no podría leer con un SELECT.
-- Las tablas privadas (push_tokens, ai_*, user_profiles) se quedan fuera.
-- Idempotente: solo agrega las que existen y aún no están.

DO $$
DECLARE
  t TEXT;
  shared TEXT[] := ARRAY[
    -- plantel y salud
    'players', 'injury_log', 'hia_assessments', 'wellness_logs', 'workout_logs',
    'attribute_history', 'training_plans',
    -- agenda, asistencia y disciplina
    'schedule_events', 'event_rsvp', 'attendance', 'player_attendance_summary',
    'penalties', 'infractions',
    -- partidos
    'future_fixtures', 'fixtures', 'fixture_players', 'match_stats', 'rivals',
    'match_invitations', 'guest_players', 'championships', 'lineups', 'tactical_plays',
    -- comunicación
    'messages', 'message_reactions', 'announcement_views', 'notification_history',
    -- tesorería
    'finances', 'player_payments', 'fundraising_campaigns', 'fundraising_assignments',
    'raffle_tickets', 'treasurer_deliveries', 'inventory',
    -- Mak'Gora
    'makgora_teams', 'player_loans', 'tournaments', 'tournament_matches',
    'tournament_standings', 'tournament_teams'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  FOREACH t IN ARRAY shared LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t)
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
