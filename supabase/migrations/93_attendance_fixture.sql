-- 93_attendance_fixture.sql
-- Auditoría de recorridos, punto 8 (2026-11-12): confirmación, disponibilidad y asistencia
-- eran tres sistemas sin puente. La asistencia solo podía colgarse de un evento del
-- calendario (attendance.event_id -> schedule_events), así que a un partido programado
-- (future_fixtures, donde el jugador marca su disponibilidad) no se le podía pasar lista.
--   * attendance.fixture_id: la asistencia de un partido programado.
--   * UNIQUE (player_id, fixture_id): volver a guardar la lista corrige, no duplica.
-- El resumen y las penitencias siguen saliendo del trigger de la migración 87. Idempotente.

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS fixture_id UUID REFERENCES public.future_fixtures(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_fixture_id ON public.attendance(fixture_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_player_fixture_unique') THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_player_fixture_unique UNIQUE (player_id, fixture_id);
  END IF;
END $$;
