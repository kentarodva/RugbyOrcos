-- ============================================================
-- FIX DEFINITIVO: Trigger auto-perfil + limpiar funcion vieja
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Limpiar la funcion rota y el usuario corrupto
DROP FUNCTION IF EXISTS admin_create_user;

-- 2. Borrar usuario corrupto que quedó a medias
DELETE FROM auth.users WHERE email = 'kentarodva@gmail.com';

-- 3. Trigger: cuando se crea un usuario en auth.users, 
--    se crea automaticamente su perfil en user_profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name, system_role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 'jugador');
  RETURN NEW;
END;
$$;

-- 4. Activar el trigger (solo si no existe ya)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
