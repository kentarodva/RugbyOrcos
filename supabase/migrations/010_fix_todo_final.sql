-- ============================================================
-- SCRIPT DEFINITIVO: Arreglar TODO sistema auth + RLS
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor
-- ============================================================

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 1: Limpiar TODO lo viejo y conflictivo
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS admin_create_user CASCADE;
DROP FUNCTION IF EXISTS admin_create_player_credentials CASCADE;
DROP FUNCTION IF EXISTS admin_reset_player_password CASCADE;
DROP FUNCTION IF EXISTS get_user_role CASCADE;
DROP FUNCTION IF EXISTS get_user_club_scope CASCADE;
DROP FUNCTION IF EXISTS get_user_division_scope CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS update_standing CASCADE;
DELETE FROM auth.users WHERE email = 'kentarodva@gmail.com';

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 2: is_admin() SECURITY DEFINER (bypass RLS)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND system_role IN ('desarrollador','presidente','promotor')
    AND is_active = true
  );
$$;

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 3: RLS user_profiles (sin recursion)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Owners update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON user_profiles;
DROP POLICY IF EXISTS "Self insert profile" ON user_profiles;
DROP POLICY IF EXISTS "Self update profile" ON user_profiles;
DROP POLICY IF EXISTS "Read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin write profiles" ON user_profiles;
DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "profiles_admin_write" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON user_profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON user_profiles;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_admin_write" ON user_profiles FOR ALL USING (is_admin());
CREATE POLICY "profiles_self_insert" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "profiles_self_update" ON user_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 4: RLS players
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own players" ON players;
DROP POLICY IF EXISTS "Users can insert own players" ON players;
DROP POLICY IF EXISTS "Users can update own players" ON players;
DROP POLICY IF EXISTS "Users can delete own players" ON players;
DROP POLICY IF EXISTS "Admins full access players" ON players;
DROP POLICY IF EXISTS "Promoter sees club players" ON players;
DROP POLICY IF EXISTS "Trainer sees division players" ON players;
DROP POLICY IF EXISTS "Player sees own profile" ON players;
DROP POLICY IF EXISTS "Auth read players" ON players;
DROP POLICY IF EXISTS "Owner insert players" ON players;
DROP POLICY IF EXISTS "Owner update players" ON players;
DROP POLICY IF EXISTS "Owner delete players" ON players;
DROP POLICY IF EXISTS "players_select" ON players;
DROP POLICY IF EXISTS "players_insert" ON players;
DROP POLICY IF EXISTS "players_update" ON players;
DROP POLICY IF EXISTS "players_delete" ON players;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "players_update" ON players FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "players_delete" ON players FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 5: RLS schedule_events
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE schedule_events DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own schedule_events" ON schedule_events;
DROP POLICY IF EXISTS "Admins full access schedule" ON schedule_events;
DROP POLICY IF EXISTS "Auth read schedule" ON schedule_events;
DROP POLICY IF EXISTS "Owner manage schedule" ON schedule_events;
DROP POLICY IF EXISTS "schedule_select" ON schedule_events;
DROP POLICY IF EXISTS "schedule_write" ON schedule_events;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule_select" ON schedule_events FOR SELECT USING (true);
CREATE POLICY "schedule_write" ON schedule_events FOR ALL USING (user_id = auth.uid() OR is_admin());

-- championships
ALTER TABLE championships DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own championships" ON championships;
DROP POLICY IF EXISTS "Auth read champs" ON championships;
DROP POLICY IF EXISTS "Owner manage champs" ON championships;
DROP POLICY IF EXISTS "champs_select" ON championships;
DROP POLICY IF EXISTS "champs_write" ON championships;
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "champs_select" ON championships FOR SELECT USING (true);
CREATE POLICY "champs_write" ON championships FOR ALL USING (user_id = auth.uid() OR is_admin());

-- finances
ALTER TABLE finances DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own finances" ON finances;
DROP POLICY IF EXISTS "Auth read finances" ON finances;
DROP POLICY IF EXISTS "Owner manage finances" ON finances;
DROP POLICY IF EXISTS "finances_select" ON finances;
DROP POLICY IF EXISTS "finances_write" ON finances;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finances_select" ON finances FOR SELECT USING (true);
CREATE POLICY "finances_write" ON finances FOR ALL USING (user_id = auth.uid() OR is_admin());

-- inventory
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own inventory" ON inventory;
DROP POLICY IF EXISTS "Auth read inv" ON inventory;
DROP POLICY IF EXISTS "Owner manage inv" ON inventory;
DROP POLICY IF EXISTS "inv_select" ON inventory;
DROP POLICY IF EXISTS "inv_write" ON inventory;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_select" ON inventory FOR SELECT USING (true);
CREATE POLICY "inv_write" ON inventory FOR ALL USING (user_id = auth.uid() OR is_admin());

-- fixtures
ALTER TABLE fixtures DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own fixtures" ON fixtures;
DROP POLICY IF EXISTS "Auth read fixtures" ON fixtures;
DROP POLICY IF EXISTS "Owner manage fixtures" ON fixtures;
DROP POLICY IF EXISTS "fixtures_select" ON fixtures;
DROP POLICY IF EXISTS "fixtures_write" ON fixtures;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fixtures_select" ON fixtures FOR SELECT USING (true);
CREATE POLICY "fixtures_write" ON fixtures FOR ALL USING (user_id = auth.uid() OR is_admin());

-- rivals
ALTER TABLE rivals DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own rivals" ON rivals;
DROP POLICY IF EXISTS "Auth read rivals" ON rivals;
DROP POLICY IF EXISTS "Owner manage rivals" ON rivals;
DROP POLICY IF EXISTS "rivals_select" ON rivals;
DROP POLICY IF EXISTS "rivals_write" ON rivals;
ALTER TABLE rivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rivals_select" ON rivals FOR SELECT USING (true);
CREATE POLICY "rivals_write" ON rivals FOR ALL USING (user_id = auth.uid() OR is_admin());

-- future_fixtures
ALTER TABLE future_fixtures DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own future_fixtures" ON future_fixtures;
DROP POLICY IF EXISTS "Auth read future" ON future_fixtures;
DROP POLICY IF EXISTS "Owner manage future" ON future_fixtures;
DROP POLICY IF EXISTS "future_select" ON future_fixtures;
DROP POLICY IF EXISTS "future_write" ON future_fixtures;
ALTER TABLE future_fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "future_select" ON future_fixtures FOR SELECT USING (true);
CREATE POLICY "future_write" ON future_fixtures FOR ALL USING (user_id = auth.uid() OR is_admin());

-- lineups
ALTER TABLE lineups DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own lineups" ON lineups;
DROP POLICY IF EXISTS "Auth read lineups" ON lineups;
DROP POLICY IF EXISTS "Owner manage lineups" ON lineups;
DROP POLICY IF EXISTS "lineups_select" ON lineups;
DROP POLICY IF EXISTS "lineups_write" ON lineups;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lineups_select" ON lineups FOR SELECT USING (true);
CREATE POLICY "lineups_write" ON lineups FOR ALL USING (user_id = auth.uid() OR is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 6: RLS tablas Mak'Gora
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE makgora_teams DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view makgora_teams" ON makgora_teams;
DROP POLICY IF EXISTS "Admins can manage makgora_teams" ON makgora_teams;
DROP POLICY IF EXISTS "makgora_teams_select" ON makgora_teams;
DROP POLICY IF EXISTS "makgora_teams_write" ON makgora_teams;
ALTER TABLE makgora_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "makgora_teams_select" ON makgora_teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "makgora_teams_write" ON makgora_teams FOR ALL USING (is_admin());

ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admins and promoters can manage tournaments" ON tournaments;
DROP POLICY IF EXISTS "tourn_select" ON tournaments;
DROP POLICY IF EXISTS "tourn_write" ON tournaments;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tourn_select" ON tournaments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tourn_write" ON tournaments FOR ALL USING (is_admin());

ALTER TABLE tournament_teams DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view tournament_teams" ON tournament_teams;
DROP POLICY IF EXISTS "Admins and promoters can manage tournament_teams" ON tournament_teams;
DROP POLICY IF EXISTS "tourn_teams_select" ON tournament_teams;
DROP POLICY IF EXISTS "tourn_teams_write" ON tournament_teams;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tourn_teams_select" ON tournament_teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tourn_teams_write" ON tournament_teams FOR ALL USING (is_admin());

ALTER TABLE tournament_matches DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view tournament_matches" ON tournament_matches;
DROP POLICY IF EXISTS "Admins and promoters can manage tournament_matches" ON tournament_matches;
DROP POLICY IF EXISTS "tourn_matches_select" ON tournament_matches;
DROP POLICY IF EXISTS "tourn_matches_write" ON tournament_matches;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tourn_matches_select" ON tournament_matches FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tourn_matches_write" ON tournament_matches FOR ALL USING (is_admin());

ALTER TABLE tournament_standings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view tournament_standings" ON tournament_standings;
DROP POLICY IF EXISTS "Admins and promoters can manage tournament_standings" ON tournament_standings;
DROP POLICY IF EXISTS "standings_select" ON tournament_standings;
DROP POLICY IF EXISTS "standings_write" ON tournament_standings;
ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "standings_select" ON tournament_standings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "standings_write" ON tournament_standings FOR ALL USING (is_admin());

ALTER TABLE tournament_player_stats DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view tournament_player_stats" ON tournament_player_stats;
DROP POLICY IF EXISTS "Admins and promoters can manage tournament_player_stats" ON tournament_player_stats;
DROP POLICY IF EXISTS "tourn_stats_select" ON tournament_player_stats;
DROP POLICY IF EXISTS "tourn_stats_write" ON tournament_player_stats;
ALTER TABLE tournament_player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tourn_stats_select" ON tournament_player_stats FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tourn_stats_write" ON tournament_player_stats FOR ALL USING (is_admin());

ALTER TABLE player_loans DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view player_loans" ON player_loans;
DROP POLICY IF EXISTS "Admins and promoters can manage player_loans" ON player_loans;
DROP POLICY IF EXISTS "loans_select" ON player_loans;
DROP POLICY IF EXISTS "loans_write" ON player_loans;
ALTER TABLE player_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loans_select" ON player_loans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "loans_write" ON player_loans FOR ALL USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 7: Tablas hijas de players
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE attribute_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage attribute_history for own players" ON attribute_history;
DROP POLICY IF EXISTS "attribute_history_select" ON attribute_history;
DROP POLICY IF EXISTS "attribute_history_write" ON attribute_history;
ALTER TABLE attribute_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attribute_history_select" ON attribute_history FOR SELECT USING (true);
CREATE POLICY "attribute_history_write" ON attribute_history FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = attribute_history.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE injury_log DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage injury_log for own players" ON injury_log;
DROP POLICY IF EXISTS "injury_log_select" ON injury_log;
DROP POLICY IF EXISTS "injury_log_write" ON injury_log;
ALTER TABLE injury_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "injury_log_select" ON injury_log FOR SELECT USING (true);
CREATE POLICY "injury_log_write" ON injury_log FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = injury_log.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage attendance for own players" ON attendance;
DROP POLICY IF EXISTS "attendance_select" ON attendance;
DROP POLICY IF EXISTS "attendance_write" ON attendance;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select" ON attendance FOR SELECT USING (true);
CREATE POLICY "attendance_write" ON attendance FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = attendance.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE player_attendance_summary DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage player_attendance_summary for own players" ON player_attendance_summary;
DROP POLICY IF EXISTS "player_attendance_summary_select" ON player_attendance_summary;
DROP POLICY IF EXISTS "player_attendance_summary_write" ON player_attendance_summary;
ALTER TABLE player_attendance_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_attendance_summary_select" ON player_attendance_summary FOR SELECT USING (true);
CREATE POLICY "player_attendance_summary_write" ON player_attendance_summary FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_attendance_summary.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE penalties DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage penalties for own players" ON penalties;
DROP POLICY IF EXISTS "penalties_select" ON penalties;
DROP POLICY IF EXISTS "penalties_write" ON penalties;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "penalties_select" ON penalties FOR SELECT USING (true);
CREATE POLICY "penalties_write" ON penalties FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = penalties.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE infractions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage infractions for own players" ON infractions;
DROP POLICY IF EXISTS "infractions_select" ON infractions;
DROP POLICY IF EXISTS "infractions_write" ON infractions;
ALTER TABLE infractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "infractions_select" ON infractions FOR SELECT USING (true);
CREATE POLICY "infractions_write" ON infractions FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = infractions.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE match_stats DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage match_stats for own players" ON match_stats;
DROP POLICY IF EXISTS "match_stats_select" ON match_stats;
DROP POLICY IF EXISTS "match_stats_write" ON match_stats;
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "match_stats_select" ON match_stats FOR SELECT USING (true);
CREATE POLICY "match_stats_write" ON match_stats FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = match_stats.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE wellness_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage wellness_logs for own players" ON wellness_logs;
DROP POLICY IF EXISTS "wellness_logs_select" ON wellness_logs;
DROP POLICY IF EXISTS "wellness_logs_write" ON wellness_logs;
ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wellness_logs_select" ON wellness_logs FOR SELECT USING (true);
CREATE POLICY "wellness_logs_write" ON wellness_logs FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = wellness_logs.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE hia_assessments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage hia_assessments for own players" ON hia_assessments;
DROP POLICY IF EXISTS "hia_assessments_select" ON hia_assessments;
DROP POLICY IF EXISTS "hia_assessments_write" ON hia_assessments;
ALTER TABLE hia_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hia_assessments_select" ON hia_assessments FOR SELECT USING (true);
CREATE POLICY "hia_assessments_write" ON hia_assessments FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = hia_assessments.player_id AND (players.user_id = auth.uid() OR is_admin())));

ALTER TABLE workout_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage workout_logs for own players" ON workout_logs;
DROP POLICY IF EXISTS "workout_logs_select" ON workout_logs;
DROP POLICY IF EXISTS "workout_logs_write" ON workout_logs;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_logs_select" ON workout_logs FOR SELECT USING (true);
CREATE POLICY "workout_logs_write" ON workout_logs FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = workout_logs.player_id AND (players.user_id = auth.uid() OR is_admin())));

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 8: Recrear funciones RPC
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
CREATE OR REPLACE FUNCTION generate_player_username(
  p_first_name TEXT, p_last_name TEXT, p_nickname TEXT DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SET search_path = 'public' AS $$
DECLARE
  v_base TEXT; v_username TEXT; v_counter INTEGER := 0;
BEGIN
  IF p_nickname IS NOT NULL AND p_nickname != '' THEN
    v_base := lower(regexp_replace(p_nickname, '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    v_base := lower(regexp_replace(COALESCE(p_first_name,'')||'.'||COALESCE(p_last_name,''), '[^a-zA-Z0-9.]', '', 'g'));
  END IF;
  IF length(v_base) > 40 THEN v_base := left(v_base, 40); END IF;
  IF v_base = '' OR v_base = '.' THEN v_base := 'guerrero'; END IF;
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM players WHERE username = v_username) LOOP
    v_counter := v_counter + 1; v_username := v_base || v_counter::TEXT;
  END LOOP;
  RETURN v_username;
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_player_credentials(
  p_player_id UUID, p_password TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public' AS $$
DECLARE
  v_player RECORD; v_username TEXT; v_email TEXT; v_user_id UUID; v_password TEXT;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  v_username := COALESCE(v_player.username, generate_player_username(v_player.first_name, v_player.last_name, v_player.nickname));
  v_email := COALESCE(v_player.phone, v_player.email, v_username || '@orcos.local');
  v_password := COALESCE(p_password, left(md5(random()::TEXT), 10));
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email, crypt(v_password, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero')), now(), now())
  RETURNING id INTO v_user_id;
  UPDATE players SET username = v_username, email = v_email WHERE id = p_player_id;
  INSERT INTO user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (v_user_id, COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'jugador', v_player.team_category)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, system_role = EXCLUDED.system_role, club_scope = EXCLUDED.club_scope;
  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password);
END;
$$;

CREATE OR REPLACE FUNCTION admin_reset_player_password(
  p_player_id UUID, p_new_password TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public' AS $$
DECLARE v_player RECORD;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  IF v_player.email IS NULL THEN RETURN jsonb_build_object('error', 'No tiene credenciales. Forja credenciales primero.'); END IF;
  UPDATE auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now() WHERE email = v_player.email;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Cuenta auth no encontrada'); END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION update_standing(
  p_tournament_id UUID, p_team_id UUID, p_played INTEGER DEFAULT 1, p_won INTEGER DEFAULT 0,
  p_drawn INTEGER DEFAULT 0, p_lost INTEGER DEFAULT 0, p_points_for INTEGER DEFAULT 0,
  p_points_against INTEGER DEFAULT 0, p_total_points INTEGER DEFAULT 0, p_bonus INTEGER DEFAULT 0
) RETURNS VOID LANGUAGE plpgsql SET search_path = 'public' AS $$
DECLARE v_existing RECORD;
BEGIN
  SELECT * INTO v_existing FROM tournament_standings WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
  IF FOUND THEN
    UPDATE tournament_standings SET played = v_existing.played + p_played, won = v_existing.won + p_won,
    drawn = v_existing.drawn + p_drawn, lost = v_existing.lost + p_lost,
    points_for = v_existing.points_for + p_points_for, points_against = v_existing.points_against + p_points_against,
    bonus_points = v_existing.bonus_points + p_bonus, total_points = v_existing.total_points + p_total_points, updated_at = now()
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
  ELSE
    INSERT INTO tournament_standings (tournament_id, team_id, played, won, drawn, lost, points_for, points_against, bonus_points, total_points)
    VALUES (p_tournament_id, p_team_id, p_played, p_won, p_drawn, p_lost, p_points_for, p_points_against, p_bonus, p_total_points);
  END IF;
END;
$$;

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FASE 9: Reparar perfil del admin
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
INSERT INTO user_profiles (user_id, display_name, system_role, club_scope, is_active)
SELECT id, 'Arquitecto del Reino', 'desarrollador', NULL, true
FROM auth.users WHERE email = 'admin@orcosnegros.com'
ON CONFLICT (user_id) DO UPDATE SET system_role = 'desarrollador', is_active = true;
