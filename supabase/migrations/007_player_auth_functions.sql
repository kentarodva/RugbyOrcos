-- ============================================================
-- FASE 4b: Funciones RPC para gestion de credenciales de jugadores
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear credenciales para un jugador (genera auth.user + actualiza player)
CREATE OR REPLACE FUNCTION admin_create_player_credentials(
  p_player_id UUID,
  p_password TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public'
AS $$
DECLARE
  v_player RECORD;
  v_username TEXT;
  v_email TEXT;
  v_user_id UUID;
  v_password TEXT;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Jugador no encontrado');
  END IF;

  v_username := COALESCE(v_player.username, generate_player_username(v_player.first_name, v_player.last_name, v_player.nickname));
  v_email := COALESCE(v_player.phone, v_player.email, v_username || '@orcos.local');
  v_password := COALESCE(p_password, left(md5(random()::TEXT), 10));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero')),
    now(),
    now()
  ) RETURNING id INTO v_user_id;

  UPDATE players SET 
    username = v_username,
    email = v_email
  WHERE id = p_player_id;

  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password);
END;
$$;

-- 2. Restablecer contrasena de un jugador
CREATE OR REPLACE FUNCTION admin_reset_player_password(
  p_player_id UUID,
  p_new_password TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public'
AS $$
DECLARE
  v_player RECORD;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Jugador no encontrado');
  END IF;

  IF v_player.email IS NULL THEN
    RETURN jsonb_build_object('error', 'El jugador no tiene credenciales. Genera credenciales primero.');
  END IF;

  UPDATE auth.users SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE email = v_player.email;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No se encontro la cuenta auth del jugador');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
