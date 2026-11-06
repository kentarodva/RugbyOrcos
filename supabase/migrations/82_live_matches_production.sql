-- 82_live_matches_production.sql
-- El Match Center en vivo usa live_matches y live_match_events, pero las migraciones
-- 41, 42 y 72 nunca se aplicaron en producción (las tablas no existían).
-- Esta migración las crea de forma idempotente y endurece los permisos:
--   * ver: cualquier usuario autenticado (los jugadores siguen el partido)
--   * crear partido: solo staff (rango <= 3)
--   * anotar/editar: el creador, el staff o el jugador designado como anotador

CREATE TABLE IF NOT EXISTS public.live_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID REFERENCES public.fixtures(id) ON DELETE SET NULL,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  opponent_name VARCHAR(200) DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  elapsed_seconds INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'live',
  current_half VARCHAR(10) NOT NULL DEFAULT '1st_half'
    CHECK (current_half IN ('1st_half', 'ht', '2nd_half', 'ft')),
  orcos_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  team_category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.live_matches ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.live_matches ADD COLUMN IF NOT EXISTS delay_reason TEXT;
ALTER TABLE public.live_matches ADD COLUMN IF NOT EXISTS designated_scorer_name VARCHAR(150);
ALTER TABLE public.live_matches ADD COLUMN IF NOT EXISTS designated_scorer_id UUID REFERENCES public.players(id) ON DELETE SET NULL;
ALTER TABLE public.live_matches ADD COLUMN IF NOT EXISTS scorer_locked BOOLEAN DEFAULT false;

ALTER TABLE public.live_matches DROP CONSTRAINT IF EXISTS live_matches_status_check;
ALTER TABLE public.live_matches ADD CONSTRAINT live_matches_status_check
  CHECK (status IN ('live', 'paused', 'finished', 'delayed'));

CREATE INDEX IF NOT EXISTS idx_live_matches_status ON public.live_matches(status);
CREATE INDEX IF NOT EXISTS idx_live_matches_user ON public.live_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_live_matches_fixture ON public.live_matches(fixture_id);
CREATE INDEX IF NOT EXISTS idx_live_matches_scorer ON public.live_matches(designated_scorer_id);

CREATE TABLE IF NOT EXISTS public.live_match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_match_id UUID NOT NULL REFERENCES public.live_matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL
    CHECK (event_type IN (
      'try', 'conversion', 'penalty', 'drop_goal',
      'yellow_card', 'red_card', 'substitution', 'note',
      'half_start', 'half_end', 'score_adjust'
    )),
  minute INTEGER NOT NULL DEFAULT 0,
  team VARCHAR(10) NOT NULL DEFAULT 'orcos' CHECK (team IN ('orcos', 'opponent')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_match_events_match ON public.live_match_events(live_match_id);
CREATE INDEX IF NOT EXISTS idx_live_match_events_player ON public.live_match_events(player_id);

-- ¿Puede el usuario actual anotar en este partido?
CREATE OR REPLACE FUNCTION public.can_score_live_match(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.live_matches lm
    WHERE lm.id = p_match_id
      AND (
        lm.user_id = auth.uid()
        OR COALESCE(public.get_user_tier() <= 3, false)
        OR EXISTS (
          SELECT 1 FROM public.players p
          WHERE p.id = lm.designated_scorer_id AND p.user_id = auth.uid()
        )
      )
  );
$$;
REVOKE ALL ON FUNCTION public.can_score_live_match(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_score_live_match(UUID) TO authenticated;

ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_match_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS live_matches_select ON public.live_matches;
CREATE POLICY live_matches_select ON public.live_matches
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS live_matches_insert ON public.live_matches;
CREATE POLICY live_matches_insert ON public.live_matches
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND (select COALESCE(public.get_user_tier() <= 3, false)));

DROP POLICY IF EXISTS live_matches_update ON public.live_matches;
CREATE POLICY live_matches_update ON public.live_matches
  FOR UPDATE TO authenticated
  USING (public.can_score_live_match(id))
  WITH CHECK (public.can_score_live_match(id));

DROP POLICY IF EXISTS live_matches_delete ON public.live_matches;
CREATE POLICY live_matches_delete ON public.live_matches
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()));

DROP POLICY IF EXISTS live_match_events_select ON public.live_match_events;
CREATE POLICY live_match_events_select ON public.live_match_events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS live_match_events_insert ON public.live_match_events;
CREATE POLICY live_match_events_insert ON public.live_match_events
  FOR INSERT TO authenticated WITH CHECK (public.can_score_live_match(live_match_id));

DROP POLICY IF EXISTS live_match_events_update ON public.live_match_events;
CREATE POLICY live_match_events_update ON public.live_match_events
  FOR UPDATE TO authenticated
  USING (public.can_score_live_match(live_match_id))
  WITH CHECK (public.can_score_live_match(live_match_id));

DROP POLICY IF EXISTS live_match_events_delete ON public.live_match_events;
CREATE POLICY live_match_events_delete ON public.live_match_events
  FOR DELETE TO authenticated USING (public.can_score_live_match(live_match_id));

-- Realtime (el marcador se actualiza en vivo en todos los teléfonos)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_matches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_matches;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'live_match_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_match_events;
  END IF;
END $$;
