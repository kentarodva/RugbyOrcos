-- ============================================================
-- 59_through_65_schema_changes.sql
-- Todas las migraciones aplicadas via Supabase MCP (sesión 2025-06-30)
-- Agrupadas para que existan en disco (git-trackeables)
-- ============================================================

-- 59: Agregar FKs faltantes (33 FKs)
-- ============================================================

-- user_id → auth.users
DO $$ BEGIN ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE schedule_events ADD CONSTRAINT fk_schedule_events_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE championships ADD CONSTRAINT fk_championships_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE finances ADD CONSTRAINT fk_finances_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE inventory ADD CONSTRAINT fk_inventory_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE fixtures ADD CONSTRAINT fk_fixtures_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE rivals ADD CONSTRAINT fk_rivals_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE future_fixtures ADD CONSTRAINT fk_future_fixtures_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE lineups ADD CONSTRAINT fk_lineups_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE match_invitations ADD CONSTRAINT fk_match_invitations_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE push_tokens ADD CONSTRAINT fk_push_tokens_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE message_reactions ADD CONSTRAINT fk_message_reactions_user FOREIGN KEY (user_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE notification_history ADD CONSTRAINT fk_notification_history_sender FOREIGN KEY (sender_id) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UUIDs huérfanos
DO $$ BEGIN ALTER TABLE tournament_teams ADD CONSTRAINT fk_tournament_teams_captain FOREIGN KEY (captain_player_id) REFERENCES players(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE player_loans ADD CONSTRAINT fk_player_loans_approved FOREIGN KEY (approved_by) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE fixtures ADD CONSTRAINT fk_fixtures_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE match_stats ADD CONSTRAINT fk_match_stats_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE push_tokens ADD CONSTRAINT fk_push_tokens_makgora FOREIGN KEY (makgora_team_id) REFERENCES makgora_teams(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE tournaments ADD CONSTRAINT fk_tournaments_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE makgora_teams ADD CONSTRAINT fk_makgora_teams_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- team_category → teams(category)
DO $$ BEGIN ALTER TABLE players ADD CONSTRAINT fk_players_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE schedule_events ADD CONSTRAINT fk_schedule_events_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE championships ADD CONSTRAINT fk_championships_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE finances ADD CONSTRAINT fk_finances_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE inventory ADD CONSTRAINT fk_inventory_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE fixtures ADD CONSTRAINT fk_fixtures_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE future_fixtures ADD CONSTRAINT fk_future_fixtures_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE lineups ADD CONSTRAINT fk_lineups_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE team_members ADD CONSTRAINT fk_team_members_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE push_tokens ADD CONSTRAINT fk_push_tokens_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE fundraising_campaigns ADD CONSTRAINT fk_fundraising_campaigns_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE club_config ADD CONSTRAINT fk_club_config_team_category FOREIGN KEY (team_category) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 60: CHECK constraints + timestamps financieros
-- ============================================================

DO $$ BEGIN ALTER TABLE players ADD CONSTRAINT chk_players_status CHECK (status IS NULL OR status IN ('activo','inactivo','lesionado','suspendido')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE players ADD CONSTRAINT chk_players_role CHECK (role IS NULL OR role IN ('Titular','Capitan','Subcapitan','Suplente')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE players ADD CONSTRAINT chk_players_system_role CHECK (system_role IS NULL OR system_role IN ('desarrollador','presidente','promotor','entrenador','tesorero','arbitro','jugador')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE players ADD CONSTRAINT chk_players_source CHECK (source IS NULL OR source IN ('manual','csv_import','form')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE players ADD CONSTRAINT chk_players_document_type CHECK (document_type IS NULL OR document_type IN ('CC','TI','CE','Pasaporte','NIT','OTRO')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE team_members ADD CONSTRAINT chk_team_members_role CHECK (role IS NULL OR role IN ('jugador','entrenador','presidente','capitan_club','asistente')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE schedule_events ADD CONSTRAINT chk_schedule_events_type CHECK (type IS NULL OR type IN ('entrenamiento','partido','evento','reunion')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE inventory ADD CONSTRAINT chk_inventory_status CHECK (status IS NULL OR status IN ('Excelente','Bueno','Regular','Malo')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workout_logs ADD CONSTRAINT chk_workout_category CHECK (category IS NULL OR category IN ('campo','gym','recuperacion','prevencion','general')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE infractions ADD CONSTRAINT chk_infractions_context CHECK (context IS NULL OR context IN ('general','makgora','partido','entrenamiento')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE user_profiles ADD CONSTRAINT chk_user_profiles_division_scope CHECK (division_scope IS NULL OR division_scope IN ('masculina_mayor','femenina_mayor','juveniles_masculina','juveniles_femenina')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE finances ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fundraising_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE raffle_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 61: Índices de rendimiento (FK + WHERE)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_attr_history_player ON attribute_history(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_log_player ON injury_log(player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player ON attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_infractions_player ON infractions(player_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_player ON match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_wellness_logs_player ON wellness_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_hia_player ON hia_assessments(player_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_player ON workout_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_tourn_teams_tournament ON tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_teams_team ON tournament_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_tourn_teams_captain ON tournament_teams(captain_player_id);
CREATE INDEX IF NOT EXISTS idx_tourn_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_matches_home ON tournament_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_tourn_matches_away ON tournament_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_tourn_standings_tournament ON tournament_standings(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tourn_standings_team ON tournament_standings(team_id);
CREATE INDEX IF NOT EXISTS idx_tourn_player_stats_match ON tournament_player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_tourn_player_stats_player ON tournament_player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_loans_player ON player_loans(player_id);
CREATE INDEX IF NOT EXISTS idx_loans_from_team ON player_loans(from_team_id);
CREATE INDEX IF NOT EXISTS idx_loans_to_team ON player_loans(to_team_id);
CREATE INDEX IF NOT EXISTS idx_loans_tournament ON player_loans(tournament_id);
CREATE INDEX IF NOT EXISTS idx_loans_match ON player_loans(match_id);
CREATE INDEX IF NOT EXISTS idx_loans_approved ON player_loans(approved_by);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position_id);
CREATE INDEX IF NOT EXISTS idx_players_makgora ON players(makgora_team_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_tournament ON match_stats(tournament_id);
CREATE INDEX IF NOT EXISTS idx_raffle_tickets_assigned ON raffle_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_event_rsvp_event ON event_rsvp(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvp_player ON event_rsvp(player_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_coach ON training_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_finances_date_type ON finances(date, type);
CREATE INDEX IF NOT EXISTS idx_schedule_date_team ON schedule_events(date, team_category);
CREATE INDEX IF NOT EXISTS idx_schedule_scope_type ON schedule_events(scope_type);
CREATE INDEX IF NOT EXISTS idx_player_payments_date ON player_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_player_payments_campaign ON player_payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_date_team ON fixtures(date, team_category);
CREATE INDEX IF NOT EXISTS idx_attendance_event_date ON attendance(event_date);
CREATE INDEX IF NOT EXISTS idx_tourn_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_status ON fundraising_campaigns(status);

-- 62: Calidad de datos (TIME types, UNIQUE, CHECKs, NOT NULL)
-- ============================================================
DO $$ BEGIN ALTER TABLE schedule_events ALTER COLUMN "time" TYPE TIME USING "time"::TIME; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE future_fixtures ALTER COLUMN "time" TYPE TIME USING "time"::TIME; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workout_logs ADD CONSTRAINT uq_workout_player_date UNIQUE (player_id, workout_date); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE workout_logs ALTER COLUMN workout_date SET NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE finances ALTER COLUMN "date" SET NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;

-- 63: team_id FK columns + backfill + triggers
-- ============================================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE schedule_events ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE championships ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE finances ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE future_fixtures ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE lineups ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE push_tokens ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE fundraising_campaigns ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
ALTER TABLE club_config ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);

UPDATE players SET team_id = (SELECT id FROM teams WHERE category = players.team_category) WHERE team_category IS NOT NULL AND team_id IS NULL;
UPDATE schedule_events SET team_id = (SELECT id FROM teams WHERE category = schedule_events.team_category) WHERE team_category IS NOT NULL AND team_id IS NULL;
UPDATE finances SET team_id = (SELECT id FROM teams WHERE category = finances.team_category) WHERE team_category IS NOT NULL AND team_id IS NULL;
UPDATE fixtures SET team_id = (SELECT id FROM teams WHERE category = fixtures.team_category) WHERE team_category IS NOT NULL AND team_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_schedule_team_id ON schedule_events(team_id);
CREATE INDEX IF NOT EXISTS idx_finances_team_id ON finances(team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_team_id ON fixtures(team_id);

-- Triggers de sincronización team_id ↔ team_category
CREATE OR REPLACE FUNCTION sync_team_id_from_category() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_category IS NOT NULL THEN
    NEW.team_id = (SELECT id FROM teams WHERE category = NEW.team_category);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_team_category_from_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    NEW.team_category = (SELECT category FROM teams WHERE id = NEW.team_id);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT; BEGIN
  FOR t IN SELECT unnest(ARRAY['players','schedule_events','championships','finances','inventory','fixtures','future_fixtures','lineups','team_members','push_tokens','fundraising_campaigns','club_config'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_sync_team_id_%s BEFORE INSERT OR UPDATE OF team_category ON %I FOR EACH ROW EXECUTE FUNCTION sync_team_id_from_category()', t, t);
    EXECUTE format('CREATE TRIGGER trg_sync_team_category_%s BEFORE INSERT OR UPDATE OF team_id ON %I FOR EACH ROW EXECUTE FUNCTION sync_team_category_from_id()', t, t);
  END LOOP;
END $$;

-- 64: Complete user_profiles ↔ teams ↔ clubs links
-- ============================================================
INSERT INTO clubs (name, code, created_at) SELECT 'Orcos Negros', 'orcos', NOW() WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE code = 'orcos');
ALTER TABLE teams ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id);
UPDATE teams SET club_id = (SELECT id FROM clubs WHERE code = teams.club LIMIT 1) WHERE club_id IS NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
UPDATE user_profiles SET team_id = (SELECT id FROM teams WHERE category = user_profiles.club_scope) WHERE club_scope IS NOT NULL AND team_id IS NULL;
DO $$ BEGIN ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_club_scope FOREIGN KEY (club_scope) REFERENCES teams(category); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_teams_club_id ON teams(club_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_id ON user_profiles(team_id);
CREATE TRIGGER trg_sync_up_team_id BEFORE INSERT OR UPDATE OF club_scope ON user_profiles FOR EACH ROW EXECUTE FUNCTION sync_team_id_from_category();
CREATE TRIGGER trg_sync_up_team_category BEFORE INSERT OR UPDATE OF team_id ON user_profiles FOR EACH ROW EXECUTE FUNCTION sync_team_category_from_id();

-- 65: Training plan columns + workout_logs expansion + expanded exercises
-- ============================================================
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'semanal';
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT 1;
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS nutrition JSONB DEFAULT '{}';
DO $$ BEGIN ALTER TABLE training_plans ADD CONSTRAINT chk_plan_type CHECK (plan_type IN ('semanal','mensual')); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES training_plans(id);
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS exercise_logs JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_training_plans_player_status ON training_plans(player_id, status);
CREATE INDEX IF NOT EXISTS idx_training_plans_player_week ON training_plans(player_id, week_start);
CREATE INDEX IF NOT EXISTS idx_workout_logs_plan ON workout_logs(plan_id);

-- Expand exercise_catalog CHECK constraint
ALTER TABLE exercise_catalog DROP CONSTRAINT IF EXISTS exercise_catalog_category_check;
ALTER TABLE exercise_catalog ADD CONSTRAINT exercise_catalog_category_check CHECK (category IN ('campo','gym','crossfit','casa','calentamiento','recuperacion','prevencion'));
