-- 74_close_summary_views.sql
-- FUGA DE DATOS: tres vistas materializadas eran legibles por la API REST sin iniciar sesión
-- (anon) y por cualquier jugador (authenticated). Postgres no aplica RLS a vistas materializadas,
-- así que cualquiera con la llave pública veía cuánto pagó cada jugador, sus planes y asistencias.
-- La app no las usa (verificado con grep en src/ el 2026-11-05): se cierran del todo para la API.
-- service_role (backend / Edge Functions) conserva el acceso.
-- Idempotente.

DO $$
DECLARE v TEXT;
BEGIN
  FOREACH v IN ARRAY ARRAY['player_payment_summary', 'player_training_summary', 'player_rsvp_summary'] LOOP
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = v)
       OR EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = v) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated, PUBLIC', v);
      EXECUTE format('GRANT SELECT ON public.%I TO service_role', v);
    END IF;
  END LOOP;
END $$;
