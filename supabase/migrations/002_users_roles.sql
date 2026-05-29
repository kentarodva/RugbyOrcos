-- ============================================================
-- RUGBY ORCOS NEGROS — Reino Manager v4.0
-- Fase 1: Roles, Torneos, Permisos, Prestamos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- USER PROFILES (Roles RPG + Scopes)
-- ============================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    system_role VARCHAR(50) NOT NULL DEFAULT 'jugador'
        CHECK (system_role IN (
            'desarrollador','presidente','promotor','entrenador','tesorero','arbitro','jugador'
        )),
    club_scope VARCHAR(50),
    division_scope VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(system_role);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.system_role IN ('desarrollador','presidente')
        AND up.is_active = true
    ));

CREATE POLICY "Admins can insert profiles"
    ON user_profiles FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.system_role IN ('desarrollador','presidente')
        AND up.is_active = true
    ));

CREATE POLICY "Admins can update profiles"
    ON user_profiles FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.user_id = auth.uid()
        AND up.system_role IN ('desarrollador','presidente')
        AND up.is_active = true
    ));

-- ============================================================
-- FUNCION HELPER: get_user_role()
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR(50) AS $$
    SELECT system_role FROM user_profiles
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_club_scope()
RETURNS VARCHAR(50) AS $$
    SELECT club_scope FROM user_profiles
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_division_scope()
RETURNS VARCHAR(50) AS $$
    SELECT division_scope FROM user_profiles
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- MAK'GORA TEAMS (Equipos del torneo interno)
-- ============================================================
CREATE TABLE makgora_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rpg_name VARCHAR(100),
    emblem_color VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE makgora_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view makgora teams"
    ON makgora_teams FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage makgora teams"
    ON makgora_teams FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente'));

-- Seed: 6 equipos Mak'Gora
INSERT INTO makgora_teams (name, rpg_name, emblem_color, sort_order) VALUES
    ('Orcos', 'Orcos Negros (Horda Primigenia)', '#00e676', 1),
    ('Cuervos', 'Cuervos de la Tormenta', '#424242', 2),
    ('Trolls', 'Trolls del Norte', '#2196f3', 3),
    ('Gargolas', 'Gargolas de Piedra', '#9c27b0', 4),
    ('Pitbull', 'Pitbulls de Guerra', '#ff6d00', 5),
    ('Buffalos', 'Buffalos de Hierro', '#795548', 6);

-- ============================================================
-- TOURNAMENTS (Ediciones del torneo Mak'Gora)
-- ============================================================
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    edition_name VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'proximo'
        CHECK (status IN ('proximo','en_curso','finalizado','cancelado')),
    winner_team_id UUID REFERENCES makgora_teams(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tournaments"
    ON tournaments FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and promoters can manage tournaments"
    ON tournaments FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente','promotor'));

-- ============================================================
-- TOURNAMENT TEAMS (Equipos participantes por edicion)
-- ============================================================
CREATE TABLE tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES makgora_teams(id),
    captain_player_id UUID,  -- se actualiza al asignar capitan
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tournament teams"
    ON tournament_teams FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and promoters can manage tournament teams"
    ON tournament_teams FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente','promotor'));

-- ============================================================
-- TOURNAMENT MATCHES (Partidos del torneo)
-- ============================================================
CREATE TABLE tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    phase VARCHAR(30) NOT NULL DEFAULT 'regular'
        CHECK (phase IN ('regular','semifinal','final','tercer_puesto')),
    home_team_id UUID NOT NULL REFERENCES makgora_teams(id),
    away_team_id UUID NOT NULL REFERENCES makgora_teams(id),
    home_score INTEGER,
    away_score INTEGER,
    home_tries INTEGER DEFAULT 0,
    away_tries INTEGER DEFAULT 0,
    match_date DATE,
    match_time VARCHAR(10),
    location VARCHAR(300),
    status VARCHAR(30) NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente','jugado','cancelado','forfeit')),
    mvp VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tourn_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_tourn_matches_round ON tournament_matches(tournament_id, round);

ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tournament matches"
    ON tournament_matches FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and promoters can manage tournament matches"
    ON tournament_matches FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente','promotor'));

-- ============================================================
-- TOURNAMENT STANDINGS (Tabla de posiciones)
-- ============================================================
CREATE TABLE tournament_standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES makgora_teams(id),
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    point_diff INTEGER GENERATED ALWAYS AS (points_for - points_against) STORED,
    tries_for INTEGER DEFAULT 0,
    tries_against INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, team_id)
);

ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tournament standings"
    ON tournament_standings FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and promoters can manage standings"
    ON tournament_standings FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente','promotor'));

-- ============================================================
-- TOURNAMENT PLAYER STATS (Stats individuales Mak'Gora)
-- ============================================================
CREATE TABLE tournament_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES tournament_matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    tries INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    mvp BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tourn_player_stats_match ON tournament_player_stats(match_id);
CREATE INDEX idx_tourn_player_stats_player ON tournament_player_stats(player_id);

ALTER TABLE tournament_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tournament player stats"
    ON tournament_player_stats FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and promoters can manage tournament player stats"
    ON tournament_player_stats FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente','promotor'));

-- ============================================================
-- PLAYER LOANS (Prestamos entre equipos)
-- ============================================================
CREATE TABLE player_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    from_team_id UUID REFERENCES makgora_teams(id),
    to_team_id UUID NOT NULL REFERENCES makgora_teams(id),
    tournament_id UUID REFERENCES tournaments(id),
    match_id UUID REFERENCES tournament_matches(id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','returned','cancelled')),
    approved_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_player ON player_loans(player_id);
CREATE INDEX idx_loans_tournament ON player_loans(tournament_id);
CREATE INDEX idx_loans_status ON player_loans(status);

ALTER TABLE player_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view loans"
    ON player_loans FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and promoters can manage loans"
    ON player_loans FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente','promotor'));

-- ============================================================
-- MODIFICACIONES A TABLAS EXISTENTES
-- ============================================================

-- Agregar makgora_team_id a players
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS makgora_team_id UUID REFERENCES makgora_teams(id);

-- Agregar context a match_stats
ALTER TABLE match_stats
    ADD COLUMN IF NOT EXISTS context VARCHAR(20) NOT NULL DEFAULT 'general'
        CHECK (context IN ('general','makgora'));

ALTER TABLE match_stats
    ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id);

-- Agregar context a fixtures
ALTER TABLE fixtures
    ADD COLUMN IF NOT EXISTS context VARCHAR(20) NOT NULL DEFAULT 'general'
        CHECK (context IN ('general','makgora'));

ALTER TABLE fixtures
    ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id);

-- Agregar context a schedule_events
ALTER TABLE schedule_events
    ADD COLUMN IF NOT EXISTS context VARCHAR(20) NOT NULL DEFAULT 'general'
        CHECK (context IN ('general','makgora'));

-- ============================================================
-- ACTUALIZACION POLITICAS RLS — Tablas existentes
-- Las politicas anteriores (auth.uid() = user_id) se reemplazan
-- por politicas basadas en get_user_role()
-- ============================================================

-- Players: admins ven todo, promotores su club, entrenadores su division
DROP POLICY IF EXISTS "Users can view own players" ON players;
DROP POLICY IF EXISTS "Users can insert own players" ON players;
DROP POLICY IF EXISTS "Users can update own players" ON players;
DROP POLICY IF EXISTS "Users can delete own players" ON players;

CREATE POLICY "Admins full access players"
    ON players FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente'));

CREATE POLICY "Promoter sees club players"
    ON players FOR ALL
    USING (
        get_user_role() = 'promotor'
        AND team_category LIKE get_user_club_scope() || '\_%'
    );

CREATE POLICY "Trainer sees division players"
    ON players FOR SELECT
    USING (
        get_user_role() IN ('entrenador','arbitro','tesorero')
        AND team_category = get_user_club_scope() || '\_' || get_user_division_scope()
    );

CREATE POLICY "Player sees own profile"
    ON players FOR SELECT
    USING (
        get_user_role() = 'jugador'
        AND id IN (
            SELECT id FROM players p2
            WHERE p2.user_id = auth.uid()
        )
    );

-- Schedule: admin full, promoter club, trainer/tesorero/arbitro division
DROP POLICY IF EXISTS "Users can manage own schedule events" ON schedule_events;

CREATE POLICY "Admins full access schedule"
    ON schedule_events FOR ALL
    USING (get_user_role() IN ('desarrollador','presidente'));

CREATE POLICY "Promoter sees club schedule"
    ON schedule_events FOR ALL
    USING (
        get_user_role() = 'promotor'
        AND team_category LIKE get_user_club_scope() || '\_%'
    );

CREATE POLICY "Staff sees division schedule"
    ON schedule_events FOR SELECT
    USING (
        get_user_role() IN ('entrenador','arbitro','tesorero')
        AND team_category = get_user_club_scope() || '\_' || get_user_division_scope()
    );

-- Championships, Finances, Inventory, Fixtures, Rivals, Future Fixtures:
-- mismo patron: admin full, promoter club, staff division
DROP POLICY IF EXISTS "Users can manage own championships" ON championships;
CREATE POLICY "Admins full access championships" ON championships FOR ALL USING (get_user_role() IN ('desarrollador','presidente'));
CREATE POLICY "Promoter sees club championships" ON championships FOR ALL USING (get_user_role() = 'promotor' AND team_category LIKE get_user_club_scope() || '\_%');
CREATE POLICY "Staff sees division championships" ON championships FOR SELECT USING (get_user_role() IN ('entrenador','arbitro','tesorero') AND team_category = get_user_club_scope() || '\_' || get_user_division_scope());

DROP POLICY IF EXISTS "Users can manage own finances" ON finances;
CREATE POLICY "Admins full access finances" ON finances FOR ALL USING (get_user_role() IN ('desarrollador','presidente'));
CREATE POLICY "Promoter sees club finances" ON finances FOR ALL USING (get_user_role() = 'promotor' AND team_category LIKE get_user_club_scope() || '\_%');
CREATE POLICY "Staff sees division finances" ON finances FOR SELECT USING (get_user_role() IN ('entrenador','arbitro','tesorero') AND team_category = get_user_club_scope() || '\_' || get_user_division_scope());

DROP POLICY IF EXISTS "Users can manage own inventory" ON inventory;
CREATE POLICY "Admins full access inventory" ON inventory FOR ALL USING (get_user_role() IN ('desarrollador','presidente'));
CREATE POLICY "Promoter sees club inventory" ON inventory FOR ALL USING (get_user_role() = 'promotor' AND team_category LIKE get_user_club_scope() || '\_%');
CREATE POLICY "Staff sees division inventory" ON inventory FOR SELECT USING (get_user_role() IN ('entrenador','arbitro','tesorero') AND team_category = get_user_club_scope() || '\_' || get_user_division_scope());

DROP POLICY IF EXISTS "Users can manage own fixtures" ON fixtures;
CREATE POLICY "Admins full access fixtures" ON fixtures FOR ALL USING (get_user_role() IN ('desarrollador','presidente'));
CREATE POLICY "Promoter sees club fixtures" ON fixtures FOR ALL USING (get_user_role() = 'promotor' AND team_category LIKE get_user_club_scope() || '\_%');
CREATE POLICY "Staff sees division fixtures" ON fixtures FOR SELECT USING (get_user_role() IN ('entrenador','arbitro','tesorero') AND team_category = get_user_club_scope() || '\_' || get_user_division_scope());

DROP POLICY IF EXISTS "Users can manage own rivals" ON rivals;
CREATE POLICY "Admins full access rivals" ON rivals FOR ALL USING (get_user_role() IN ('desarrollador','presidente'));

DROP POLICY IF EXISTS "Users can manage own future fixtures" ON future_fixtures;
CREATE POLICY "Admins full access future fixtures" ON future_fixtures FOR ALL USING (get_user_role() IN ('desarrollador','presidente'));
CREATE POLICY "Promoter sees club future fixtures" ON future_fixtures FOR ALL USING (get_user_role() = 'promotor' AND team_category LIKE get_user_club_scope() || '\_%');
CREATE POLICY "Staff sees division future fixtures" ON future_fixtures FOR SELECT USING (get_user_role() IN ('entrenador','arbitro','tesorero') AND team_category = get_user_club_scope() || '\_' || get_user_division_scope());

-- Lineups
DROP POLICY IF EXISTS "Users can manage own lineups" ON lineups;
CREATE POLICY "Admins full access lineups" ON lineups FOR ALL USING (get_user_role() IN ('desarrollador','presidente'));
CREATE POLICY "Promoter sees club lineups" ON lineups FOR ALL USING (get_user_role() = 'promotor' AND team_category LIKE get_user_club_scope() || '\_%');
CREATE POLICY "Staff sees division lineups" ON lineups FOR SELECT USING (get_user_role() IN ('entrenador','arbitro') AND team_category = get_user_club_scope() || '\_' || get_user_division_scope());
