-- ============================================================
-- Migration 41: Live Match Tracker — live_matches table
-- ============================================================

CREATE TABLE IF NOT EXISTS live_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  opponent_name VARCHAR(200) DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  elapsed_seconds INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'live'
    CHECK (status IN ('live', 'paused', 'finished')),
  current_half VARCHAR(10) NOT NULL DEFAULT '1st_half'
    CHECK (current_half IN ('1st_half', 'ht', '2nd_half', 'ft')),
  orcos_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  team_category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_matches_status ON live_matches(status);
CREATE INDEX IF NOT EXISTS idx_live_matches_user ON live_matches(user_id);

ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_matches_select" ON live_matches;
CREATE POLICY "live_matches_select"
  ON live_matches FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "live_matches_insert" ON live_matches;
CREATE POLICY "live_matches_insert"
  ON live_matches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "live_matches_update" ON live_matches;
CREATE POLICY "live_matches_update"
  ON live_matches FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "live_matches_delete" ON live_matches;
CREATE POLICY "live_matches_delete"
  ON live_matches FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_admin());

-- Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'live_matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_matches;
  END IF;
END $$;
