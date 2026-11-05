-- 77_role_and_credential_hardening.sql
-- Hallazgos del QA por roles en producción (2026-11-05), con cuentas qa.*@orcos-qa.test:
--   1. CRÍTICO: cualquier usuario (incluido un jugador) podía ponerse system_role = 'presidente'
--      en su propia fila de user_profiles (política user_profiles_all sin restricción de columnas).
--   2. CRÍTICO: admin_create_player_credentials / admin_reset_player_password no comprobaban quién
--      las llamaba (cualquier usuario podía cambiar la contraseña de otro jugador) y además estaban
--      ROTAS en producción: "function extensions.md5(text) does not exist".
--   3. Un jugador podía editar campos sensibles de su propia ficha (clan, pagos, estado, cuenta).
-- Los candados son triggers: funcionan sean cuales sean las políticas RLS vigentes.
-- service_role / postgres (auth.uid() IS NULL) no se ven afectados. Idempotente.

-- ─── Utilidad: tier de un rol ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.role_tier(p_role TEXT)
RETURNS INT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_role
    WHEN 'desarrollador' THEN 0 WHEN 'presidente' THEN 1 WHEN 'promotor' THEN 2
    WHEN 'entrenador' THEN 3 WHEN 'tesorero' THEN 3 WHEN 'arbitro' THEN 3
    ELSE 4 END;
$$;

-- ─── 1. user_profiles: rol, estado y alcance solo los cambia un admin ───────
CREATE OR REPLACE FUNCTION public.guard_user_profile_privileges()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tier INT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;  -- service_role / migraciones
  v_tier := COALESCE(public.get_user_tier(), 4);

  IF NEW.system_role IS DISTINCT FROM OLD.system_role THEN
    IF v_tier > 1 THEN
      RAISE EXCEPTION 'Solo el presidente puede cambiar roles.' USING ERRCODE = '42501';
    END IF;
    IF (NEW.system_role = 'desarrollador' OR OLD.system_role = 'desarrollador') AND v_tier > 0 THEN
      RAISE EXCEPTION 'Solo un desarrollador puede asignar o quitar ese rol.' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_tier > 1 AND (
       NEW.is_active      IS DISTINCT FROM OLD.is_active
    OR NEW.club_scope     IS DISTINCT FROM OLD.club_scope
    OR NEW.division_scope IS DISTINCT FROM OLD.division_scope
    OR NEW.team_id        IS DISTINCT FROM OLD.team_id
    OR NEW.user_id        IS DISTINCT FROM OLD.user_id
  ) THEN
    RAISE EXCEPTION 'No puedes cambiar el estado, alcance o vínculo de una cuenta.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_user_profile_privileges ON public.user_profiles;
CREATE TRIGGER trg_guard_user_profile_privileges
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_profile_privileges();

-- ─── 2. players: un no-staff no toca campos sensibles de ninguna ficha ──────
-- (posición, dorsal, contacto, salud, foto, tallas, etc. siguen siendo editables por el jugador)
CREATE OR REPLACE FUNCTION public.guard_player_sensitive_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR COALESCE(public.get_user_tier(), 4) <= 3 THEN RETURN NEW; END IF;
  IF NEW.user_id             IS DISTINCT FROM OLD.user_id
  OR NEW.username            IS DISTINCT FROM OLD.username
  OR NEW.email               IS DISTINCT FROM OLD.email
  OR NEW.system_role         IS DISTINCT FROM OLD.system_role
  OR NEW.makgora_team_id     IS DISTINCT FROM OLD.makgora_team_id
  OR NEW.team_id             IS DISTINCT FROM OLD.team_id
  OR NEW.team_category       IS DISTINCT FROM OLD.team_category
  OR NEW.current_category    IS DISTINCT FROM OLD.current_category
  OR NEW.status              IS DISTINCT FROM OLD.status
  OR NEW.memberships_paid    IS DISTINCT FROM OLD.memberships_paid
  OR NEW.memberships_due     IS DISTINCT FROM OLD.memberships_due
  OR NEW.last_payment_date   IS DISTINCT FROM OLD.last_payment_date
  OR NEW.last_payment_amount IS DISTINCT FROM OLD.last_payment_amount
  OR NEW.deleted_at          IS DISTINCT FROM OLD.deleted_at
  THEN
    RAISE EXCEPTION 'Ese dato de la ficha solo lo cambia el staff.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_player_sensitive_fields ON public.players;
CREATE TRIGGER trg_guard_player_sensitive_fields
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.guard_player_sensitive_fields();

-- ─── 3. Credenciales de jugador: arreglo + control de acceso ────────────────
-- Quién: desarrollador, presidente, promotor (tier <= 2, igual que 'create_users' en la app).
-- Nunca sobre una cuenta de rango superior al llamante.
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

  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v_email,
          extensions.crypt(v_password, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
          now(), now())
  RETURNING id INTO v_user_id;

  UPDATE public.players SET username = v_username, email = v_email, user_id = v_user_id WHERE id = p_player_id;

  INSERT INTO public.user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (v_user_id, COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'jugador', v_player.team_category)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, system_role = EXCLUDED.system_role, club_scope = EXCLUDED.club_scope;

  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password, 'reused', false);
END $$;

CREATE OR REPLACE FUNCTION public.admin_reset_player_password(p_player_id UUID, p_new_password TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_player RECORD;
  v_caller INT := COALESCE(public.get_user_tier(), 4);
  v_target INT;
BEGIN
  IF v_caller > 2 THEN
    RETURN jsonb_build_object('error', 'No autorizado para cambiar contraseñas.');
  END IF;
  IF length(COALESCE(p_new_password, '')) < 6 THEN
    RETURN jsonb_build_object('error', 'La contraseña debe tener mínimo 6 caracteres.');
  END IF;
  SELECT * INTO v_player FROM public.players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  IF v_player.user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'El jugador no tiene credenciales. Usa "Forjar Credenciales" primero.');
  END IF;
  SELECT public.role_tier(system_role) INTO v_target FROM public.user_profiles WHERE user_id = v_player.user_id;
  IF COALESCE(v_target, 4) < v_caller THEN
    RETURN jsonb_build_object('error', 'No puedes cambiar la contraseña de un rango superior.');
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
      updated_at = now()
  WHERE id = v_player.user_id;
  RETURN jsonb_build_object('success', true);
END $$;

REVOKE ALL ON FUNCTION public.admin_create_player_credentials(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reset_player_password(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_player_credentials(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_player_password(UUID, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.guard_user_profile_privileges() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_player_sensitive_fields() FROM PUBLIC, anon, authenticated;
