-- 86_staff_player_records_policies.sql
-- Auditoría de recorridos, punto 2 (2026-11-06): entrenador y árbitro recibían 403 al
-- registrar asistencia, castigos, infracciones, estadísticas, lesiones, etc. sobre fichas
-- que no crearon. Las políticas de estas tablas solo permiten is_admin() o al "dueño"
-- (creador) de la ficha. Igual que la migración 79, esto SOLO AÑADE políticas por rol,
-- alineadas con usePermissions.js:
--   manage_discipline (entrenador, arbitro): attendance, player_attendance_summary,
--                                           penalties, infractions, match_stats
--   manage_training   (entrenador):          injury_log, hia_assessments, wellness_logs,
--                                           workout_logs, attribute_history
-- No quita permisos a nadie. Idempotente. Requiere has_club_role() de la migración 79.

DO $$
DECLARE
  r RECORD;
  c TEXT;
  pname TEXT;
  cond TEXT;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('attendance',                ARRAY['entrenador','arbitro']),
      ('player_attendance_summary', ARRAY['entrenador','arbitro']),
      ('penalties',                 ARRAY['entrenador','arbitro']),
      ('infractions',               ARRAY['entrenador','arbitro']),
      ('match_stats',               ARRAY['entrenador','arbitro']),
      ('injury_log',                ARRAY['entrenador']),
      ('hia_assessments',           ARRAY['entrenador']),
      ('wellness_logs',             ARRAY['entrenador']),
      ('workout_logs',              ARRAY['entrenador']),
      ('attribute_history',         ARRAY['entrenador'])
    ) AS t(tbl, roles)
  LOOP
    IF to_regclass('public.' || r.tbl) IS NULL THEN
      RAISE NOTICE 'Tabla % no existe, se omite', r.tbl;
      CONTINUE;
    END IF;
    cond := format('(SELECT public.has_club_role(%L::text[]))', r.roles);
    FOREACH c IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
      pname := format('%s_staff_%s', r.tbl, lower(c));
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pname, r.tbl);
      IF c = 'INSERT' THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', pname, r.tbl, cond);
      ELSIF c = 'UPDATE' THEN
        EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', pname, r.tbl, cond, cond);
      ELSE
        EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', pname, r.tbl, cond);
      END IF;
    END LOOP;
  END LOOP;
END $$;
