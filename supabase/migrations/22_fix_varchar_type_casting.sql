-- Fix: casteo VARCHAR→TEXT en la llamada a generate_player_username
-- Las columnas de players son VARCHAR(100), que PostgreSQL distingue de TEXT
CREATE OR REPLACE FUNCTION admin_create_player_credentials(
  p_player_id UUID, p_password TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public' AS $$
DECLARE
  v_player RECORD; v_username TEXT; v_email TEXT; v_user_id UUID; v_password TEXT;
BEGIN
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  v_username := COALESCE(v_player.username, generate_player_username(v_player.first_name::TEXT, v_player.last_name::TEXT, v_player.nickname::TEXT));
  v_email := COALESCE(v_player.phone, v_player.email, v_username || '@orcos.local');

  v_password := upper(substr(md5(random()::TEXT), 1, 4)) || substr(md5(random()::TEXT), 1, 4);

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    v_email, crypt(v_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', 'true'),
    now(), now()
  ) RETURNING id INTO v_user_id;

  UPDATE public.players SET username = v_username, email = v_email WHERE id = p_player_id;

  INSERT INTO user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (v_user_id, COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'jugador', v_player.team_category)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, system_role = EXCLUDED.system_role, club_scope = EXCLUDED.club_scope;

  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password);
END;
$$;

-- También aplicar el mismo fix en admin_reset_player_password por si acaso
CREATE OR REPLACE FUNCTION admin_reset_player_password(
  p_player_id UUID, p_new_password TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public' AS $$
DECLARE v_player RECORD; v_username TEXT; v_email TEXT;
BEGIN
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  v_username := v_player.username;
  v_email := COALESCE(v_player.phone, v_player.email, v_username || '@orcos.local');
  UPDATE auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
    raw_user_meta_data = jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', 'true'),
    updated_at = now()
  WHERE id = v_player.user_id;
  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email);
END;
$$;
