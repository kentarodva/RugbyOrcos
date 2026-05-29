-- ============================================================
-- FASE 6: Funcion RPC para actualizar standings Mak'Gora
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION update_standing(
  p_tournament_id UUID,
  p_team_id UUID,
  p_played INTEGER DEFAULT 1,
  p_won INTEGER DEFAULT 0,
  p_drawn INTEGER DEFAULT 0,
  p_lost INTEGER DEFAULT 0,
  p_points_for INTEGER DEFAULT 0,
  p_points_against INTEGER DEFAULT 0,
  p_total_points INTEGER DEFAULT 0,
  p_bonus INTEGER DEFAULT 0
) RETURNS VOID
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_existing RECORD;
BEGIN
  SELECT * INTO v_existing FROM tournament_standings
  WHERE tournament_id = p_tournament_id AND team_id = p_team_id;

  IF FOUND THEN
    UPDATE tournament_standings SET
      played = v_existing.played + p_played,
      won = v_existing.won + p_won,
      drawn = v_existing.drawn + p_drawn,
      lost = v_existing.lost + p_lost,
      points_for = v_existing.points_for + p_points_for,
      points_against = v_existing.points_against + p_points_against,
      tries_for = v_existing.tries_for + 0,
      tries_against = v_existing.tries_against + 0,
      bonus_points = v_existing.bonus_points + p_bonus,
      total_points = v_existing.total_points + p_total_points,
      updated_at = now()
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
  ELSE
    INSERT INTO tournament_standings (tournament_id, team_id, played, won, drawn, lost, points_for, points_against, bonus_points, total_points)
    VALUES (p_tournament_id, p_team_id, p_played, p_won, p_drawn, p_lost, p_points_for, p_points_against, p_bonus, p_total_points);
  END IF;
END;
$$;
