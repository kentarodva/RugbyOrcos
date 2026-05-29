-- ============================================================
-- FIX: Funcion RPC para restablecer contraseña de usuario staff
-- Ejecutar en Supabase SQL Editor
-- ============================================================
CREATE OR REPLACE FUNCTION admin_reset_staff_password(
  p_user_id UUID, p_new_password TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public' AS $$
DECLARE v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Usuario no encontrado'); END IF;
  UPDATE auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now() WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
