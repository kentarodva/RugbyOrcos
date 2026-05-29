-- ============================================================
-- RUGBY ORCOS NEGROS — Schema v4.0 (DESDE CERO)
-- Ejecutar DESPUES de reset_db.sql en Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLAS
-- ============================================================

-- 1. PLAYERS
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    legacy_id VARCHAR(10),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    nickname VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    document_type VARCHAR(50),
    document_number VARCHAR(50),
    birth_date DATE,
    age INTEGER,
    phone VARCHAR(30),
    email VARCHAR(150),
    initial_category VARCHAR(50),
    start_year INTEGER,
    current_category VARCHAR(50),
    internal_team VARCHAR(50),
    team_category VARCHAR(100),
    weight_kg NUMERIC(5,1),
    height_m NUMERIC(4,2),
    had_fractures BOOLEAN DEFAULT false,
    fracture_details TEXT,
    allergies TEXT,
    medical_conditions TEXT,
    health_insurance VARCHAR(100),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(30),
    commitment_accepted BOOLEAN DEFAULT true,
    jersey_number INTEGER,
    role VARCHAR(50) DEFAULT 'Titular',
    position VARCHAR(50),
    status VARCHAR(30) DEFAULT 'activo',
    attr_force INTEGER DEFAULT 50,
    attr_speed INTEGER DEFAULT 50,
    attr_stamina INTEGER DEFAULT 50,
    attr_technique INTEGER DEFAULT 70,
    clothing_jersey VARCHAR(10),
    clothing_shorts VARCHAR(10),
    clothing_socks VARCHAR(10),
    gym_squat NUMERIC(6,1) DEFAULT 0,
    gym_bench NUMERIC(6,1) DEFAULT 0,
    gym_deadlift NUMERIC(6,1) DEFAULT 0,
    makgora_team_id UUID,
    system_role VARCHAR(50) DEFAULT 'jugador',
    source VARCHAR(30) DEFAULT 'manual',
    form_submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_team ON players(team_category);
CREATE INDEX idx_players_status ON players(status);

-- 2. USER_PROFILES
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    system_role VARCHAR(50) NOT NULL DEFAULT 'jugador'
        CHECK (system_role IN ('desarrollador','presidente','promotor','entrenador','tesorero','arbitro','jugador')),
    club_scope VARCHAR(50),
    division_scope VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_up_user ON user_profiles(user_id);

-- 3-12. TABLAS HIJAS (linked to players)
CREATE TABLE attribute_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attr_force INTEGER, attr_speed INTEGER, attr_stamina INTEGER, attr_technique INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE injury_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    diagnosis TEXT NOT NULL,
    injury_date DATE,
    recovery_weeks INTEGER DEFAULT 0,
    phase INTEGER DEFAULT 1 CHECK (phase BETWEEN 1 AND 4),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('present','late','absent_unjustified','absent_justified')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE player_attendance_summary (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    total INTEGER DEFAULT 0, present INTEGER DEFAULT 0, late INTEGER DEFAULT 0,
    absent_unjustified INTEGER DEFAULT 0, absent_justified INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE penalties (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    burpees INTEGER DEFAULT 0, cones BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    infraction_date DATE NOT NULL,
    penalties INTEGER DEFAULT 0, yellow_cards INTEGER DEFAULT 0, red_cards INTEGER DEFAULT 0,
    fault_type VARCHAR(50), context VARCHAR(50) DEFAULT 'partido', notes TEXT, description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    match_date DATE NOT NULL, opponent VARCHAR(100),
    tries INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0, tackles INTEGER DEFAULT 0, turnovers INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0, red_cards INTEGER DEFAULT 0, mvp BOOLEAN DEFAULT false,
    context VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (context IN ('general','makgora')),
    tournament_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wellness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
    muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 1 AND 5),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hia_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    symptoms TEXT[], result VARCHAR(50), suspension_days INTEGER DEFAULT 14,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    routine_name VARCHAR(200), category VARCHAR(50), exercises JSONB DEFAULT '[]', completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13-20. TABLAS DE APLICACION
CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL, date DATE NOT NULL, time VARCHAR(10),
    location VARCHAR(300), maps_link VARCHAR(500), type VARCHAR(30) DEFAULT 'entrenamiento',
    team_category VARCHAR(100), linked_routine VARCHAR(200), recurrence_group UUID,
    context VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (context IN ('general','makgora')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE championships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL, deadline_date DATE, description TEXT,
    team_category VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ingreso','egreso')),
    descripcion TEXT, amount NUMERIC(12,2) NOT NULL, date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(50), team_category VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL, total INTEGER DEFAULT 1, assigned_to VARCHAR(200),
    status VARCHAR(50) DEFAULT 'Excelente', team_category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL, opponent VARCHAR(200), orcos_score INTEGER DEFAULT 0, opponent_score INTEGER DEFAULT 0,
    tries INTEGER DEFAULT 0, mvp VARCHAR(200), team_category VARCHAR(100),
    context VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (context IN ('general','makgora')),
    tournament_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL, colors VARCHAR(200), contact VARCHAR(200), notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE future_fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    opponent VARCHAR(200), date DATE NOT NULL, time VARCHAR(10),
    location VARCHAR(300), team_category VARCHAR(100), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    team_category VARCHAR(100) NOT NULL, formation VARCHAR(100), orientation VARCHAR(20) DEFAULT 'horizontal',
    size VARCHAR(20) DEFAULT 'medium', notes TEXT, positions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, team_category)
);

-- 21-27. TABLAS MAK'GORA
CREATE TABLE makgora_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, rpg_name VARCHAR(100), emblem_color VARCHAR(50),
    sort_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL, edition_name VARCHAR(200),
    start_date DATE NOT NULL, end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'proximo' CHECK (status IN ('proximo','en_curso','finalizado','cancelado')),
    winner_team_id UUID REFERENCES makgora_teams(id),
    created_by UUID, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES makgora_teams(id),
    captain_player_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL, phase VARCHAR(30) NOT NULL DEFAULT 'regular' CHECK (phase IN ('regular','semifinal','final','tercer_puesto')),
    home_team_id UUID NOT NULL REFERENCES makgora_teams(id),
    away_team_id UUID NOT NULL REFERENCES makgora_teams(id),
    home_score INTEGER, away_score INTEGER, home_tries INTEGER DEFAULT 0, away_tries INTEGER DEFAULT 0,
    match_date DATE, match_time VARCHAR(10), location VARCHAR(300),
    status VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','jugado','cancelado','forfeit')),
    mvp VARCHAR(200), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES makgora_teams(id),
    played INTEGER DEFAULT 0, won INTEGER DEFAULT 0, drawn INTEGER DEFAULT 0, lost INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0, points_against INTEGER DEFAULT 0,
    point_diff INTEGER GENERATED ALWAYS AS (points_for - points_against) STORED,
    tries_for INTEGER DEFAULT 0, tries_against INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0, total_points INTEGER DEFAULT 0, position INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(tournament_id, team_id)
);

CREATE TABLE tournament_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    tries INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0, tackles INTEGER DEFAULT 0, turnovers INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0, red_cards INTEGER DEFAULT 0, mvp BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE player_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    from_team_id UUID REFERENCES makgora_teams(id),
    to_team_id UUID NOT NULL REFERENCES makgora_teams(id),
    tournament_id UUID REFERENCES tournaments(id),
    match_id UUID REFERENCES tournament_matches(id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE, end_date DATE NOT NULL,
    reason TEXT, status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','returned','cancelled')),
    approved_by UUID, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES
-- ============================================================

-- is_admin: SECURITY DEFINER, sin recursion
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

-- Generar username unico
CREATE OR REPLACE FUNCTION generate_player_username(
  p_first_name TEXT, p_last_name TEXT, p_nickname TEXT DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SET search_path = 'public' AS $$
DECLARE v_base TEXT; v_username TEXT; v_counter INTEGER := 0;
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

-- Crear credenciales de jugador
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
  INSERT INTO user_profiles (user_id, display_name, system_role, club_scope) VALUES (v_user_id, COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'jugador', v_player.team_category)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, system_role = EXCLUDED.system_role, club_scope = EXCLUDED.club_scope;
  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password);
END;
$$;

-- Resetear contrasena
CREATE OR REPLACE FUNCTION admin_reset_player_password(
  p_player_id UUID, p_new_password TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public' AS $$
DECLARE v_player RECORD;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  IF v_player.email IS NULL THEN RETURN jsonb_build_object('error', 'No tiene credenciales.'); END IF;
  UPDATE auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now() WHERE email = v_player.email;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Actualizar standings de torneo
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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Funcion helper para ejecutar SQL en tablas con user_id
CREATE OR REPLACE FUNCTION apply_rls_with_user_id(tbl TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('CREATE POLICY "%I_select" ON %I FOR SELECT USING (true)', tbl, tbl);
  EXECUTE format('CREATE POLICY "%I_write" ON %I FOR ALL USING (user_id = auth.uid() OR is_admin())', tbl, tbl);
END;
$$;

-- Aplicar a todas las tablas con user_id
SELECT apply_rls_with_user_id('players');
SELECT apply_rls_with_user_id('user_profiles');
SELECT apply_rls_with_user_id('schedule_events');
SELECT apply_rls_with_user_id('championships');
SELECT apply_rls_with_user_id('finances');
SELECT apply_rls_with_user_id('inventory');
SELECT apply_rls_with_user_id('fixtures');
SELECT apply_rls_with_user_id('rivals');
SELECT apply_rls_with_user_id('future_fixtures');
SELECT apply_rls_with_user_id('lineups');

-- Politicas para tablas hijas (vinculadas por player_id)
CREATE OR REPLACE FUNCTION apply_rls_child(tbl TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('CREATE POLICY "%I_select" ON %I FOR SELECT USING (true)', tbl, tbl);
  EXECUTE format('CREATE POLICY "%I_write" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM players WHERE players.id = %I.player_id AND (players.user_id = auth.uid() OR is_admin())))', tbl, tbl);
END;
$$;

SELECT apply_rls_child('attribute_history');
SELECT apply_rls_child('injury_log');
SELECT apply_rls_child('attendance');
SELECT apply_rls_child('player_attendance_summary');
SELECT apply_rls_child('penalties');
SELECT apply_rls_child('infractions');
SELECT apply_rls_child('match_stats');
SELECT apply_rls_child('wellness_logs');
SELECT apply_rls_child('hia_assessments');
SELECT apply_rls_child('workout_logs');

-- Politicas para tablas Mak'Gora (sin user_id)
CREATE OR REPLACE FUNCTION apply_rls_makgora(tbl TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('CREATE POLICY "%I_select" ON %I FOR SELECT USING (auth.role() = ''authenticated'')', tbl, tbl);
  EXECUTE format('CREATE POLICY "%I_write" ON %I FOR ALL USING (is_admin())', tbl, tbl);
END;
$$;

SELECT apply_rls_makgora('makgora_teams');
SELECT apply_rls_makgora('tournaments');
SELECT apply_rls_makgora('tournament_teams');
SELECT apply_rls_makgora('tournament_matches');
SELECT apply_rls_makgora('tournament_standings');
SELECT apply_rls_makgora('tournament_player_stats');
SELECT apply_rls_makgora('player_loans');

-- Limpiar funciones helper
DROP FUNCTION IF EXISTS apply_rls_with_user_id;
DROP FUNCTION IF EXISTS apply_rls_child;
DROP FUNCTION IF EXISTS apply_rls_makgora;

-- Politica extra: user_profiles necesita INSERT con admin bypass
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_write" ON user_profiles;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "user_profiles_all" ON user_profiles FOR ALL USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

-- ============================================================
-- SEED DATA
-- ============================================================

-- Equipos Mak'Gora
INSERT INTO makgora_teams (name, rpg_name, emblem_color, sort_order) VALUES
    ('Orcos', 'Orcos Negros (Horda Primigenia)', '#00e676', 1),
    ('Cuervos', 'Cuervos de la Tormenta', '#424242', 2),
    ('Trolls', 'Trolls del Norte', '#2196f3', 3),
    ('Gargolas', 'Gargolas de Piedra', '#9c27b0', 4),
    ('Pitbull', 'Pitbulls de Guerra', '#ff6d00', 5),
    ('Buffalos', 'Buffalos de Hierro', '#795548', 6);
