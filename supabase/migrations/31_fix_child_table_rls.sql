-- Corrige RLS de tablas hijas: SELECT USING (true) → solo propio jugador o staff
-- Antes: cualquier autenticado veía datos médicos (wellness, HIA, lesiones) de todos
-- Ahora: jugadores ven solo sus datos, staff (tier ≤ 3) ven todos

DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'attribute_history', 'injury_log', 'attendance', 'player_attendance_summary',
      'penalties', 'infractions', 'match_stats', 'wellness_logs', 'hia_assessments', 'workout_logs'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I_select" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_select" ON %I FOR SELECT USING (
      player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
      OR get_user_tier() <= 3
    )', tbl, tbl);
  END LOOP;
END $$;
