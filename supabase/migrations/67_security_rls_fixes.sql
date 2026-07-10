-- ============================================================
-- 67_security_rls_fixes
-- Fixes de seguridad y RLS encontrados en auditoria
-- ============================================================

-- 1. HABILITAR RLS en tablas fantasma (si existen)
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['message_reactions','notification_history','treasurer_deliveries'])
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- 2. Fix club_config: policies usaban roles 'admin'/'staff' que NO existen
DROP POLICY IF EXISTS "club_config_insert" ON club_config;
DROP POLICY IF EXISTS "club_config_update" ON club_config;

CREATE POLICY "club_config_insert" ON club_config
  FOR INSERT WITH CHECK (get_user_tier() <= 1);

CREATE POLICY "club_config_update" ON club_config
  FOR UPDATE USING (get_user_tier() <= 1);

-- 3. Tighten user_profiles SELECT: solo staff ve todos; jugadores solo su perfil
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT
  USING (user_id = auth.uid() OR get_user_tier() <= 3);

-- 4. Tighten finances SELECT: solo staff o dueño del registro
DROP POLICY IF EXISTS "finances_select" ON finances;
CREATE POLICY "finances_select" ON finances FOR SELECT
  USING (user_id = auth.uid() OR get_user_tier() <= 3);

-- 5. Tighten gym_history SELECT: jugador ve solo sus datos, staff ve todos
DROP POLICY IF EXISTS "gym_history_select" ON gym_history;
CREATE POLICY "gym_history_select" ON gym_history FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    OR get_user_tier() <= 3
  );

-- 6. Asegurar player_payments RLS habilitado
ALTER TABLE IF EXISTS player_payments ENABLE ROW LEVEL SECURITY;

-- 7. Fundraising campaigns con team scoping
DROP POLICY IF EXISTS "fundraising_campaigns_select" ON fundraising_campaigns;
CREATE POLICY "fundraising_campaigns_select" ON fundraising_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid() AND tm.team_category = fundraising_campaigns.team_category AND tm.is_active = true
    )
    OR get_user_tier() <= 3
  );
