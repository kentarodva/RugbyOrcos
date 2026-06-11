CREATE TABLE IF NOT EXISTS club_config (
  id SERIAL PRIMARY KEY,
  team_category TEXT NOT NULL DEFAULT 'orcos',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_category, key)
);

ALTER TABLE club_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_config_select_all" ON club_config
  FOR SELECT USING (true);

CREATE POLICY "club_config_insert_admin" ON club_config
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE system_role IN ('admin', 'staff')
    )
  );

CREATE POLICY "club_config_update_admin" ON club_config
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE system_role IN ('admin', 'staff')
    )
  );

INSERT INTO club_config (team_category, key, value)
VALUES ('orcos', 'mensualidad_base', '10000')
ON CONFLICT (team_category, key) DO NOTHING;
