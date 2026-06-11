-- Gym History
-- Trackeo histórico de fuerza (sentadilla, banca, peso muerto) para gráficas de evolución

CREATE TABLE IF NOT EXISTS gym_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  squat NUMERIC(6,1) DEFAULT 0,
  bench NUMERIC(6,1) DEFAULT 0,
  deadlift NUMERIC(6,1) DEFAULT 0,
  weight NUMERIC(5,1),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gym_history_player_date ON gym_history (player_id, recorded_date DESC);

-- Enable RLS
ALTER TABLE gym_history ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Todos pueden leer historial gym"
  ON gym_history FOR SELECT
  TO authenticated
  USING (true);

-- Staff (tier <= 3) can insert
CREATE POLICY "Staff puede registrar historial gym"
  ON gym_history FOR INSERT
  TO authenticated
  WITH CHECK (get_user_tier() <= 3);

-- Only super roles can update/delete
CREATE POLICY "Super roles pueden editar historial gym"
  ON gym_history FOR UPDATE
  TO authenticated
  USING (get_user_tier() <= 1);

CREATE POLICY "Super roles pueden eliminar historial gym"
  ON gym_history FOR DELETE
  TO authenticated
  USING (get_user_tier() <= 1);
