-- ============================================================
-- Migration 72: Live Match Delay Management & Designated Table Scorer
-- ============================================================

-- Permite el estado 'delayed' en el check constraint de status si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'live_matches_status_check'
  ) THEN
    ALTER TABLE live_matches DROP CONSTRAINT live_matches_status_check;
  END IF;
END $$;

ALTER TABLE live_matches ADD CONSTRAINT live_matches_status_check
  CHECK (status IN ('live', 'paused', 'finished', 'delayed'));

-- Columnas para motivo del retraso y mesa de control oficial
ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS delay_reason TEXT DEFAULT NULL;
ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS designated_scorer_name VARCHAR(150) DEFAULT NULL;
ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS designated_scorer_id UUID REFERENCES players(id) ON DELETE SET NULL;
ALTER TABLE live_matches ADD COLUMN IF NOT EXISTS scorer_locked BOOLEAN DEFAULT false;
