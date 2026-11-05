-- 78_fix_forged_player_login.sql
-- La 77 restauró admin_create_player_credentials desde el repo (versión 53), que inserta en auth.users
-- sin los campos token vacíos ni la fila en auth.identities. Resultado verificado en QA: la cuenta se crea
-- pero el login responde 500 "Database error querying schema".
-- Esta versión crea la cuenta igual que admin_create_staff_user (que sí funciona) y repara las cuentas
-- que hayan quedado a medias. Mantiene el control de acceso de la 77. Idempotente.

CREATE OR REPLACE FUNCTION public.admin_create_player_credentials(p_player_id UUID, p_password TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_player RECORD; v_username TEXT; v_email TEXT; v_user_id UUID; v_password TEXT;
  v_caller INT := COALESCE(public.get_user_tier(), 4);
  v_target INT;
BEGIN
  IF v_caller > 2 THEN
    RETURN jsonb_build_object('error', 'No autorizado para forjar credenciales.');
  END IF;
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;

  IF v_player.user_id IS NOT NULL AND COALESCE(v_player.username, '') <> '' THEN
    SELECT public.role_tier(system_role) INTO v_target FROM public.user_profiles WHERE user_id = v_player.user_id;
    IF COALESCE(v_target, 4) < v_caller THEN
      RETURN jsonb_build_object('error', 'No puedes cambiar credenciales de un rango superior.');
    END IF;
    IF COALESCE(p_password, '') <> '' THEN
      UPDATE auth.users
      SET encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
          raw_user_meta_data = jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
          updated_at = now()
      WHERE id = v_player.user_id;
    END IF;
    RETURN jsonb_build_object('success', true, 'username', v_player.username, 'email', v_player.email, 'password', '', 'reused', true);
  END IF;

  v_username := public.generate_player_username(v_player.first_name, v_player.last_name, v_player.second_last_name,
                                                v_player.middle_name, v_player.nickname, p_player_id);
  v_email := v_username || '@orcos.club';
  v_password := COALESCE(NULLIF(p_password, ''),
    upper(substr(pg_catalog.md5(random()::text), 1, 4)) || substr(pg_catalog.md5(random()::text), 1, 4));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, confirmation_sent_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', extensions.gen_random_uuid(), 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')), now(), '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
    now(), now(), '', '', '', '', '', '', '', false, false
  )
  RETURNING id INTO v_user_id;

  -- GoTrue needs an identity row; without it login fails with "Database error querying schema".
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (extensions.gen_random_uuid(), v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', v_email),
          'email', v_user_id::text, now(), now(), now());

  UPDATE public.players SET username = v_username, email = v_email, user_id = v_user_id WHERE id = p_player_id;

  INSERT INTO public.user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (v_user_id, COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'jugador', v_player.team_category)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, system_role = EXCLUDED.system_role, club_scope = EXCLUDED.club_scope;

  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password, 'reused', false);
END $$;


REVOKE ALL ON FUNCTION public.admin_create_player_credentials(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_player_credentials(UUID, TEXT) TO authenticated;

-- Reparación: cuentas con tokens NULL o sin identidad (solo afecta a cuentas mal creadas).
UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email_change_token_new IS NULL OR email_change IS NULL
   OR email_change_token_current IS NULL OR phone_change IS NULL OR phone_change_token IS NULL OR reauthentication_token IS NULL;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT extensions.gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', u.id::text, now(), now(), now()
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);
