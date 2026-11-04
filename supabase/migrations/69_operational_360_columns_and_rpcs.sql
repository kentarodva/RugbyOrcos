-- ============================================================
-- Migration 69: Operational 360 Columns & RPCs (Uniforms, Activity Units, Match Availability)
-- ============================================================

ALTER TABLE public.fundraising_campaigns
  ADD COLUMN IF NOT EXISTS subtype TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS units_per_player INTEGER DEFAULT 1;

ALTER TABLE public.fundraising_assignments
  ADD COLUMN IF NOT EXISTS units_assigned INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS units_sold INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

ALTER TABLE public.future_fixtures
  ADD COLUMN IF NOT EXISTS availabilities JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS squad JSONB DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.set_match_availability(
  p_fixture_id UUID,
  p_player_id UUID,
  p_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_avail JSONB;
BEGIN
  IF p_status NOT IN ('going', 'maybe', 'not_going') THEN
    RETURN jsonb_build_object('error', 'Estado inválido');
  END IF;

  IF public.get_user_tier() > 3 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.players
      WHERE id = p_player_id
        AND (user_id = auth.uid() OR lower(COALESCE(email, '')) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    ) THEN
      RETURN jsonb_build_object('error', 'No autorizado');
    END IF;
  END IF;

  UPDATE public.future_fixtures
  SET availabilities = COALESCE(availabilities, '{}'::jsonb) || jsonb_build_object(p_player_id::text, p_status)
  WHERE id = p_fixture_id
  RETURNING availabilities INTO v_avail;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Partido programado no encontrado');
  END IF;

  RETURN jsonb_build_object('success', true, 'availabilities', v_avail);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_match_availability(UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_match_availability(UUID, UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.player_update_assignment_units(
  p_assignment_id UUID,
  p_units_sold INTEGER,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_ass RECORD;
BEGIN
  SELECT * INTO v_ass FROM public.fundraising_assignments WHERE id = p_assignment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Asignación no encontrada');
  END IF;

  IF public.get_user_tier() > 3 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.players
      WHERE id = v_ass.player_id
        AND (user_id = auth.uid() OR lower(COALESCE(email, '')) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    ) THEN
      RETURN jsonb_build_object('error', 'No autorizado');
    END IF;
  END IF;

  UPDATE public.fundraising_assignments
  SET
    units_sold = GREATEST(0, COALESCE(p_units_sold, 0)),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_assignment_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.player_update_assignment_units(UUID, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.player_update_assignment_units(UUID, INTEGER, TEXT) TO authenticated;
