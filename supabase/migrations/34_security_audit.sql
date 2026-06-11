-- ============================================================
-- Migration 34: Security audit — REVOKE anon, SET search_path, RLS
-- ============================================================

-- 1. REVOKE todas las funciones SECURITY DEFINER de PUBLIC (anon)
REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_user_tier() FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_create_player_credentials(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_reset_player_password(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_reset_staff_password(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_pending_treasurer_approvals() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_player_pending_sales() FROM PUBLIC;
REVOKE ALL ON FUNCTION player_report_ticket_sale(UUID, VARCHAR, VARCHAR, DATE, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION treasurer_confirm_sale(UUID, VARCHAR, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION notify_schedule_event() FROM PUBLIC;
REVOKE ALL ON FUNCTION update_standing(UUID, UUID, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_invitation_guest_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION update_push_token_timestamp() FROM PUBLIC;

-- Re-grant solo a authenticated
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

-- 2. SET search_path en funciones que faltaban
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

CREATE OR REPLACE FUNCTION treasurer_confirm_sale(
  p_ticket_id UUID, p_confirm_status VARCHAR, p_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_confirm_status = 'confirmed' THEN
    UPDATE raffle_tickets SET
      sale_status = 'sold', is_sold = true,
      sold_at = COALESCE(sold_at, now()),
      notes = CASE WHEN p_note IS NOT NULL AND p_note != '' THEN p_note ELSE notes END
    WHERE id = p_ticket_id;
  ELSIF p_confirm_status = 'rejected' THEN
    UPDATE raffle_tickets SET
      sale_status = 'rejected',
      notes = CASE WHEN p_note IS NOT NULL AND p_note != '' THEN p_note ELSE notes END
    WHERE id = p_ticket_id;
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. RLS en rugby_positions (catálogo, solo lectura)
ALTER TABLE IF EXISTS rugby_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rugby_positions_select" ON rugby_positions;
CREATE POLICY "rugby_positions_select" ON rugby_positions
  FOR SELECT TO authenticated USING (true);
