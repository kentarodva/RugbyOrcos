-- 92_membership_charges.sql
-- Auditoría de recorridos, punto 10 (2026-11-12): el estado de cuotas no entendía de
-- meses. "Al día" comparaba todo lo pagado en la historia contra UNA cuota (en
-- producción nadie tenía cobros: memberships_due = 0 para todos), así que quien pagó
-- una vez quedaba al día para siempre. Además el teléfono sumaba a mano
-- memberships_paid/due (leer-modificar-escribir: dos tesoreros se pisaban).
--
--   * membership_charges: un cobro por jugador y mes (UNIQUE): cobrar dos veces el
--     mismo mes no suma dos veces.
--   * apply_monthly_charge(): el "Cobro mensual" de Tesorería, con la cuota configurada
--     del club (club_config.mensualidad_base) y solo para tesorero/presidente.
--   * players.memberships_due / memberships_paid los mantiene la BD (suma de cobros y
--     de pagos de mensualidad). Saldo = pagado - debido.
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.membership_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  period DATE NOT NULL CHECK (period = date_trunc('month', period)::date),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, period)
);
CREATE INDEX IF NOT EXISTS membership_charges_player_idx ON public.membership_charges(player_id);

ALTER TABLE public.membership_charges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS membership_charges_select ON public.membership_charges;
CREATE POLICY membership_charges_select ON public.membership_charges FOR SELECT TO authenticated
  USING ((SELECT coalesce(get_user_tier(), 4) <= 3) OR player_id = (SELECT current_player_id()));
DROP POLICY IF EXISTS membership_charges_delete ON public.membership_charges;
CREATE POLICY membership_charges_delete ON public.membership_charges FOR DELETE TO authenticated
  USING ((SELECT is_admin()) OR (SELECT has_club_role('{tesorero}'::text[])));
-- Sin INSERT/UPDATE directo: se cobra con apply_monthly_charge().

-- Totales cacheados en players (los lee toda la app).
CREATE OR REPLACE FUNCTION public.refresh_membership_totals(p_player UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE players SET
    memberships_due  = coalesce((SELECT sum(amount) FROM membership_charges WHERE player_id = p_player), 0),
    memberships_paid = coalesce((SELECT sum(amount) FROM player_payments
                                 WHERE player_id = p_player AND source = 'membership'), 0),
    last_payment_date = (SELECT max(payment_date) FROM player_payments
                         WHERE player_id = p_player AND source = 'membership'),
    last_payment_amount = (SELECT amount FROM player_payments
                           WHERE player_id = p_player AND source = 'membership'
                           ORDER BY payment_date DESC, created_at DESC LIMIT 1)
  WHERE id = p_player;
$$;

CREATE OR REPLACE FUNCTION public.on_membership_money_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN PERFORM refresh_membership_totals(OLD.player_id); END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN PERFORM refresh_membership_totals(NEW.player_id); END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_membership_charges_totals ON public.membership_charges;
CREATE TRIGGER trg_membership_charges_totals AFTER INSERT OR UPDATE OR DELETE ON public.membership_charges
  FOR EACH ROW EXECUTE FUNCTION public.on_membership_money_change();

DROP TRIGGER IF EXISTS trg_player_payments_totals ON public.player_payments;
CREATE TRIGGER trg_player_payments_totals AFTER INSERT OR UPDATE OR DELETE ON public.player_payments
  FOR EACH ROW EXECUTE FUNCTION public.on_membership_money_change();

-- Cobro mensual. Devuelve cuántos jugadores quedaron cobrados (los ya cobrados ese mes no cuentan).
CREATE OR REPLACE FUNCTION public.apply_monthly_charge(p_player_ids UUID[], p_period DATE DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period DATE := date_trunc('month', coalesce(p_period, (now() AT TIME ZONE 'America/Bogota')::date))::date;
  v_count INTEGER;
BEGIN
  IF NOT ((SELECT is_admin()) OR (SELECT has_club_role('{tesorero}'::text[]))) THEN
    RAISE EXCEPTION 'Solo tesorería o presidencia pueden cobrar mensualidades' USING ERRCODE = '42501';
  END IF;

  INSERT INTO membership_charges (player_id, period, amount, created_by)
  SELECT p.id, v_period,
         coalesce(
           (SELECT nullif(regexp_replace(c.value, '[^0-9.]', '', 'g'), '')::numeric
              FROM club_config c WHERE c.key = 'mensualidad_base' AND c.team_category = p.team_category LIMIT 1),
           (SELECT nullif(regexp_replace(c.value, '[^0-9.]', '', 'g'), '')::numeric
              FROM club_config c WHERE c.key = 'mensualidad_base' ORDER BY c.updated_at DESC NULLS LAST LIMIT 1),
           10000),
         auth.uid()
  FROM players p
  WHERE p.id = ANY (p_player_ids) AND p.deleted_at IS NULL
  ON CONFLICT (player_id, period) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION public.refresh_membership_totals(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_membership_money_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_monthly_charge(UUID[], DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_monthly_charge(UUID[], DATE) TO authenticated;

-- Tiempo real (como la migración 89).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'membership_charges') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.membership_charges;
  END IF;
END $$;

-- Relleno: recalcular los totales desde los pagos reales (corrige sumas hechas a mano).
SELECT public.refresh_membership_totals(id) FROM public.players;
