-- ============================================================
-- Migration 36: Fix player_payments RLS policies
-- ============================================================
-- player_payments tenía RLS habilitado pero:
--   SELECT: cualquier authenticated podía ver TODOS los pagos
--   INSERT: cualquier authenticated podía insertar (sin with_check)
--   UPDATE: no existía
--   DELETE: solo super admins
-- ============================================================

-- Reemplazar todas las policies de player_payments
DROP POLICY IF EXISTS player_payments_select ON player_payments;
DROP POLICY IF EXISTS player_payments_insert ON player_payments;
DROP POLICY IF EXISTS player_payments_update ON player_payments;
DROP POLICY IF EXISTS player_payments_delete ON player_payments;

-- SELECT: staff (tier <= 3) ve todos; jugadores ven solo los propios
CREATE POLICY player_payments_select ON player_payments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT get_user_tier()) <= 3
    OR
    player_id IN (
      SELECT id FROM players WHERE user_id = auth.uid()
    )
  );

-- INSERT: solo staff puede registrar pagos
CREATE POLICY player_payments_insert ON player_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT get_user_tier()) <= 3
  );

-- UPDATE: solo staff puede modificar pagos
CREATE POLICY player_payments_update ON player_payments
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT get_user_tier()) <= 3
  )
  WITH CHECK (
    (SELECT get_user_tier()) <= 3
  );

-- DELETE: solo super admins (tier <= 1)
CREATE POLICY player_payments_delete ON player_payments
  FOR DELETE
  TO authenticated
  USING (
    (SELECT get_user_tier()) <= 1
  );
