-- 94_live_match_lifecycle.sql
-- Auditoría de recorridos, punto 4 (2026-11-12): un partido nunca llegaba a ser resultado
-- ni a dar estadísticas.
--   * El partido en vivo solo podía colgarse de un RESULTADO (live_matches.fixture_id ->
--     fixtures); no de un partido programado.
--   * Al terminar, el teléfono creaba OTRO resultado (duplicado), o nada si no había
--     partido asociado; el marcador del rival no salía de los eventos; no se generaban
--     estadísticas por jugador; el partido programado nunca quedaba como jugado.
--
--   * live_matches.future_fixture_id: el partido programado que se juega en vivo.
--   * future_fixtures.result_fixture_id: el resultado en que terminó (= ya se jugó).
--   * finish_live_match(): cierra el partido en una transacción. Marcador desde los
--     eventos, completa el resultado existente o crea uno solo, estadísticas por jugador
--     (convocados incluidos, con 0) y marca jugado el partido programado. Si se llama dos
--     veces devuelve lo mismo (no duplica).
-- Idempotente.

ALTER TABLE public.live_matches
  ADD COLUMN IF NOT EXISTS future_fixture_id UUID REFERENCES public.future_fixtures(id) ON DELETE SET NULL;
ALTER TABLE public.future_fixtures
  ADD COLUMN IF NOT EXISTS result_fixture_id UUID REFERENCES public.fixtures(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.finish_live_match(p_match_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m live_matches%ROWTYPE;
  ff future_fixtures%ROWTYPE;
  v_orcos INTEGER;
  v_opp INTEGER;
  v_tries INTEGER;
  v_date DATE;
  v_opponent TEXT;
  v_category TEXT;
  v_fixture UUID;
  v_elapsed INTEGER;
  v_stats INTEGER := 0;
BEGIN
  IF NOT can_score_live_match(p_match_id) THEN
    RAISE EXCEPTION 'No puedes cerrar este partido' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO m FROM live_matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido en vivo no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF m.future_fixture_id IS NOT NULL THEN
    SELECT * INTO ff FROM future_fixtures WHERE id = m.future_fixture_id;
  END IF;

  -- Marcador: solo desde los eventos (los puntos del rival llegan como score_adjust).
  SELECT
    coalesce(sum(CASE WHEN team = 'orcos' THEN
      CASE event_type WHEN 'try' THEN 5 WHEN 'conversion' THEN 2 WHEN 'penalty' THEN 3 WHEN 'drop_goal' THEN 3 ELSE 0 END
    END), 0),
    coalesce(sum(CASE WHEN team = 'opponent' THEN
      CASE event_type WHEN 'try' THEN 5 WHEN 'conversion' THEN 2 WHEN 'penalty' THEN 3 WHEN 'drop_goal' THEN 3
        WHEN 'score_adjust' THEN coalesce(nullif(details ->> 'points', '')::numeric, 0)::int ELSE 0 END
    END), 0),
    count(*) FILTER (WHERE team = 'orcos' AND event_type = 'try')
  INTO v_orcos, v_opp, v_tries
  FROM live_match_events WHERE live_match_id = m.id;

  v_date := coalesce(ff.date, (coalesce(m.started_at, now()) AT TIME ZONE 'America/Bogota')::date);
  v_opponent := coalesce(nullif(m.opponent_name, ''), nullif(ff.opponent, ''), 'Rival');
  v_category := coalesce(m.team_category, ff.team_category);
  v_elapsed := coalesce(m.elapsed_seconds, 0)
    + CASE WHEN m.status = 'live' AND m.started_at IS NOT NULL
           THEN greatest(0, extract(epoch FROM now() - m.started_at)::int) ELSE 0 END;

  -- Resultado: completar el existente o crear uno solo.
  v_fixture := coalesce(m.fixture_id, ff.result_fixture_id);
  IF v_fixture IS NOT NULL THEN
    UPDATE fixtures SET orcos_score = v_orcos, opponent_score = v_opp, tries = v_tries
     WHERE id = v_fixture;
  ELSE
    INSERT INTO fixtures (user_id, date, opponent, orcos_score, opponent_score, tries, team_category, rival_id, squad)
    VALUES (coalesce(auth.uid(), m.user_id), v_date, v_opponent, v_orcos, v_opp, v_tries, v_category,
            ff.rival_id, coalesce(ff.squad, '{}'::jsonb))
    RETURNING id INTO v_fixture;
  END IF;

  SELECT date, opponent INTO v_date, v_opponent FROM fixtures WHERE id = v_fixture;

  UPDATE live_matches
     SET status = 'finished', current_half = 'ft', fixture_id = v_fixture,
         orcos_score = v_orcos, opponent_score = v_opp, elapsed_seconds = v_elapsed
   WHERE id = m.id;

  IF ff.id IS NOT NULL THEN
    UPDATE future_fixtures SET result_fixture_id = v_fixture WHERE id = ff.id;
  END IF;

  -- Estadísticas por jugador: lo anotado en vivo + los convocados (con 0). Se escriben
  -- (no se suman) para que cerrar dos veces no duplique.
  WITH squad_ids AS (
    SELECT DISTINCT x::uuid AS player_id
    FROM jsonb_array_elements_text(
           coalesce(ff.squad -> 'startingXV', '[]'::jsonb) || coalesce(ff.squad -> 'substitutes', '[]'::jsonb)) AS x
    WHERE x ~* '^[0-9a-f-]{36}$'
  ), from_events AS (
    SELECT player_id,
           count(*) FILTER (WHERE event_type = 'try') AS tries,
           count(*) FILTER (WHERE event_type = 'conversion') AS conversions,
           count(*) FILTER (WHERE event_type = 'yellow_card') AS yellows,
           count(*) FILTER (WHERE event_type = 'red_card') AS reds
    FROM live_match_events
    WHERE live_match_id = m.id AND team = 'orcos' AND player_id IS NOT NULL
    GROUP BY player_id
  ), rows AS (
    SELECT coalesce(e.player_id, s.player_id) AS player_id,
           coalesce(e.tries, 0) AS tries, coalesce(e.conversions, 0) AS conversions,
           coalesce(e.yellows, 0) AS yellows, coalesce(e.reds, 0) AS reds
    FROM from_events e FULL JOIN squad_ids s ON s.player_id = e.player_id
  ), upserted AS (
    INSERT INTO match_stats (player_id, match_date, opponent, tries, conversions, yellow_cards, red_cards)
    SELECT r.player_id, v_date, v_opponent, r.tries, r.conversions, r.yellows, r.reds
    FROM rows r JOIN players p ON p.id = r.player_id
    ON CONFLICT (player_id, match_date, opponent) DO UPDATE
      SET tries = EXCLUDED.tries, conversions = EXCLUDED.conversions,
          yellow_cards = EXCLUDED.yellow_cards, red_cards = EXCLUDED.red_cards
    RETURNING 1
  )
  SELECT count(*) INTO v_stats FROM upserted;

  RETURN jsonb_build_object('fixture_id', v_fixture, 'orcos_score', v_orcos, 'opponent_score', v_opp,
                            'tries', v_tries, 'player_stats', v_stats);
END $$;

REVOKE ALL ON FUNCTION public.finish_live_match(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_live_match(UUID) TO authenticated;
