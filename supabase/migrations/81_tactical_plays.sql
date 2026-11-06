-- 81_tactical_plays.sql
-- Jugadas propias de la Pizarra: secuencias de fases (posiciones de Orcos, rivales y balón)
-- que el staff arma con "Capturar fase" y guarda con nombre para todo el equipo.
-- Coordenadas en el formato canónico horizontal de la pizarra (mismo que presetPlays.js).
-- Solo AÑADE una tabla nueva; no toca datos existentes. Idempotente.

CREATE TABLE IF NOT EXISTS public.tactical_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'all',
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  phases JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(phases) = 'array' AND jsonb_array_length(phases) BETWEEN 1 AND 30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tactical_plays_scope ON public.tactical_plays(scope);
CREATE INDEX IF NOT EXISTS idx_tactical_plays_user ON public.tactical_plays(user_id);

ALTER TABLE public.tactical_plays ENABLE ROW LEVEL SECURITY;

-- Lectura: mismas reglas que custom_tactics (jugadas globales, del propio autor o de su equipo).
DROP POLICY IF EXISTS tactical_plays_select ON public.tactical_plays;
CREATE POLICY tactical_plays_select ON public.tactical_plays
  FOR SELECT TO authenticated
  USING (
    scope = 'all'
    OR user_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.is_active = true AND tm.team_category = tactical_plays.scope
    )
  );

-- Escritura: solo staff con permiso de tácticas (admin o entrenador), y siempre como autor propio.
DROP POLICY IF EXISTS tactical_plays_insert ON public.tactical_plays;
CREATE POLICY tactical_plays_insert ON public.tactical_plays
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (is_admin() OR public.has_club_role(ARRAY['entrenador'])));

DROP POLICY IF EXISTS tactical_plays_update ON public.tactical_plays;
CREATE POLICY tactical_plays_update ON public.tactical_plays
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS tactical_plays_delete ON public.tactical_plays;
CREATE POLICY tactical_plays_delete ON public.tactical_plays
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_admin());
