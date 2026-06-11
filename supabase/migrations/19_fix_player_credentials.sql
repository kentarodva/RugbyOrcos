-- Fix: schema explícito en funciones de credenciales + temp_password flag

CREATE OR REPLACE FUNCTION generate_player_username(
  p_first_name TEXT, p_last_name TEXT, p_nickname TEXT DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SET search_path = 'public' AS $$
DECLARE v_base TEXT; v_username TEXT; v_counter INTEGER := 0;
BEGIN
  IF p_nickname IS NOT NULL AND p_nickname != '' THEN
    v_base := lower(regexp_replace(p_nickname, '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    v_base := lower(regexp_replace(COALESCE(p_first_name,'')||'.'||COALESCE(p_last_name,''), '[^a-zA-Z0-9.]', '', 'g'));
  END IF;
  IF length(v_base) > 40 THEN v_base := left(v_base, 40); END IF;
  IF v_base = '' OR v_base = '.' THEN v_base := 'guerrero'; END IF;
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM public.players WHERE username = v_username) LOOP
    v_counter := v_counter + 1; v_username := v_base || v_counter::TEXT;
  END LOOP;
  RETURN v_username;
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_player_credentials(
  p_player_id UUID, p_password TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'pg_catalog, public' AS $$
DECLARE
  v_player RECORD; v_username TEXT; v_email TEXT; v_user_id UUID; v_password TEXT;
BEGIN
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  v_username := COALESCE(v_player.username, generate_player_username(v_player.first_name, v_player.last_name, v_player.nickname));
  v_email := COALESCE(v_player.phone, v_player.email, v_username || '@orcos.local');

  -- Generar password automática de 8 caracteres (ignorar p_password)
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
