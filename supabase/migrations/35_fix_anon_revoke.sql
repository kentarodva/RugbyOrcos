-- ============================================================
-- Migration 35: Fix anon REVOKE — explicit REVOKE FROM anon
-- ============================================================
-- Las migrations 29 y 34 hicieron REVOKE FROM PUBLIC, pero las
-- funciones tenían grants DIRECTOS al rol anon (no heredados de
-- PUBLIC). Esto no removió el permiso: anon seguía pudiendo
-- ejecutar funciones SECURITY DEFINER.
-- ============================================================

-- 1. REVOKE explícito del rol anon (además de PUBLIC)
REVOKE ALL ON FUNCTION is_admin() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION get_user_tier() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION admin_create_player_credentials(UUID, TEXT) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION admin_reset_player_password(UUID, TEXT) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION admin_reset_staff_password(UUID, TEXT) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION get_pending_treasurer_approvals() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION get_player_pending_sales() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION player_report_ticket_sale(UUID, VARCHAR, VARCHAR, DATE, NUMERIC) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION treasurer_confirm_sale(UUID, VARCHAR, TEXT) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION notify_schedule_event() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION update_standing(UUID, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION update_invitation_guest_count() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION update_push_token_timestamp() FROM anon, PUBLIC;

-- 2. Re-grant explícito solo a authenticated
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tier() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_player_credentials(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_player_password(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_staff_password(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_treasurer_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_pending_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION player_report_ticket_sale(UUID, VARCHAR, VARCHAR, DATE, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION treasurer_confirm_sale(UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_schedule_event() TO authenticated;
GRANT EXECUTE ON FUNCTION update_standing(UUID, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_invitation_guest_count() TO authenticated;
GRANT EXECUTE ON FUNCTION update_push_token_timestamp() TO authenticated;

-- 3. SET search_path en funciones que lo mostraban como mutable
CREATE OR REPLACE FUNCTION get_player_pending_sales()
RETURNS TABLE(
  ticket_id UUID, campaign_name TEXT, ticket_number INTEGER,
  sale_status VARCHAR, buyer_name VARCHAR, fiado_until DATE,
  reported_price NUMERIC, created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    rt.id, fc.name, rt.ticket_number,
    rt.sale_status, rt.buyer_name,
    rt.fiado_until, rt.reported_price, rt.created_at
  FROM raffle_tickets rt
  JOIN fundraising_campaigns fc ON fc.id = rt.campaign_id
  JOIN fundraising_assignments fa ON fa.campaign_id = rt.campaign_id AND fa.player_id = rt.assigned_to
  WHERE rt.assigned_to = auth.uid()
  ORDER BY rt.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_pending_treasurer_approvals()
RETURNS TABLE(
  ticket_id UUID, campaign_name TEXT, campaign_type TEXT,
  player_name TEXT, ticket_number INTEGER, sale_status VARCHAR,
  buyer_name VARCHAR, fiado_until DATE, reported_price NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    rt.id, fc.name, fc.type,
    p.first_name || ' ' || p.last_name,
    rt.ticket_number, rt.sale_status,
    rt.buyer_name, rt.fiado_until,
    rt.reported_price, rt.created_at
  FROM raffle_tickets rt
  JOIN fundraising_assignments fa ON fa.campaign_id = rt.campaign_id AND fa.player_id = rt.assigned_to
  JOIN fundraising_campaigns fc ON fc.id = rt.campaign_id
  JOIN players p ON p.id = rt.assigned_to
  WHERE rt.sale_status = 'pending_approval'
  ORDER BY rt.created_at DESC;
$$;

-- 4. Actualizar notify_schedule_event con SET search_path
CREATE OR REPLACE FUNCTION notify_schedule_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://qtvmqlbjcotvbzuwanjs.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := json_build_object(
      'title', 'Nuevo evento: ' || NEW.title,
      'body', NEW.date || ' ' || COALESCE(NEW.time, '') || ' - ' || COALESCE(NEW.location, ''),
      'filters', json_build_object('team_category', NEW.team_category)
    )::text
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_schedule_event error: %', SQLERRM;
  RETURN NEW;
END;
$$;
