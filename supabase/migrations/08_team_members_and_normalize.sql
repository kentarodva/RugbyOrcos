-- Migration 08: Team Members + Normalization + Constraints
-- Idempotent: safe to re-run

-- ============================================================
-- 1. TEAMS catalog table (normalize team_category)
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(200) NOT NULL,
  club VARCHAR(50) NOT NULL DEFAULT 'orcos',
  division VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for teams (catalog: read all, write admin)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select" ON teams;
CREATE POLICY "teams_select" ON teams
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "teams_insert" ON teams;
CREATE POLICY "teams_insert" ON teams
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "teams_update" ON teams;
CREATE POLICY "teams_update" ON teams
  FOR UPDATE TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "teams_delete" ON teams;
CREATE POLICY "teams_delete" ON teams
  FOR DELETE TO authenticated
  USING (is_admin());

-- Populate from existing distinct team_category values
INSERT INTO teams (category, label, club, division)
SELECT DISTINCT
  p.team_category,
  CONCAT(
    CASE WHEN SPLIT_PART(p.team_category, '_', 1) = 'orcos' THEN 'Orcos Negros' ELSE INITCAP(SPLIT_PART(p.team_category, '_', 1)) END,
    ' - ',
    INITCAP(REPLACE(SPLIT_PART(p.team_category, '_', 2), '_', ' ')),
    ' ',
    INITCAP(SPLIT_PART(p.team_category, '_', 3))
  ),
  SPLIT_PART(p.team_category, '_', 1),
  CONCAT_WS('_', SPLIT_PART(p.team_category, '_', 2), SPLIT_PART(p.team_category, '_', 3))
FROM players p
WHERE p.team_category IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.category = p.team_category);

-- Add known ORCOS divisions that may not have players yet
INSERT INTO teams (category, label, club, division) VALUES
  ('orcos_masculina_mayor', 'Orcos Negros - Masculina Mayor', 'orcos', 'masculina_mayor'),
  ('orcos_femenina_mayor', 'Orcos Negros - Femenina Mayor', 'orcos', 'femenina_mayor'),
  ('orcos_juveniles_masculina', 'Orcos Negros - Juveniles Masculino', 'orcos', 'juveniles_masculina'),
  ('orcos_juveniles_femenina', 'Orcos Negros - Juveniles Femenino', 'orcos', 'juveniles_femenina')
ON CONFLICT (category) DO NOTHING;

-- ============================================================
-- 2. TEAM_MEMBERS table
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  team_category VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'jugador',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_category)
);

-- Migrate existing: players with user_id → team_members as jugador
INSERT INTO team_members (user_id, team_category, role)
SELECT DISTINCT ON (user_id, team_category)
  user_id, team_category, 'jugador'
FROM players
WHERE user_id IS NOT NULL AND team_category IS NOT NULL
ON CONFLICT (user_id, team_category) DO NOTHING;

-- Migrate existing: user_profiles → team_members with mapped role
INSERT INTO team_members (user_id, team_category, role)
SELECT
  up.user_id,
  COALESCE(up.club_scope, 'orcos_masculina_mayor'),
  CASE
    WHEN up.system_role = 'presidente' THEN 'presidente'
    WHEN up.system_role = 'desarrollador' THEN 'presidente'
    WHEN up.system_role = 'promotor' THEN 'capitan_club'
    WHEN up.system_role = 'entrenador' THEN 'entrenador'
    WHEN up.system_role = 'tesorero' THEN 'capitan_club'
    WHEN up.system_role = 'arbitro' THEN 'asistente'
    ELSE 'jugador'
  END
FROM user_profiles up
WHERE up.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = up.user_id AND tm.team_category = COALESCE(up.club_scope, 'orcos_masculina_mayor')
  )
ON CONFLICT (user_id, team_category) DO UPDATE SET role = EXCLUDED.role;

-- RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "team_members_update" ON team_members;
CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE USING (is_admin());

-- ============================================================
-- 3. Update RLS for custom_tactics (use team_members)
-- ============================================================
DROP POLICY IF EXISTS "Todos los autenticados pueden leer tácticas" ON custom_tactics;

CREATE POLICY "custom_tactics_select" ON custom_tactics
  FOR SELECT TO authenticated
  USING (
    scope = 'all'
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
        AND is_active = true
        AND team_category = scope
    )
  );

-- Realtime publication check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'custom_tactics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE custom_tactics;
  END IF;
END $$;

-- ============================================================
-- 4. UNIQUE constraints on players
-- ============================================================
-- Prevent duplicate players by natural key
DROP INDEX IF EXISTS idx_players_unique_name_birth;
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_unique_name_birth
  ON players (first_name, last_name, birth_date)
  WHERE birth_date IS NOT NULL;

-- Prevent duplicate emails (allow multiple NULLs)
DROP INDEX IF EXISTS idx_players_unique_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_unique_email
  ON players (email)
  WHERE email IS NOT NULL AND email != '';

-- ============================================================
-- 5. FK constraint for players.user_id (soft, no CASCADE)
-- ============================================================
-- Note: auth.users is in a separate schema; Supabase may not enforce cross-schema FKs.
-- This is informational — won't fail if auth.users doesn't exist locally.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_players_user_id'
    AND table_name = 'players'
  ) THEN
    BEGIN
      ALTER TABLE players ADD CONSTRAINT fk_players_user_id
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    EXCEPTION WHEN OTHERS THEN
      -- auth.users may not be accessible; skip silently
    END;
  END IF;
END $$;

-- ============================================================
-- 6. Helper: view for active team memberships
-- ============================================================
CREATE OR REPLACE VIEW active_team_memberships AS
SELECT
  tm.user_id,
  tm.team_category,
  tm.role,
  t.label AS team_label,
  t.club,
  t.division
FROM team_members tm
JOIN teams t ON t.category = tm.team_category
WHERE tm.is_active = true;
