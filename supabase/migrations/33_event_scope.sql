-- Event Scope
-- Permite segmentar eventos por ámbito: division, all, makgora_team, players
-- Así un entrenador puede crear un evento visible solo para su equipo Mak'Gora
-- o para toda la división, o para jugadores específicos

ALTER TABLE schedule_events
  ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'division'
    CHECK (scope_type IN ('division', 'all', 'makgora_team', 'players')),
  ADD COLUMN IF NOT EXISTS scope_value JSONB DEFAULT '{}';

COMMENT ON COLUMN schedule_events.scope_type IS 'division|all|makgora_team|players';
COMMENT ON COLUMN schedule_events.scope_value IS '{"division":"masculina_mayor"} | {} | {"makgora_team_id":"uuid"} | {"player_ids":["uuid1","uuid2"]}';
