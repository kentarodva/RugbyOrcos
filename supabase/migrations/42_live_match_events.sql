-- ============================================================
-- Migration 42: Live Match Tracker — live_match_events table
-- ============================================================

CREATE TABLE IF NOT EXISTS live_match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_match_id UUID NOT NULL REFERENCES live_matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN (
      'try', 'conversion', 'penalty', 'drop_goal',
      'yellow_card', 'red_card', 'substitution', 'note',
      'half_start', 'half_end', 'score_adjust'
    )),
  minute INTEGER NOT NULL DEFAULT 0,
  team VARCHAR(10) NOT NULL DEFAULT 'orcos'
    CHECK (team IN ('orcos', 'opponent')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_match_events_match ON live_match_events(live_match_id);
CREATE INDEX IF NOT EXISTS idx_live_match_events_type ON live_match_events(event_type);

ALTER TABLE live_match_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_match_events_select" ON live_match_events;
CREATE POLICY "live_match_events_select"
  ON live_match_events FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "live_match_events_insert" ON live_match_events;
CREATE POLICY "live_match_events_insert"
  ON live_match_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM live_matches
      WHERE live_matches.id = live_match_id
      AND (live_matches.user_id = (select auth.uid()) OR is_admin())
    )
  );

DROP POLICY IF EXISTS "live_match_events_update" ON live_match_events;
CREATE POLICY "live_match_events_update"
  ON live_match_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM live_matches
      WHERE live_matches.id = live_match_id
      AND (live_matches.user_id = (select auth.uid()) OR is_admin())
    )
  );

DROP POLICY IF EXISTS "live_match_events_delete" ON live_match_events;
CREATE POLICY "live_match_events_delete"
  ON live_match_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM live_matches
      WHERE live_matches.id = live_match_id
      AND (live_matches.user_id = (select auth.uid()) OR is_admin())
    )
  );

-- Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'live_match_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_match_events;
  END IF;
END $$;
