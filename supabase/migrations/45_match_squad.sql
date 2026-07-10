ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS squad JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN fixtures.squad IS 'Match day squad: { startingXV: [playerId, ...], substitutes: [playerId, ...] }';
