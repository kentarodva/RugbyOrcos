-- 95_security_hardening.sql
-- Auditoría de seguridad por roles (2026-11-12). Probado con sesiones reales de cada rol
-- (matriz en el PR). Fallas corregidas:
--   1. Datos de salud: cualquier jugador leía lesiones, bienestar (sueño/estrés/dolor) y
--      evaluaciones de conmoción de TODOS. Ahora: el propio jugador y el staff.
--   2. Disciplina: un jugador podía marcarse presente y borrarse sus burpees. Ahora la
--      asistencia y las penitencias las escribe el staff (o la BD, migración 87).
--   3. player_record_progress_snapshot(): cualquier usuario cambiaba peso/levantamientos de
--      cualquier ficha (y el anónimo podía llamarla). Ahora: su propia ficha o staff.
--   4. resolve_player_login(): sin cuenta se sacaban emails buscando una letra. Ahora el
--      email solo sale con el usuario EXACTO; para errores de tipeo, solo el usuario.
--   5. admin_reset_staff_password(): no revisaba quién llamaba (y fallaba por search_path).
--      Ahora: solo presidencia/desarrollo, nunca sobre un rango superior.
--   6. update_standing(): cualquier usuario alteraba la tabla de posiciones. Ahora: admin
--      (igual que las políticas de tournament_matches/standings).
--   7. gym_history: cualquier usuario insertaba historial de cualquier ficha.
--   8. role_tier(): search_path fijo (aviso del linter de Supabase).
-- Idempotente.

-- ¿La ficha es del usuario actual? (cuenta propia o mismo email, como las demás funciones)
CREATE OR REPLACE FUNCTION public.is_own_player(p_player UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM players p
    WHERE p.id = p_player AND p.deleted_at IS NULL
      AND (p.user_id = auth.uid()
           OR (p.email IS NOT NULL AND lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  );
$$;
REVOKE ALL ON FUNCTION public.is_own_player(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_own_player(UUID) TO authenticated;

-- 1. Salud: propio o staff.
DROP POLICY IF EXISTS injury_log_select ON public.injury_log;
CREATE POLICY injury_log_select ON public.injury_log FOR SELECT TO authenticated
  USING ((SELECT coalesce(get_user_tier() <= 3, false)) OR is_own_player(player_id));
DROP POLICY IF EXISTS wellness_logs_select ON public.wellness_logs;
CREATE POLICY wellness_logs_select ON public.wellness_logs FOR SELECT TO authenticated
  USING ((SELECT coalesce(get_user_tier() <= 3, false)) OR is_own_player(player_id));
DROP POLICY IF EXISTS hia_assessments_select ON public.hia_assessments;
CREATE POLICY hia_assessments_select ON public.hia_assessments FOR SELECT TO authenticated
  USING ((SELECT coalesce(get_user_tier() <= 3, false)) OR is_own_player(player_id));

-- 2. Disciplina: el jugador ya no escribe su asistencia ni sus penitencias.
DROP POLICY IF EXISTS attendance_insert ON public.attendance;
CREATE POLICY attendance_insert ON public.attendance FOR INSERT TO authenticated
  WITH CHECK ((SELECT is_admin()));
DROP POLICY IF EXISTS attendance_update ON public.attendance;
CREATE POLICY attendance_update ON public.attendance FOR UPDATE TO authenticated
  USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
DROP POLICY IF EXISTS attendance_delete ON public.attendance;
CREATE POLICY attendance_delete ON public.attendance FOR DELETE TO authenticated
  USING ((SELECT is_admin()));

DROP POLICY IF EXISTS penalties_insert ON public.penalties;
CREATE POLICY penalties_insert ON public.penalties FOR INSERT TO authenticated
  WITH CHECK ((SELECT is_admin()));
DROP POLICY IF EXISTS penalties_update ON public.penalties;
CREATE POLICY penalties_update ON public.penalties FOR UPDATE TO authenticated
  USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));
DROP POLICY IF EXISTS penalties_delete ON public.penalties;
CREATE POLICY penalties_delete ON public.penalties FOR DELETE TO authenticated
  USING ((SELECT is_admin()));

-- 3. Progreso: solo la ficha propia o el staff.
DO $$
DECLARE v_def TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p
   WHERE p.proname = 'player_record_progress_snapshot' AND p.pronamespace = 'public'::regnamespace;
  IF v_def IS NOT NULL AND position('is_own_player' IN v_def) = 0 THEN
    v_def := replace(v_def,
      $f$IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'No autenticado');
  END IF;$f$,
      $f$IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'No autenticado');
  END IF;
  IF NOT (coalesce(public.get_user_tier() <= 3, false) OR public.is_own_player(v_pid)) THEN
    RETURN jsonb_build_object('error', 'No autorizado');
  END IF;$f$);
    IF position('is_own_player' IN v_def) = 0 THEN
      RAISE EXCEPTION 'player_record_progress_snapshot cambió: revisar el parche de la migración 95';
    END IF;
    EXECUTE v_def;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.player_record_progress_snapshot(TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.player_record_progress_snapshot(TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB, JSONB) TO authenticated;

-- 4. Login por usuario sin filtrar emails.
CREATE OR REPLACE FUNCTION public.resolve_player_login(p_query TEXT)
RETURNS TABLE(username TEXT, nickname TEXT, email TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_q TEXT := lower(trim(coalesce(p_query, '')));
BEGIN
  IF length(v_q) < 3 THEN
    RETURN;
  END IF;

  -- Coincidencia exacta: el email de esa cuenta (hace falta para iniciar sesión).
  RETURN QUERY
  SELECT p.username::TEXT, p.nickname::TEXT, p.email::TEXT
  FROM players p
  WHERE p.deleted_at IS NULL AND p.username IS NOT NULL
    AND (lower(p.username) = v_q OR lower(coalesce(p.nickname, '')) = v_q)
  ORDER BY (lower(p.username) = v_q) DESC
  LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  -- Sin coincidencia exacta: solo sugerencias de usuario, nunca emails.
  RETURN QUERY
  SELECT p.username::TEXT, NULL::TEXT, NULL::TEXT
  FROM players p
  WHERE p.deleted_at IS NULL AND p.username IS NOT NULL
    AND lower(p.username) LIKE '%' || v_q || '%'
  ORDER BY length(p.username)
  LIMIT 5;
END $$;
REVOKE ALL ON FUNCTION public.resolve_player_login(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_player_login(TEXT) TO anon, authenticated;

-- 5. Cambiar la contraseña de un miembro del staff.
CREATE OR REPLACE FUNCTION public.admin_reset_staff_password(p_user_id UUID, p_new_password TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_caller INT := coalesce(public.get_user_tier(), 4);
  v_target INT;
BEGIN
  IF v_caller > 1 THEN
    RETURN jsonb_build_object('error', 'No autorizado para cambiar contraseñas del staff.');
  END IF;
  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('error', 'La contraseña debe tener mínimo 6 caracteres.');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('error', 'Usuario no encontrado');
  END IF;
  SELECT public.role_tier(system_role) INTO v_target FROM user_profiles WHERE user_id = p_user_id;
  IF v_target IS NOT NULL AND v_target < v_caller THEN
    RETURN jsonb_build_object('error', 'No puedes cambiar credenciales de un rango superior.');
  END IF;
  UPDATE auth.users SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')), updated_at = now()
   WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
END $$;
REVOKE ALL ON FUNCTION public.admin_reset_staff_password(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_staff_password(UUID, TEXT) TO authenticated;

-- 6. Tabla de posiciones: solo admin (como tournament_matches / tournament_standings).
DO $$
DECLARE v_def TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_def FROM pg_proc p
   WHERE p.proname = 'update_standing' AND p.pronamespace = 'public'::regnamespace;
  IF v_def IS NOT NULL AND position('is_admin' IN v_def) = 0 THEN
    v_def := regexp_replace(v_def, 'BEGIN', 'BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION ''Solo la presidencia puede actualizar posiciones'' USING ERRCODE = ''42501'';
  END IF;', '');
    EXECUTE v_def;
  END IF;
END $$;

-- 7. Historial de gimnasio: la ficha propia o el staff.
DROP POLICY IF EXISTS gym_history_insert ON public.gym_history;
CREATE POLICY gym_history_insert ON public.gym_history FOR INSERT TO authenticated
  WITH CHECK ((SELECT coalesce(get_user_tier() <= 3, false)) OR is_own_player(player_id));

-- 8. search_path fijo.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'role_tier' AND pronamespace = 'public'::regnamespace) THEN
    EXECUTE (SELECT 'ALTER FUNCTION public.role_tier(' || pg_get_function_identity_arguments(oid) || ') SET search_path = public'
               FROM pg_proc WHERE proname = 'role_tier' AND pronamespace = 'public'::regnamespace LIMIT 1);
  END IF;
END $$;
