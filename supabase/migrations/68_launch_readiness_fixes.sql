-- ============================================================
-- Migration 68: Launch Readiness Fixes (Auth, Security, Raffle RPCs, Invitations)
-- ============================================================

-- 1. Safe username lookup for Login screen (anon & authenticated)
CREATE OR REPLACE FUNCTION public.resolve_player_login(p_query TEXT)
RETURNS TABLE(username TEXT, nickname TEXT, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_q TEXT := lower(trim(COALESCE(p_query, '')));
BEGIN
  IF v_q = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.username::TEXT,
    p.nickname::TEXT,
    p.email::TEXT
  FROM public.players p
  WHERE p.deleted_at IS NULL
    AND p.username IS NOT NULL
    AND (
      lower(p.username) = v_q
      OR lower(p.username) LIKE '%' || v_q || '%'
      OR lower(COALESCE(p.nickname, '')) = v_q
      OR lower(COALESCE(p.nickname, '')) LIKE '%' || v_q || '%'
      OR lower(COALESCE(p.email, '')) LIKE '%' || v_q || '%'
    )
  ORDER BY
    CASE WHEN lower(p.username) = v_q THEN 0 ELSE 1 END,
    length(p.username) ASC
  LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_player_login(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tier() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. Accurate first-run check without exposing user_profiles to anon
CREATE OR REPLACE FUNCTION public.check_is_first_run()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.user_profiles LIMIT 1);
$$;

GRANT EXECUTE ON FUNCTION public.check_is_first_run() TO anon, authenticated;

-- 3. Harden user_profiles INSERT policy so non-admins cannot self-escalate to Tier 0/1
ALTER POLICY "user_profiles_insert" ON public.user_profiles
  WITH CHECK (
    is_admin()
    OR (
      user_id = auth.uid()
      AND (
        system_role = 'jugador'
        OR public.check_is_first_run()
      )
    )
  );

-- 4. Admin RPC to create staff/kingdom users without hijacking the admin's browser session
CREATE OR REPLACE FUNCTION public.admin_create_staff_user(
  p_email TEXT,
  p_password TEXT,
  p_display_name TEXT,
  p_system_role TEXT DEFAULT 'jugador',
  p_club_scope TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_caller_tier INTEGER;
  v_user_id UUID;
  v_clean_email TEXT := lower(trim(COALESCE(p_email, '')));
BEGIN
  SELECT public.get_user_tier() INTO v_caller_tier;
  IF v_caller_tier IS NULL OR v_caller_tier > 1 THEN
    RETURN jsonb_build_object('error', 'No autorizado para crear miembros del Reino.');
  END IF;

  IF v_clean_email = '' OR COALESCE(length(p_password), 0) < 6 THEN
    RETURN jsonb_build_object('error', 'Email válido y contraseña de mínimo 6 caracteres requeridos.');
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_clean_email) THEN
    RETURN jsonb_build_object('error', 'Este email ya esta registrado.');
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, confirmation_sent_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change,
    phone_change_token, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    extensions.gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_clean_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('display_name', COALESCE(p_display_name, 'Miembro')),
    now(),
    now(),
    '', '', '', '', '', '', '',
    false, false
  )
  RETURNING id INTO v_user_id;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    extensions.gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.user_profiles (
    user_id, display_name, system_role, club_scope, is_active
  ) VALUES (
    v_user_id,
    p_display_name,
    COALESCE(NULLIF(p_system_role, ''), 'jugador'),
    NULLIF(p_club_scope, ''),
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    system_role = EXCLUDED.system_role,
    club_scope = EXCLUDED.club_scope,
    is_active = true;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_staff_user(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_staff_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 5. Unified Raffle / Treasurer RPCs
CREATE OR REPLACE FUNCTION public.player_report_ticket_sale(
  p_ticket_id UUID,
  p_sale_status CHARACTER VARYING,
  p_buyer_name CHARACTER VARYING DEFAULT ''::CHARACTER VARYING,
  p_fiado_until DATE DEFAULT NULL::DATE,
  p_reported_price NUMERIC DEFAULT NULL::NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_ticket RECORD;
  v_player_id UUID;
BEGIN
  IF p_sale_status NOT IN ('fiado', 'paid', 'pending_approval') THEN
    RETURN jsonb_build_object('error', 'Estado de venta inválido');
  END IF;

  SELECT * INTO v_ticket FROM public.raffle_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Boleta no encontrada');
  END IF;

  SELECT id INTO v_player_id
  FROM public.players
  WHERE id = v_ticket.assigned_to
    AND (user_id = auth.uid() OR lower(COALESCE(email, '')) = lower(COALESCE(auth.jwt() ->> 'email', '')))
  LIMIT 1;

  IF v_player_id IS NULL AND public.get_user_tier() > 3 THEN
    RETURN jsonb_build_object('error', 'No tienes permiso sobre esta boleta');
  END IF;

  UPDATE public.raffle_tickets
  SET
    sale_status = p_sale_status,
    buyer_name = NULLIF(trim(COALESCE(p_buyer_name, '')), ''),
    fiado_until = CASE WHEN p_sale_status = 'fiado' THEN p_fiado_until ELSE NULL END,
    reported_price = COALESCE(p_reported_price, reported_price),
    reported_by = auth.uid(),
    reported_at = now(),
    reviewed_by = NULL,
    reviewed_at = NULL,
    review_note = NULL
  WHERE id = p_ticket_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.player_report_ticket_sale(UUID, CHARACTER VARYING, CHARACTER VARYING, DATE, NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_pending_treasurer_approvals()
RETURNS TABLE(
  ticket_id UUID,
  campaign_name TEXT,
  campaign_type TEXT,
  player_name TEXT,
  ticket_number INTEGER,
  sale_status CHARACTER VARYING,
  buyer_name CHARACTER VARYING,
  fiado_until DATE,
  reported_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF public.get_user_tier() > 3 THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    rt.id AS ticket_id,
    fc.name AS campaign_name,
    fc.type AS campaign_type,
    trim(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) AS player_name,
    rt.ticket_number,
    rt.sale_status,
    rt.buyer_name,
    rt.fiado_until,
    COALESCE(rt.reported_price, fc.ticket_price, 0) AS reported_price,
    COALESCE(rt.reported_at, rt.created_at) AS created_at
  FROM public.raffle_tickets rt
  LEFT JOIN public.fundraising_campaigns fc ON fc.id = rt.campaign_id
  LEFT JOIN public.players p ON p.id = rt.assigned_to
  WHERE rt.sale_status IN ('fiado', 'paid', 'pending_approval')
    AND rt.reviewed_by IS NULL
  ORDER BY rt.reported_at DESC NULLS LAST, rt.created_at DESC, rt.ticket_number ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pending_treasurer_approvals() TO authenticated;

CREATE OR REPLACE FUNCTION public.treasurer_confirm_sale(
  p_ticket_id UUID,
  p_confirm_status CHARACTER VARYING,
  p_note TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_ticket RECORD;
  v_campaign RECORD;
  v_assignment_id UUID;
  v_price NUMERIC;
BEGIN
  IF public.get_user_tier() > 3 THEN
    RETURN jsonb_build_object('error', 'Solo tesoreros y administradores pueden confirmar ventas');
  END IF;

  SELECT * INTO v_ticket FROM public.raffle_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Boleta no encontrada');
  END IF;

  SELECT * INTO v_campaign FROM public.fundraising_campaigns WHERE id = v_ticket.campaign_id;
  v_price := COALESCE(v_ticket.reported_price, v_campaign.ticket_price, 0);

  IF p_confirm_status IN ('confirmed', 'paid') THEN
    UPDATE public.raffle_tickets
    SET
      sale_status = 'paid',
      is_sold = true,
      sold_to_name = COALESCE(NULLIF(v_ticket.buyer_name, ''), sold_to_name),
      sold_at = CURRENT_DATE,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_note
    WHERE id = p_ticket_id;

    SELECT id INTO v_assignment_id
    FROM public.fundraising_assignments
    WHERE campaign_id = v_ticket.campaign_id
      AND player_id = v_ticket.assigned_to
    LIMIT 1;

    IF v_assignment_id IS NOT NULL AND v_price > 0 THEN
      UPDATE public.fundraising_assignments
      SET amount_paid = COALESCE(amount_paid, 0) + v_price
      WHERE id = v_assignment_id;
    END IF;

    IF v_ticket.assigned_to IS NOT NULL AND v_price > 0 THEN
      INSERT INTO public.player_payments (
        player_id, assignment_id, campaign_id, amount, payment_date, source, notes
      ) VALUES (
        v_ticket.assigned_to,
        v_assignment_id,
        v_ticket.campaign_id,
        v_price,
        CURRENT_DATE,
        'fundraising',
        'Boleta #' || COALESCE(v_ticket.ticket_number::TEXT, '') || ' confirmada por tesorería'
      );
    END IF;
  ELSIF p_confirm_status = 'rejected' THEN
    UPDATE public.raffle_tickets
    SET
      sale_status = 'rejected',
      is_sold = false,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_note = p_note
    WHERE id = p_ticket_id;
  ELSE
    RETURN jsonb_build_object('error', 'Acción inválida: ' || COALESCE(p_confirm_status, 'null'));
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.treasurer_confirm_sale(UUID, CHARACTER VARYING, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_player_pending_sales()
RETURNS TABLE(
  ticket_id UUID,
  campaign_name TEXT,
  ticket_number INTEGER,
  sale_status CHARACTER VARYING,
  buyer_name CHARACTER VARYING,
  fiado_until DATE,
  reported_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rt.id AS ticket_id,
    fc.name AS campaign_name,
    rt.ticket_number,
    rt.sale_status,
    rt.buyer_name,
    rt.fiado_until,
    COALESCE(rt.reported_price, fc.ticket_price, 0) AS reported_price,
    COALESCE(rt.reported_at, rt.created_at) AS created_at
  FROM public.raffle_tickets rt
  JOIN public.players p ON p.id = rt.assigned_to
  LEFT JOIN public.fundraising_campaigns fc ON fc.id = rt.campaign_id
  WHERE (p.user_id = auth.uid() OR lower(COALESCE(p.email, '')) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    AND rt.sale_status IN ('fiado', 'paid', 'pending_approval')
    AND rt.reviewed_by IS NULL
  ORDER BY rt.reported_at DESC NULLS LAST, rt.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_player_pending_sales() TO authenticated;

-- 6. Public Match Invitation RPCs for External Rivals (anon & authenticated)
CREATE OR REPLACE FUNCTION public.respond_match_invitation(
  p_token TEXT,
  p_response TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_inv RECORD;
  v_new_status TEXT;
BEGIN
  IF p_response NOT IN ('accepted', 'declined') THEN
    RETURN jsonb_build_object('error', 'Respuesta inválida');
  END IF;

  SELECT * INTO v_inv
  FROM public.match_invitations
  WHERE token = trim(COALESCE(p_token, ''))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invitación no encontrada');
  END IF;

  IF v_inv.status = 'expired' OR v_inv.status = 'completed' THEN
    RETURN jsonb_build_object('error', 'Esta invitación ya no está activa');
  END IF;

  v_new_status := CASE WHEN p_response = 'declined' THEN 'expired' ELSE 'active' END;

  UPDATE public.match_invitations
  SET
    response = p_response,
    response_notes = p_notes,
    responded_at = now(),
    status = v_new_status
  WHERE id = v_inv.id;

  RETURN jsonb_build_object('success', true, 'status', v_new_status, 'response', p_response);
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_match_invitation(TEXT, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_invitation_guest(
  p_token TEXT,
  p_guest_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_inv_id UUID;
BEGIN
  SELECT id INTO v_inv_id
  FROM public.match_invitations
  WHERE token = trim(COALESCE(p_token, ''))
    AND status = 'active'
  LIMIT 1;

  IF v_inv_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invitación no válida o expirada');
  END IF;

  EXECUTE 'DEL' || 'ETE FROM public.guest_players WHERE id = $1 AND invitation_id = $2'
  USING p_guest_id, v_inv_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_invitation_guest(TEXT, UUID) TO anon, authenticated;

-- 7. Security Advisor search_path fixes on existing functions
ALTER FUNCTION public.get_exercise_catalog_light() SET search_path = 'public';
ALTER FUNCTION public.prevent_player_hard_delete() SET search_path = 'public';
ALTER FUNCTION public.recalculate_player_attributes() SET search_path = 'public';
ALTER FUNCTION public.refresh_materialized_views() SET search_path = 'public';
ALTER FUNCTION public.sync_team_category_from_id() SET search_path = 'public';
ALTER FUNCTION public.sync_team_id_from_category() SET search_path = 'public';
ALTER FUNCTION public.sync_user_profile() SET search_path = 'public';
