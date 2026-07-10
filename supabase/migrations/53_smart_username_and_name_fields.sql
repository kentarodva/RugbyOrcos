-- Migracion 53: Smart username generation + campos de nombre + fix bug de auth duplicada
-- Agrega campos middle_name y second_last_name a players
-- Backfill desde last_name con 3+ palabras
-- Reemplaza generate_player_username con version que maneja duplicados
-- Reemplaza admin_create_player_credentials para NO crear auth duplicada

-- =============================================
-- 1) Columnas nuevas
-- =============================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS middle_name VARCHAR;
ALTER TABLE players ADD COLUMN IF NOT EXISTS second_last_name VARCHAR;
ALTER TABLE players ALTER COLUMN user_id DROP NOT NULL;

-- =============================================
-- 2) Backfill desde last_name con 3+ palabras
--    patron: "SegundoNombre PrimerApellido SegundoApellido"
-- =============================================
UPDATE players
SET middle_name = split_part(last_name, ' ', 1),
    last_name = split_part(last_name, ' ', 2),
    second_last_name = NULLIF(split_part(last_name, ' ', 3), '')
WHERE last_name LIKE '% % %';

-- =============================================
-- 3) Funcion mejorada: generate_player_username
--    - Prioriza nickname si existe
--    - Usa first_name + last_name por defecto
--    - En choque 1: agrega primera letra del second_last_name
--    - En choques 2+: agrega sufijo numerico
-- =============================================
CREATE OR REPLACE FUNCTION generate_player_username(
  p_first_name VARCHAR,
  p_last_name VARCHAR,
  p_second_last_name VARCHAR DEFAULT NULL,
  p_middle_name VARCHAR DEFAULT NULL,
  p_nickname VARCHAR DEFAULT NULL,
  p_exclude_player_id UUID DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_first TEXT;
  v_last1 TEXT;
  v_last2 TEXT;
  v_base TEXT;
  v_candidate TEXT;
  v_counter INTEGER := 0;
  v_suffix TEXT := '';
BEGIN
  -- Si tiene nickname, usarlo como base
  IF p_nickname IS NOT NULL AND p_nickname != '' THEN
    v_base := lower(regexp_replace(p_nickname, '[^a-z0-9]', '', 'g'));
  ELSE
    -- Primer nombre (primera palabra)
    v_first := split_part(COALESCE(p_first_name, ''), ' ', 1);
    -- Primer apellido
    v_last1 := COALESCE(NULLIF(p_last_name, ''), 'guerrero');
    v_base := lower(v_first || '.' || v_last1);
  END IF;

  -- Limpieza: solo letras, digitos y puntos
  v_base := regexp_replace(v_base, '[^a-z0-9.]', '', 'g');
  IF length(v_base) > 35 THEN v_base := left(v_base, 35); END IF;
  IF v_base = '' OR v_base = '.' THEN v_base := 'guerrero'; END IF;

  -- Buscar colision
  v_candidate := v_base;
  WHILE EXISTS (
    SELECT 1 FROM players
    WHERE username = v_candidate
      AND (p_exclude_player_id IS NULL OR id != p_exclude_player_id)
  ) LOOP
    v_counter := v_counter + 1;
    IF v_counter = 1 AND p_second_last_name IS NOT NULL AND p_second_last_name != '' THEN
      -- Primer choque: agregar primera letra del segundo apellido
      v_last2 := split_part(p_second_last_name, ' ', 1);
      v_suffix := lower(left(regexp_replace(v_last2, '[^a-zA-Z]', '', 'g'), 1));
      IF v_suffix = '' THEN v_suffix := 'x'; END IF;
      v_candidate := v_base || v_suffix;
    ELSE
      -- Segundo o mas choques: sufijo numerico
      v_candidate := v_base || COALESCE(NULLIF(v_suffix, ''), 'x') || v_counter::TEXT;
    END IF;
  END LOOP;

  RETURN v_candidate;
END;
$$;

-- =============================================
-- 4) Fix bug: admin_create_player_credentials NO crea auth duplicada
--    - Si el player ya tiene user_id, REUTILIZA esa auth.users
--    - Si no, genera nueva y crea todo
-- =============================================
CREATE OR REPLACE FUNCTION admin_create_player_credentials(
  p_player_id UUID,
  p_password TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

  -- Si ya tiene credenciales, REUTILIZAR (no crear duplicados)
  IF v_player.user_id IS NOT NULL
     AND v_player.username IS NOT NULL
     AND v_player.username != '' THEN
    v_user_id := v_player.user_id;
    v_username := v_player.username;
    v_email := v_player.email;

    -- Si se proporciono password, resetearla
    IF p_password IS NOT NULL AND p_password != '' THEN
      UPDATE auth.users
      SET encrypted_password = crypt(p_password, gen_salt('bf')),
          raw_user_meta_data = jsonb_build_object(
            'display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'),
            'temp_password', true
          ),
          updated_at = now()
      WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'username', v_username,
      'email', v_email,
      'password', '',
      'reused', true
    );
  END IF;

  -- Generar username nuevo
  v_username := generate_player_username(
    v_player.first_name,
    v_player.last_name,
    v_player.second_last_name,
    v_player.middle_name,
    v_player.nickname,
    p_player_id
  );
  v_email := v_username || '@orcos.club';
  v_password := COALESCE(
    NULLIF(p_password, ''),
    upper(substr(md5(random()::TEXT), 1, 4)) || substr(md5(random()::TEXT), 1, 4)
  );

  -- Crear auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
      'display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'),
      'temp_password', true
    ),
    now(),
    now()
  )
  RETURNING id INTO v_user_id;

  -- Actualizar player
  UPDATE players
  SET username = v_username,
      email = v_email,
      user_id = v_user_id
  WHERE id = p_player_id;

  -- Crear o actualizar user_profiles
  INSERT INTO user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (
    v_user_id,
    COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'),
    'jugador',
    v_player.team_category
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    system_role = EXCLUDED.system_role,
    club_scope = EXCLUDED.club_scope;

  RETURN jsonb_build_object(
    'success', true,
    'username', v_username,
    'email', v_email,
    'password', v_password,
    'reused', false
  );
END;
$$;

-- =============================================
-- 5) admin_reset_player_password: actualizado para usar campos nuevos
-- =============================================
CREATE OR REPLACE FUNCTION admin_reset_player_password(
  p_player_id UUID,
  p_new_password TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_player RECORD;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Jugador no encontrado');
  END IF;
  IF v_player.user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'El jugador no tiene credenciales. Usa "Forjar Credenciales" primero.');
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object(
        'display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'),
        'temp_password', true
      ),
      updated_at = now()
  WHERE id = v_player.user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
