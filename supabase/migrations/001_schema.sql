-- Rugby Orcos Club Manager v3.0 - Schema Supabase
-- Ejecutar en SQL Editor de Supabase

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PLAYERS (tabla principal)
-- ============================================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    legacy_id VARCHAR(10),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    nickname VARCHAR(100),
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

    system_role VARCHAR(50) DEFAULT 'jugador',
    source VARCHAR(30) DEFAULT 'manual',
    form_submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_team_category ON players(team_category);
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_players_internal_team ON players(internal_team);
CREATE INDEX idx_players_last_name ON players(last_name);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own players"
    ON players FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own players"
    ON players FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own players"
    ON players FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own players"
    ON players FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- ATTRIBUTE HISTORY
-- ============================================================
CREATE TABLE attribute_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attr_force INTEGER,
    attr_speed INTEGER,
    attr_stamina INTEGER,
    attr_technique INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attr_history_player ON attribute_history(player_id);

ALTER TABLE attribute_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attribute history for own players"
    ON attribute_history FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = attribute_history.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- INJURY LOG
-- ============================================================
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

CREATE INDEX idx_injury_player ON injury_log(player_id);

ALTER TABLE injury_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage injury log for own players"
    ON injury_log FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = injury_log.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('present', 'late', 'absent_unjustified', 'absent_justified')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_player ON attendance(player_id);
CREATE INDEX idx_attendance_date ON attendance(event_date);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attendance for own players"
    ON attendance FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = attendance.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- ATTENDANCE SUMMARY (denormalizado)
-- ============================================================
CREATE TABLE player_attendance_summary (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    total INTEGER DEFAULT 0,
    present INTEGER DEFAULT 0,
    late INTEGER DEFAULT 0,
    absent_unjustified INTEGER DEFAULT 0,
    absent_justified INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_attendance_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage attendance summary for own players"
    ON player_attendance_summary FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = player_attendance_summary.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- PENALTIES
-- ============================================================
CREATE TABLE penalties (
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    burpees INTEGER DEFAULT 0,
    cones BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage penalties for own players"
    ON penalties FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = penalties.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- INFRACTIONS
-- ============================================================
CREATE TABLE infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    infraction_date DATE NOT NULL,
    penalties INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    fault_type VARCHAR(50),
    context VARCHAR(50) DEFAULT 'partido',
    notes TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_infractions_player ON infractions(player_id);

ALTER TABLE infractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage infractions for own players"
    ON infractions FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = infractions.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- MATCH STATS
-- ============================================================
CREATE TABLE match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    match_date DATE NOT NULL,
    opponent VARCHAR(100),
    tries INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    mvp BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_match_stats_player ON match_stats(player_id);

ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage match stats for own players"
    ON match_stats FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = match_stats.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- WELLNESS LOGS
-- ============================================================
CREATE TABLE wellness_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
    muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 1 AND 5),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wellness_player ON wellness_logs(player_id);

ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage wellness logs for own players"
    ON wellness_logs FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = wellness_logs.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- HIA ASSESSMENTS
-- ============================================================
CREATE TABLE hia_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    symptoms TEXT[],
    result VARCHAR(50),
    suspension_days INTEGER DEFAULT 14,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hia_player ON hia_assessments(player_id);

ALTER TABLE hia_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage HIA assessments for own players"
    ON hia_assessments FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = hia_assessments.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- WORKOUT LOGS
-- ============================================================
CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    routine_name VARCHAR(200),
    category VARCHAR(50),
    exercises JSONB DEFAULT '[]',
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workout_player ON workout_logs(player_id);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workout logs for own players"
    ON workout_logs FOR ALL
    USING (EXISTS (SELECT 1 FROM players WHERE players.id = workout_logs.player_id AND players.user_id = auth.uid()));

-- ============================================================
-- SCHEDULE EVENTS (Agenda)
-- ============================================================
CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10),
    location VARCHAR(300),
    maps_link VARCHAR(500),
    type VARCHAR(30) DEFAULT 'entrenamiento',
    team_category VARCHAR(100),
    linked_routine VARCHAR(200),
    recurrence_group UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedule_user ON schedule_events(user_id);
CREATE INDEX idx_schedule_date ON schedule_events(date);
CREATE INDEX idx_schedule_team ON schedule_events(team_category);

ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedule events"
    ON schedule_events FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- CHAMPIONSHIPS
-- ============================================================
CREATE TABLE championships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    deadline_date DATE,
    description TEXT,
    team_category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_championships_user ON championships(user_id);
CREATE INDEX idx_championships_team ON championships(team_category);

ALTER TABLE championships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own championships"
    ON championships FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- FINANCES
-- ============================================================
CREATE TABLE finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ingreso', 'egreso')),
    descripcion TEXT,
    amount NUMERIC(12,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(50),
    team_category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_finances_user ON finances(user_id);
CREATE INDEX idx_finances_team ON finances(team_category);
CREATE INDEX idx_finances_date ON finances(date);

ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own finances"
    ON finances FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    total INTEGER DEFAULT 1,
    assigned_to VARCHAR(200),
    status VARCHAR(50) DEFAULT 'Excelente',
    team_category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_inventory_team ON inventory(team_category);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own inventory"
    ON inventory FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- FIXTURES (Resultados de partidos)
-- ============================================================
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opponent VARCHAR(200),
    orcos_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    tries INTEGER DEFAULT 0,
    mvp VARCHAR(200),
    team_category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fixtures_user ON fixtures(user_id);
CREATE INDEX idx_fixtures_team ON fixtures(team_category);
CREATE INDEX idx_fixtures_date ON fixtures(date);

ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fixtures"
    ON fixtures FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- RIVALS
-- ============================================================
CREATE TABLE rivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    colors VARCHAR(200),
    contact VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rivals_user ON rivals(user_id);

ALTER TABLE rivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rivals"
    ON rivals FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- FUTURE FIXTURES (Próximos partidos)
-- ============================================================
CREATE TABLE future_fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent VARCHAR(200),
    date DATE NOT NULL,
    time VARCHAR(10),
    location VARCHAR(300),
    team_category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_future_fixtures_user ON future_fixtures(user_id);
CREATE INDEX idx_future_fixtures_team ON future_fixtures(team_category);

ALTER TABLE future_fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own future fixtures"
    ON future_fixtures FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- LINEUPS (Alineaciones tácticas por equipo)
-- ============================================================
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_category VARCHAR(100) NOT NULL,
    formation VARCHAR(100),
    orientation VARCHAR(20) DEFAULT 'horizontal',
    size VARCHAR(20) DEFAULT 'medium',
    notes TEXT,
    positions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, team_category)
);

CREATE INDEX idx_lineups_user ON lineups(user_id);

ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lineups"
    ON lineups FOR ALL
    USING (auth.uid() = user_id);
