-- Replace partial unique index with a full UNIQUE constraint
-- so that ON CONFLICT works with Supabase upsert.

DROP INDEX IF EXISTS idx_players_unique_name_birth;

ALTER TABLE players
  ADD CONSTRAINT players_unique_name_birth
  UNIQUE (first_name, last_name, birth_date);
