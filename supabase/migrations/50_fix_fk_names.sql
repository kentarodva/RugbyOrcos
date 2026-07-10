-- Asegurar columna is_external en makgora_teams
ALTER TABLE makgora_teams ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;
ALTER TABLE makgora_teams ADD COLUMN IF NOT EXISTS created_by UUID;

-- Renombrar FKs de tournament_matches a nombres explícitos cortos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_home_team_id_fkey') THEN
    ALTER TABLE tournament_matches RENAME CONSTRAINT tournament_matches_home_team_id_fkey TO fk_match_home;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tournament_matches_away_team_id_fkey') THEN
    ALTER TABLE tournament_matches RENAME CONSTRAINT tournament_matches_away_team_id_fkey TO fk_match_away;
  END IF;
END $$;
