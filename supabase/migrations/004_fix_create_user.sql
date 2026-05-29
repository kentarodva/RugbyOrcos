-- ============================================================
-- FIX: Funcion SECURITY DEFINER para crear usuarios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_display_name TEXT,
  p_system_role TEXT DEFAULT 'jugador',
  p_club_scope TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND is_active = true
    AND system_role IN ('desarrollador','presidente','promotor')
  ) THEN
    RETURN jsonb_build_object('error', 'Permiso denegado: solo rangos superiores pueden crear usuarios');
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ) RETURNING id INTO v_user_id;

  INSERT INTO public.user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (v_user_id, p_display_name, p_system_role, p_club_scope);

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;
