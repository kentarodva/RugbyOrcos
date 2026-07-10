-- Migration 43: Unique constraint on attendance (player_id, event_id)
-- Prevents duplicate attendance records when saving multiple times for the same event

-- Remove any existing duplicates before adding constraint
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY player_id, event_id ORDER BY created_at DESC NULLS LAST) as rn
  FROM attendance
  WHERE event_id IS NOT NULL
)
DELETE FROM attendance WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

ALTER TABLE attendance ADD CONSTRAINT attendance_player_event_unique UNIQUE (player_id, event_id);
