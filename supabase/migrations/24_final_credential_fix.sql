-- Fix definitivo v2: user_id, boolean temp_password, IF EXISTS (UPDATE) ELSE (INSERT)
-- pgcrypto está en schema extensions, search_path por defecto lo incluye

DROP FUNCTION IF EXISTS generate_player_username(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS generate_player_username(VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS admin_create_player_credentials(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_reset_player_password(UUID, TEXT);

CREATE OR REPLACE FUNCTION admin_create_player_credentials(
  p_player_id UUID, p_password TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_player RECORD;
  v_base TEXT; v_username TEXT; v_counter INTEGER := 0;
  v_email TEXT; v_user_id UUID; v_password TEXT;
  v_last TEXT;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;

  -- Primer nombre + primer apellido (Colombia: last_name guarda "segundo nombre + apellidos")
  v_last := COALESCE(NULLIF(split_part(v_player.last_name, ' ', 2), ''), split_part(v_player.last_name, ' ', 1));
  v_base := regexp_replace(lower(COALESCE(NULLIF(v_player.nickname,''), split_part(v_player.first_name, ' ', 1)||'.'||v_last)), '[^a-z0-9.]', '', 'g');
  IF length(v_base) > 40 THEN v_base := left(v_base, 40); END IF;
  IF v_base = '' OR v_base = '.' THEN v_base := 'guerrero'; END IF;
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM players WHERE username = v_username AND id != p_player_id) LOOP
    v_counter := v_counter + 1; v_username := v_base || v_counter::TEXT;
  END LOOP;

  v_email := v_username || '@orcos.club';
  v_password := upper(substr(md5(random()::TEXT), 1, 4)) || substr(md5(random()::TEXT), 1, 4);

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email AND deleted_at IS NULL) THEN
    UPDATE auth.users SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
      updated_at = now()
    WHERE email = v_email AND deleted_at IS NULL
    RETURNING id INTO v_user_id;
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
      now(), now()
    ) RETURNING id INTO v_user_id;
  END IF;

  UPDATE players SET username = v_username, email = v_email, user_id = v_user_id WHERE id = p_player_id;

  INSERT INTO user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (v_user_id, COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'jugador', v_player.team_category)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, system_role = EXCLUDED.system_role, club_scope = EXCLUDED.club_scope;

  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password);
END;
$$;

CREATE OR REPLACE FUNCTION admin_reset_player_password(
  p_player_id UUID, p_new_password TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE v_player RECORD; v_email TEXT;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  IF v_player.email IS NULL THEN RETURN jsonb_build_object('error', 'No tiene credenciales.'); END IF;

  UPDATE auth.users SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    raw_user_meta_data = jsonb_build_object(
      'display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'),
      'temp_password', true
    ),
    updated_at = now()
  WHERE email = v_player.email;

  RETURN jsonb_build_object('success', true);
END;
$$;
