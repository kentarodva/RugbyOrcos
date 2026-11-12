-- 88_payment_ledger_trigger.sql
-- Auditoría de recorridos, punto 5 (2026-11-12): 3 pagos de pro-fondos y 0 movimientos
-- en el libro de caja. La app guardaba el pago y, aparte, el movimiento con
-- `.then(() => {})`, que no detecta el { error } de Supabase. Ahora lo hace la BD:
--   * Al insertar en player_payments se crea su movimiento en finances (payment_id),
--     categoría 'mensualidad' o 'pro_fondos'. Mismo INSERT, misma transacción:
--     un pago no puede existir sin su movimiento.
--   * El abono de la asignación (fundraising_assignments.amount_paid) se suma/resta
--     en la BD, sin leer-modificar-escribir desde el teléfono.
--   * Borrar el pago borra su movimiento (FK en cascada) y borrar el movimiento
--     borra su pago.
-- Relleno: enlaza el movimiento de mensualidad que ya existía ([pid:…]) y crea los
-- movimientos que faltan. Idempotente.

CREATE OR REPLACE FUNCTION public.payment_ledger_description(p public.player_payments)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE p.source
           WHEN 'membership' THEN 'Abono Membresía'
           ELSE coalesce(
             (SELECT CASE WHEN c.name ~* '^(rifa|pro-?fondos)' THEN c.name
                          WHEN c.type = 'raffle' THEN 'Rifa ' || c.name
                          ELSE 'Pro-fondos ' || c.name END
              FROM fundraising_campaigns c WHERE c.id = p.campaign_id),
             'Pro-fondos')
         END
         || ' - ' || coalesce(
              (SELECT nullif(trim(concat_ws(' ', pl.first_name, pl.last_name)), '')
               FROM players pl WHERE pl.id = p.player_id),
              'Jugador')
         || CASE WHEN coalesce(p.notes, '') <> '' AND p.source <> 'membership'
                 THEN ' (' || p.notes || ')' ELSE '' END;
$$;

CREATE OR REPLACE FUNCTION public.payment_ledger_team(p public.player_payments)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.category FROM teams t
  WHERE t.category = coalesce(
    (SELECT c.team_category FROM fundraising_campaigns c WHERE c.id = p.campaign_id),
    (SELECT pl.team_category FROM players pl WHERE pl.id = p.player_id))
  LIMIT 1;
$$;

-- Dueño del movimiento cuando no hay sesión (relleno, SQL): la ficha, o el presidente.
CREATE OR REPLACE FUNCTION public.payment_ledger_owner(p public.player_payments)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    auth.uid(),
    (SELECT user_id FROM players WHERE id = p.player_id),
    (SELECT user_id FROM user_profiles WHERE system_role = 'presidente' AND is_active IS NOT FALSE
      ORDER BY created_at LIMIT 1));
$$;

CREATE OR REPLACE FUNCTION public.on_player_payment_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM finances WHERE payment_id = NEW.id) THEN
    INSERT INTO finances (user_id, type, descripcion, amount, date, category, team_category, payment_id)
    VALUES (payment_ledger_owner(NEW), 'ingreso', payment_ledger_description(NEW), NEW.amount, NEW.payment_date,
            CASE NEW.source WHEN 'membership' THEN 'mensualidad' ELSE 'pro_fondos' END,
            payment_ledger_team(NEW), NEW.id);
  END IF;

  IF NEW.assignment_id IS NOT NULL THEN
    UPDATE fundraising_assignments
       SET amount_paid = coalesce(amount_paid, 0) + NEW.amount, updated_at = now()
     WHERE id = NEW.assignment_id;
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.on_player_payment_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.assignment_id IS NOT NULL THEN
    UPDATE fundraising_assignments
       SET amount_paid = GREATEST(0, coalesce(amount_paid, 0) - OLD.amount), updated_at = now()
     WHERE id = OLD.assignment_id;
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.on_finance_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.payment_id IS NOT NULL THEN
    DELETE FROM player_payments WHERE id = OLD.payment_id;
  END IF;
  RETURN NULL;
END $$;

REVOKE ALL ON FUNCTION public.payment_ledger_description(public.player_payments) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payment_ledger_team(public.player_payments) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.payment_ledger_owner(public.player_payments) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_player_payment_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_player_payment_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_finance_delete() FROM PUBLIC, anon, authenticated;

-- Borrar el pago borra su movimiento (antes: SET NULL, dejaba el ingreso huérfano).
ALTER TABLE public.finances DROP CONSTRAINT IF EXISTS fk_finances_payment;
ALTER TABLE public.finances ADD CONSTRAINT fk_finances_payment
  FOREIGN KEY (payment_id) REFERENCES public.player_payments(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS finances_payment_id_key ON public.finances(payment_id) WHERE payment_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_player_payment_insert ON public.player_payments;
CREATE TRIGGER trg_player_payment_insert AFTER INSERT ON public.player_payments
  FOR EACH ROW EXECUTE FUNCTION public.on_player_payment_insert();

DROP TRIGGER IF EXISTS trg_player_payment_delete ON public.player_payments;
CREATE TRIGGER trg_player_payment_delete AFTER DELETE ON public.player_payments
  FOR EACH ROW EXECUTE FUNCTION public.on_player_payment_delete();

DROP TRIGGER IF EXISTS trg_finance_delete ON public.finances;
CREATE TRIGGER trg_finance_delete AFTER DELETE ON public.finances
  FOR EACH ROW EXECUTE FUNCTION public.on_finance_delete();

-- Relleno 1: enlazar movimientos viejos que guardaban el id en el texto [pid:…].
UPDATE public.finances f
   SET payment_id = p.id
  FROM public.player_payments p
 WHERE f.payment_id IS NULL
   AND f.descripcion LIKE '%[pid:' || p.id::text || ']%'
   AND NOT EXISTS (SELECT 1 FROM public.finances f2 WHERE f2.payment_id = p.id);

-- Relleno 2: crear el movimiento de cada pago que no tiene uno (no toca amount_paid).
INSERT INTO public.finances (user_id, type, descripcion, amount, date, category, team_category, payment_id)
SELECT public.payment_ledger_owner(p), 'ingreso', public.payment_ledger_description(p), p.amount, p.payment_date,
       CASE p.source WHEN 'membership' THEN 'mensualidad' ELSE 'pro_fondos' END,
       public.payment_ledger_team(p), p.id
  FROM public.player_payments p
 WHERE public.payment_ledger_owner(p) IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.finances f WHERE f.payment_id = p.id);
