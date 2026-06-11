-- Migration 32: Agenda enhancements
-- 1. Add notes field to schedule_events
-- 2. Link attendance to schedule_events
-- 3. Create event_rsvp table for player confirmations

ALTER TABLE schedule_events
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES schedule_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);

CREATE TABLE IF NOT EXISTS event_rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

ALTER TABLE event_rsvp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_rsvp_select" ON event_rsvp
  FOR SELECT USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR get_user_tier() <= 3
  );

CREATE POLICY "event_rsvp_insert" ON event_rsvp
  FOR INSERT WITH CHECK (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "event_rsvp_update" ON event_rsvp
  FOR UPDATE USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

CREATE POLICY "event_rsvp_delete" ON event_rsvp
  FOR DELETE USING (
    get_user_tier() <= 3
  );
