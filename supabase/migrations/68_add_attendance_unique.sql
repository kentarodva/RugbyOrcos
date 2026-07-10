-- 68_add_attendance_unique.sql
-- La migracion 43 (attendance_player_event_unique) nunca se aplico.
-- Sin este constraint, los upserts con onConflict: 'player_id,event_id' fallan
-- y se crean duplicados en attendance.

-- Eliminar duplicados existentes
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY player_id, event_id ORDER BY created_at DESC NULLS LAST) as rn
  FROM attendance
  WHERE event_id IS NOT NULL
)
DELETE FROM attendance WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Crear el constraint
DO $$ BEGIN
  ALTER TABLE attendance ADD CONSTRAINT attendance_player_event_unique UNIQUE (player_id, event_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
