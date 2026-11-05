-- 75_makgora_clan_chiefs.sql
-- Jefes de clan Mak'Gora: un jugador con cuenta puede gestionar SOLO su clan.
--
-- Qué puede hacer un jefe de clan (y el staff del club, tier <= 3, en todos):
--   * Escudo, lema y color de su clan                      -> makgora_update_clan()
--   * Posición y dorsal de los guerreros de su clan        -> makgora_update_player()
--   * Pedir préstamos para su clan                         -> makgora_request_loan()
--   * Aprobar/rechazar préstamos de jugadores de su clan   -> makgora_respond_loan()
-- Qué NO puede: resultados, estadísticas, traspasos, ni tocar otros clanes.
-- Quién asigna jefes: presidente y desarrollador (tier <= 1), desde Gestión Equipos.
--
-- Diseño: los permisos viven en funciones SECURITY DEFINER que validan al llamante,
-- así no dependen de las políticas RLS existentes en players / makgora_teams / player_loans.
-- Idempotente.

-- ─── 1. Tabla de jefes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.makgora_team_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.makgora_teams(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id   UUID REFERENCES public.players(id) ON DELETE SET NULL,
  role        TEXT NOT NULL DEFAULT 'jefe' CHECK (role IN ('jefe')),
  assigned_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_makgora_team_staff_user ON public.makgora_team_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_makgora_team_staff_player ON public.makgora_team_staff(player_id);
CREATE INDEX IF NOT EXISTS idx_makgora_team_staff_assigned_by ON public.makgora_team_staff(assigned_by);
COMMENT ON TABLE public.makgora_team_staff IS 'Jefes de clan Mak''Gora: gestionan solo su clan (ver migración 75).';

-- ─── 2. Funciones de permiso ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.makgora_is_club_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.get_user_tier(), 4) <= 3;
$$;

CREATE OR REPLACE FUNCTION public.makgora_is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.get_user_tier(), 4) <= 1;
$$;

CREATE OR REPLACE FUNCTION public.makgora_is_chief(p_team UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_team IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.makgora_team_staff s WHERE s.team_id = p_team AND s.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.makgora_can_manage(p_team UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.makgora_is_club_staff() OR public.makgora_is_chief(p_team);
$$;

-- Crest files are stored as clans/<team uuid>-<timestamp>.<ext>
CREATE OR REPLACE FUNCTION public.makgora_is_chief_crest_path(p_name TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.makgora_team_staff s
    WHERE s.user_id = auth.uid() AND p_name LIKE 'clans/' || s.team_id::text || '-%'
  );
$$;

-- ─── 3. RLS de la tabla de jefes ────────────────────────────────────────────
ALTER TABLE public.makgora_team_staff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.makgora_team_staff FROM anon;

DROP POLICY IF EXISTS "Jefes de clan visibles" ON public.makgora_team_staff;
CREATE POLICY "Jefes de clan visibles" ON public.makgora_team_staff
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin asigna jefes" ON public.makgora_team_staff;
CREATE POLICY "Admin asigna jefes" ON public.makgora_team_staff
  FOR INSERT TO authenticated WITH CHECK ((SELECT public.makgora_is_admin()));

DROP POLICY IF EXISTS "Admin retira jefes" ON public.makgora_team_staff;
CREATE POLICY "Admin retira jefes" ON public.makgora_team_staff
  FOR DELETE TO authenticated USING ((SELECT public.makgora_is_admin()));

-- ─── 4. Escudos: el jefe sube/cambia/borra solo los de su clan ──────────────
DROP POLICY IF EXISTS "Jefe de clan sube escudo" ON storage.objects;
CREATE POLICY "Jefe de clan sube escudo" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'crests' AND public.makgora_is_chief_crest_path(name));

DROP POLICY IF EXISTS "Jefe de clan actualiza escudo" ON storage.objects;
CREATE POLICY "Jefe de clan actualiza escudo" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'crests' AND public.makgora_is_chief_crest_path(name));

DROP POLICY IF EXISTS "Jefe de clan borra escudo" ON storage.objects;
CREATE POLICY "Jefe de clan borra escudo" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'crests' AND public.makgora_is_chief_crest_path(name));

-- ─── 5. Identidad del clan ──────────────────────────────────────────────────
-- p_changes admite solo: crest_url, motto, emblem_color (las claves ausentes no se tocan).
CREATE OR REPLACE FUNCTION public.makgora_update_clan(p_team UUID, p_changes JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_crest TEXT := p_changes->>'crest_url';
  v_motto TEXT := NULLIF(btrim(p_changes->>'motto'), '');
  v_color TEXT := p_changes->>'emblem_color';
BEGIN
  IF NOT public.makgora_can_manage(p_team) THEN
    RAISE EXCEPTION 'Solo el staff o el jefe de este clan puede editarlo.' USING ERRCODE = '42501';
  END IF;
  IF p_changes ? 'crest_url' AND v_crest IS NOT NULL AND v_crest NOT LIKE '%/storage/v1/object/public/crests/%' THEN
    RAISE EXCEPTION 'El escudo debe subirse desde la app.' USING ERRCODE = '22023';
  END IF;
  IF p_changes ? 'motto' AND length(COALESCE(v_motto, '')) > 80 THEN
    RAISE EXCEPTION 'El lema admite máximo 80 caracteres.' USING ERRCODE = '22023';
  END IF;
  IF p_changes ? 'emblem_color' AND (v_color IS NULL OR v_color !~ '^#[0-9a-fA-F]{6}$') THEN
    RAISE EXCEPTION 'Color inválido.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.makgora_teams SET
    crest_url    = CASE WHEN p_changes ? 'crest_url'    THEN v_crest ELSE crest_url END,
    motto        = CASE WHEN p_changes ? 'motto'        THEN v_motto ELSE motto END,
    emblem_color = CASE WHEN p_changes ? 'emblem_color' THEN v_color ELSE emblem_color END
  WHERE id = p_team;
  IF NOT FOUND THEN RAISE EXCEPTION 'Clan no encontrado.' USING ERRCODE = 'P0002'; END IF;
  RETURN p_team;
END $$;

-- ─── 6. Posición y dorsal de un guerrero del clan ───────────────────────────
CREATE OR REPLACE FUNCTION public.makgora_update_player(p_player UUID, p_position_id INT, p_jersey INT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_team UUID;
  v_names TEXT[] := ARRAY['Pilar Izquierdo','Talonador (Hooker)','Pilar Derecho','Segunda Línea Izq','Segunda Línea Der',
    'Flanker Ciego','Flanker Abierto','Octavo (N8)','Medio Melé (Half)','Apertura (Fly)','Ala Izquierdo (Wing)',
    'Primer Centro','Segundo Centro','Ala Derecho (Wing)','Zaguero (Fullback)'];
BEGIN
  SELECT makgora_team_id INTO v_team FROM public.players WHERE id = p_player AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jugador no encontrado.' USING ERRCODE = 'P0002'; END IF;
  IF NOT public.makgora_can_manage(v_team) THEN
    RAISE EXCEPTION 'Solo el staff o el jefe de su clan puede editar a este jugador.' USING ERRCODE = '42501';
  END IF;
  IF p_position_id IS NOT NULL AND (p_position_id < 1 OR p_position_id > 15) THEN
    RAISE EXCEPTION 'Posición inválida (1-15).' USING ERRCODE = '22023';
  END IF;
  IF p_jersey IS NOT NULL AND (p_jersey < 1 OR p_jersey > 99) THEN
    RAISE EXCEPTION 'Dorsal inválido (1-99).' USING ERRCODE = '22023';
  END IF;

  UPDATE public.players SET
    position_id   = p_position_id,
    position      = CASE WHEN p_position_id IS NULL THEN position ELSE v_names[p_position_id] END,
    jersey_number = p_jersey,
    updated_at    = NOW()
  WHERE id = p_player;
  RETURN p_player;
END $$;

-- ─── 7. Préstamos ───────────────────────────────────────────────────────────
-- Pide: staff o jefe del clan que RECIBE. Aprueba/rechaza: staff o jefe del clan que PRESTA.
CREATE OR REPLACE FUNCTION public.makgora_request_loan(p_player UUID, p_to_team UUID, p_days INT, p_reason TEXT, p_tournament UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_from UUID; v_id UUID;
BEGIN
  IF NOT public.makgora_can_manage(p_to_team) THEN
    RAISE EXCEPTION 'Solo el staff o el jefe del clan destino puede pedir este préstamo.' USING ERRCODE = '42501';
  END IF;
  SELECT makgora_team_id INTO v_from FROM public.players WHERE id = p_player AND deleted_at IS NULL;
  IF v_from IS NULL THEN RAISE EXCEPTION 'El jugador no pertenece a ningún clan.' USING ERRCODE = '22023'; END IF;
  IF v_from = p_to_team THEN RAISE EXCEPTION 'No puedes pedir un jugador de tu propio clan.' USING ERRCODE = '22023'; END IF;
  IF p_days IS NULL OR p_days < 1 OR p_days > 90 THEN RAISE EXCEPTION 'Días de préstamo: 1 a 90.' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.player_loans WHERE player_id = p_player AND status IN ('pending', 'approved')) THEN
    RAISE EXCEPTION 'Este jugador ya tiene un préstamo pendiente o activo.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.player_loans (player_id, from_team_id, to_team_id, tournament_id, start_date, end_date, reason, status)
  VALUES (p_player, v_from, p_to_team, p_tournament, CURRENT_DATE, CURRENT_DATE + p_days, NULLIF(btrim(p_reason), ''), 'pending')
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.makgora_respond_loan(p_loan UUID, p_status TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.player_loans%ROWTYPE;
BEGIN
  SELECT * INTO l FROM public.player_loans WHERE id = p_loan FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Préstamo no encontrado.' USING ERRCODE = 'P0002'; END IF;

  IF p_status IN ('approved', 'rejected') THEN
    IF l.status <> 'pending' THEN RAISE EXCEPTION 'El préstamo ya no está pendiente.' USING ERRCODE = '22023'; END IF;
    IF NOT (public.makgora_is_club_staff() OR public.makgora_is_chief(l.from_team_id)) THEN
      RAISE EXCEPTION 'Solo el staff o el jefe del clan que presta puede responder.' USING ERRCODE = '42501';
    END IF;
  ELSIF p_status = 'returned' THEN
    IF l.status <> 'approved' THEN RAISE EXCEPTION 'Solo se devuelve un préstamo activo.' USING ERRCODE = '22023'; END IF;
    IF NOT (public.makgora_is_club_staff() OR public.makgora_is_chief(l.from_team_id) OR public.makgora_is_chief(l.to_team_id)) THEN
      RAISE EXCEPTION 'Solo el staff o los jefes de los clanes implicados pueden devolverlo.' USING ERRCODE = '42501';
    END IF;
  ELSIF p_status = 'cancelled' THEN
    IF l.status <> 'pending' THEN RAISE EXCEPTION 'Solo se cancela un préstamo pendiente.' USING ERRCODE = '22023'; END IF;
    IF NOT (public.makgora_is_club_staff() OR public.makgora_is_chief(l.to_team_id)) THEN
      RAISE EXCEPTION 'Solo el staff o el jefe que lo pidió puede cancelarlo.' USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION 'Estado inválido.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.player_loans SET
    status = p_status,
    approved_by = CASE WHEN p_status = 'approved' THEN auth.uid() ELSE approved_by END,
    updated_at = NOW()
  WHERE id = p_loan;
  RETURN p_loan;
END $$;

-- Mantenimiento: cualquier usuario autenticado puede disparar la devolución de préstamos vencidos.
CREATE OR REPLACE FUNCTION public.makgora_return_expired_loans()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INT;
BEGIN
  UPDATE public.player_loans SET status = 'returned', updated_at = NOW()
  WHERE status = 'approved' AND end_date < CURRENT_DATE;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- ─── 8. Permisos de ejecución: solo usuarios autenticados ───────────────────
DO $$
DECLARE f TEXT;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'makgora_is_club_staff()', 'makgora_is_admin()', 'makgora_is_chief(uuid)', 'makgora_can_manage(uuid)',
    'makgora_is_chief_crest_path(text)', 'makgora_update_clan(uuid, jsonb)', 'makgora_update_player(uuid, int, int)',
    'makgora_request_loan(uuid, uuid, int, text, uuid)', 'makgora_respond_loan(uuid, text)', 'makgora_return_expired_loans()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;
