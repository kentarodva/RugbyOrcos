-- ============================================================
-- Migration 29: Security audit fixes + club_settings restriction
-- ============================================================
-- Aplica en orden:
--   1. Activar RLS en user_profiles
--   2. REVOKE funciones SECURITY DEFINER de PUBLIC (anon)
--   3. Eliminar push_tokens_test
--   4. UNIQUE en wellness_logs
--   5. SET search_path en funciones críticas
--   6. Restringir SELECT en club_settings a staff
-- ============================================================

-- ============================================================
-- 1.1 Activar RLS en user_profiles
-- ============================================================
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1.2 REVOKE funciones SECURITY DEFINER de PUBLIC (anon)
-- ============================================================
REVOKE ALL ON FUNCTION admin_create_player_credentials(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_reset_player_password(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_reset_staff_password(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_pending_treasurer_approvals() FROM PUBLIC;
REVOKE ALL ON FUNCTION get_player_pending_sales() FROM PUBLIC;
REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION player_report_ticket_sale(uuid, varchar, varchar, date, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION treasurer_confirm_sale(uuid, varchar, text) FROM PUBLIC;

-- Grant solo a authenticated
GRANT EXECUTE ON FUNCTION admin_create_player_credentials(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_player_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reset_staff_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_treasurer_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_pending_sales() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION player_report_ticket_sale(uuid, varchar, varchar, date, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION treasurer_confirm_sale(uuid, varchar, text) TO authenticated;

-- ============================================================
-- 1.3 Eliminar tabla de prueba expuesta
-- ============================================================
DROP TABLE IF EXISTS push_tokens_test;

-- ============================================================
-- 1.4 UNIQUE en wellness_logs (evita duplicados)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wellness_logs_player_date_unique'
    AND conrelid = 'wellness_logs'::regclass
  ) THEN
    ALTER TABLE wellness_logs
    ADD CONSTRAINT wellness_logs_player_date_unique
    UNIQUE (player_id, log_date);
  END IF;
END;
$$;

-- ============================================================
-- 1.5 SET search_path en funciones SECURITY DEFINER críticas
-- ============================================================

-- admin_create_player_credentials
CREATE OR REPLACE FUNCTION admin_create_player_credentials(
  p_player_id UUID,
  p_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_player RECORD;
  v_base TEXT; v_username TEXT; v_counter INTEGER := 0;
  v_email TEXT; v_user_id UUID; v_password TEXT;
  v_last TEXT;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;

  v_last := COALESCE(NULLIF(split_part(v_player.last_name, ' ', 2), ''), split_part(v_player.last_name, ' ', 1));
  v_base := regexp_replace(lower(COALESCE(NULLIF(v_player.nickname,''), split_part(v_player.first_name, ' ', 1)||'.'||v_last)), '[^a-z0-9.]', '', 'g');
  IF length(v_base) > 40 THEN v_base := left(v_base, 40); END IF;
  IF v_base = '' OR v_base = '.' THEN v_base := 'guerrero'; END IF;
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM players WHERE username = v_username AND id != p_player_id) LOOP
    v_counter := v_counter + 1; v_username := v_base || v_counter::TEXT;
  END LOOP;

  v_email := v_username || '@orcos.club';
  v_password := upper(substr(md5(random()::TEXT), 1, 4)) || substr(md5(random()::TEXT), 1, 4);

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email AND deleted_at IS NULL) THEN
    UPDATE auth.users SET
      encrypted_password = crypt(v_password, gen_salt('bf')),
      raw_user_meta_data = jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
      updated_at = now()
    WHERE email = v_email AND deleted_at IS NULL
    RETURNING id INTO v_user_id;
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'temp_password', true),
      now(), now()
    ) RETURNING id INTO v_user_id;
  END IF;

  UPDATE players SET username = v_username, email = v_email, user_id = v_user_id WHERE id = p_player_id;

  INSERT INTO user_profiles (user_id, display_name, system_role, club_scope)
  VALUES (v_user_id, COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'), 'jugador', v_player.team_category)
  ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name, system_role = EXCLUDED.system_role, club_scope = EXCLUDED.club_scope;

  RETURN jsonb_build_object('success', true, 'username', v_username, 'email', v_email, 'password', v_password);
END;
$$;

-- admin_reset_player_password
CREATE OR REPLACE FUNCTION admin_reset_player_password(
  p_player_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE v_player RECORD; v_email TEXT;
BEGIN
  SELECT * INTO v_player FROM players WHERE id = p_player_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Jugador no encontrado'); END IF;
  IF v_player.email IS NULL THEN RETURN jsonb_build_object('error', 'No tiene credenciales.'); END IF;

  UPDATE auth.users SET
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    raw_user_meta_data = jsonb_build_object(
      'display_name', COALESCE(v_player.first_name || ' ' || v_player.last_name, 'Guerrero'),
      'temp_password', true
    ),
    updated_at = now()
  WHERE email = v_player.email;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- admin_reset_staff_password (ya tiene search_path pero mejoramos)
CREATE OR REPLACE FUNCTION admin_reset_staff_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Usuario no encontrado'); END IF;
  UPDATE auth.users SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now() WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- get_pending_treasurer_approvals
CREATE OR REPLACE FUNCTION get_pending_treasurer_approvals()
RETURNS TABLE(
  ticket_id UUID,
  campaign_name TEXT,
  campaign_type TEXT,
  player_name TEXT,
  ticket_number INTEGER,
  sale_status VARCHAR,
  buyer_name VARCHAR,
  fiado_until DATE,
  reported_price NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    rt.id,
    fc.name,
    fc.type,
    p.first_name || ' ' || p.last_name,
    rt.ticket_number,
    rt.sale_status,
    rt.buyer_name,
    rt.fiado_until,
    rt.reported_price,
    rt.created_at
  FROM raffle_tickets rt
  JOIN fundraising_assignments fa ON fa.campaign_id = rt.campaign_id AND fa.player_id = rt.assigned_to
  JOIN fundraising_campaigns fc ON fc.id = rt.campaign_id
  JOIN players p ON p.id = rt.assigned_to
  WHERE rt.sale_status = 'pending_approval'
  ORDER BY rt.created_at DESC;
$$;

-- get_player_pending_sales
CREATE OR REPLACE FUNCTION get_player_pending_sales()
RETURNS TABLE(
  ticket_id UUID,
  campaign_name TEXT,
  ticket_number INTEGER,
  sale_status VARCHAR,
  buyer_name VARCHAR,
  fiado_until DATE,
  reported_price NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    rt.id,
    fc.name,
    rt.ticket_number,
    rt.sale_status,
    rt.buyer_name,
    rt.fiado_until,
    rt.reported_price,
    rt.created_at
  FROM raffle_tickets rt
  JOIN fundraising_campaigns fc ON fc.id = rt.campaign_id
  JOIN fundraising_assignments fa ON fa.campaign_id = rt.campaign_id AND fa.player_id = rt.assigned_to
  WHERE rt.assigned_to = auth.uid()
  ORDER BY rt.created_at DESC;
$$;

-- is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND system_role IN ('desarrollador','presidente','promotor')
    AND is_active = true
  );
$$;

-- player_report_ticket_sale
DROP FUNCTION IF EXISTS player_report_ticket_sale(uuid, varchar, varchar, date, numeric);
CREATE OR REPLACE FUNCTION player_report_ticket_sale(
  p_ticket_id UUID,
  p_sale_status VARCHAR,
  p_buyer_name VARCHAR DEFAULT '',
  p_fiado_until DATE DEFAULT NULL,
  p_reported_price NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_status VARCHAR;
  v_assigned UUID;
  v_updated INT;
  v_player_ids UUID[];
BEGIN
  SELECT array_agg(id) INTO v_player_ids FROM players WHERE user_id = auth.uid();

  SELECT sale_status, assigned_to INTO v_current_status, v_assigned
  FROM raffle_tickets WHERE id = p_ticket_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('error', 'Ticket no encontrado.');
  END IF;

  IF NOT (v_assigned = ANY(v_player_ids)) THEN
    RETURN jsonb_build_object('error', 'Ticket no está asignado a ti.');
  END IF;

  IF v_current_status = 'paid' OR v_current_status = 'sold' THEN
    RETURN jsonb_build_object('error', 'Ticket ya fue vendido o reportado como pagado.');
  END IF;

  UPDATE raffle_tickets SET
    sale_status = p_sale_status,
    buyer_name = p_buyer_name,
    fiado_until = p_fiado_until,
    reported_price = p_reported_price,
    sold_at = CASE WHEN p_sale_status IN ('paid', 'sold') THEN now() ELSE sold_at END
  WHERE id = p_ticket_id
    AND assigned_to = ANY(v_player_ids)
    AND sale_status NOT IN ('paid', 'sold');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('error', 'No se pudo actualizar el ticket. Intenta de nuevo.');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- treasurer_confirm_sale
CREATE OR REPLACE FUNCTION treasurer_confirm_sale(
  p_ticket_id UUID,
  p_confirm_status VARCHAR,
  p_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_confirm_status = 'confirmed' THEN
    UPDATE raffle_tickets SET
      sale_status = 'sold',
      is_sold = true,
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

-- ============================================================
-- 1.6 Restringir SELECT en club_settings a staff solamente
-- ============================================================
DROP POLICY IF EXISTS club_settings_select ON club_settings;
CREATE POLICY club_settings_select ON club_settings
  FOR SELECT
  TO authenticated
  USING (
    (SELECT get_user_tier()) <= 3
  );

-- ============================================================
-- Notify: ya no se puede usar net.http_post directamente
-- porque la función no tiene search_path. Agregamos.
-- ============================================================
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
