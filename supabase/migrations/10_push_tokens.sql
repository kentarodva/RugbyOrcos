-- Push notification tokens for each player device
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  team_category TEXT,
  makgora_team_id UUID,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_player_id ON push_tokens(player_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_team_category ON push_tokens(team_category);
CREATE INDEX IF NOT EXISTS idx_push_tokens_makgora_team_id ON push_tokens(makgora_team_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_position ON push_tokens(position);

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Players can upsert their own token
DROP POLICY IF EXISTS "players_upsert_own_token" ON push_tokens;
CREATE POLICY "players_upsert_own_token" ON push_tokens
  FOR ALL
  TO authenticated
  USING (player_id IN (
    SELECT id FROM players WHERE user_id = auth.uid()
  ));

-- Staff can read all tokens to send notifications
DROP POLICY IF EXISTS "staff_read_all_tokens" ON push_tokens;
CREATE POLICY "staff_read_all_tokens" ON push_tokens
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = push_tokens.player_id
      AND (
        players.system_role IN ('desarrollador', 'presidente', 'entrenador', 'tesorero', 'promotor', 'arbitro')
        OR players.user_id = auth.uid()
      )
    )
  );

-- Update updated_at on token upsert
CREATE OR REPLACE FUNCTION update_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER trg_push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_token_timestamp();
