-- ============================================================
-- FIX: Limpiar funciones viejas + eliminar trigger conflictivo
-- El trigger on_auth_user_created causaba colisiones con
-- inserciones manuales en user_profiles.
-- Ahora user_profiles se inserta manualmente en cada lugar.
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Limpiar funcion vieja y usuario corrupto
DROP FUNCTION IF EXISTS admin_create_user;
DELETE FROM auth.users WHERE email = 'kentarodva@gmail.com';

-- 2. Eliminar el trigger que causaba duplicados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user;

-- 3. El perfil ahora se crea manualmente en:
--    - AuthContext.signUp (cuando staff se registra)
--    - UserManagement.jsx (cuando admin crea usuario)
--    - admin_create_player_credentials RPC (cuando se forjan credenciales)
