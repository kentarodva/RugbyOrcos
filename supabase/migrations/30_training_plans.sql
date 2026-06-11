-- Training Plans
-- Planes de entrenamiento personalizados para cada jugador, generados semanalmente
-- por el engine determinista + enriquecimiento IA (OpenRouter)

CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ai', 'engine', 'manual')),
  plan JSONB NOT NULL,
  ai_analysis JSONB,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  feedback JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (player_id, week_start)
);

-- Enable RLS
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

-- Jugadores ven solo sus propios planes
CREATE POLICY "Jugador ve su plan"
  ON training_plans FOR SELECT
  TO authenticated
  USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()) OR get_user_tier() <= 3);

-- Staff (tier <= 3) puede insertar/actualizar cualquier plan
CREATE POLICY "Staff puede gestionar planes"
  ON training_plans FOR INSERT
  TO authenticated
  WITH CHECK (get_user_tier() <= 3);

CREATE POLICY "Staff puede actualizar planes"
  ON training_plans FOR UPDATE
  TO authenticated
  USING (get_user_tier() <= 3 OR player_id IN (SELECT id FROM players WHERE user_id = auth.uid()))
  WITH CHECK (get_user_tier() <= 3 OR player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

-- Solo staff puede eliminar planes
CREATE POLICY "Staff puede eliminar planes"
  ON training_plans FOR DELETE
  TO authenticated
  USING (get_user_tier() <= 3);

-- Índice para búsqueda rápida por jugador + semana activa
CREATE INDEX IF NOT EXISTS idx_training_plans_player_active
  ON training_plans (player_id, week_start DESC, status);

CREATE INDEX IF NOT EXISTS idx_training_plans_week
  ON training_plans (week_start DESC);
