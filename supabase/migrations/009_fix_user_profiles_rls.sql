-- ============================================================
-- FIX DEFINITIVO: Politicas RLS user_profiles completas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

DROP POLICY IF EXISTS "Auth can read profiles" ON user_profiles;
DROP POLICY IF EXISTS "Owners update own profile" ON user_profiles;

-- Admins: TODO (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins manage profiles"
  ON user_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid()
    AND up.system_role IN ('desarrollador','presidente','promotor')
    AND up.is_active = true
  ));

-- Cualquier autenticado puede insertar su propio perfil
CREATE POLICY "Self insert profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Cualquier autenticado puede actualizar su propio perfil
CREATE POLICY "Self update profile"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Todos los autenticados pueden leer perfiles
CREATE POLICY "Auth read profiles"
  ON user_profiles FOR SELECT
  USING (true);
