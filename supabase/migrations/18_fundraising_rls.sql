-- RLS Policies for Fundraising Tables
-- Ejecutar en Supabase SQL Editor

-- Función helper: mapea system_role a tier numérico (mismo orden que RPG_ROLES en frontend)
-- 0: desarrollador, 1: presidente, 2: promotor, 3: staff (entrenador/tesorero/arbitro), 4: jugador
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS INTEGER
LANGUAGE SQL STABLE
AS $$
  SELECT CASE u.system_role
    WHEN 'desarrollador' THEN 0
    WHEN 'presidente' THEN 1
    WHEN 'promotor' THEN 2
    WHEN 'entrenador' THEN 3
    WHEN 'tesorero' THEN 3
    WHEN 'arbitro' THEN 3
    ELSE 4
  END
  FROM user_profiles u
  WHERE u.user_id = auth.uid();
$$;

-- Habilitar RLS en tablas de fundraising
ALTER TABLE fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraising_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;

-- SELECT: todos los usuarios autenticados pueden ver
CREATE POLICY "fundraising_campaigns_select" ON fundraising_campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "fundraising_assignments_select" ON fundraising_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "raffle_tickets_select" ON raffle_tickets
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT: solo staff (tier <= 3)
CREATE POLICY "fundraising_campaigns_insert" ON fundraising_campaigns
  FOR INSERT WITH CHECK (get_user_tier() <= 3);

CREATE POLICY "fundraising_assignments_insert" ON fundraising_assignments
  FOR INSERT WITH CHECK (get_user_tier() <= 3);

CREATE POLICY "raffle_tickets_insert" ON raffle_tickets
  FOR INSERT WITH CHECK (get_user_tier() <= 3);

-- UPDATE: solo staff (tier <= 3)
CREATE POLICY "fundraising_campaigns_update" ON fundraising_campaigns
  FOR UPDATE USING (get_user_tier() <= 3);

CREATE POLICY "fundraising_assignments_update" ON fundraising_assignments
  FOR UPDATE USING (get_user_tier() <= 3);

CREATE POLICY "raffle_tickets_update" ON raffle_tickets
  FOR UPDATE USING (get_user_tier() <= 3);

-- DELETE: solo super roles (tier <= 1)
CREATE POLICY "fundraising_campaigns_delete" ON fundraising_campaigns
  FOR DELETE USING (get_user_tier() <= 1);

CREATE POLICY "fundraising_assignments_delete" ON fundraising_assignments
  FOR DELETE USING (get_user_tier() <= 1);

CREATE POLICY "raffle_tickets_delete" ON raffle_tickets
  FOR DELETE USING (get_user_tier() <= 1);
