-- 70_add_membership_columns.sql
-- Agrega columnas de membresia a la tabla players para persistir datos
-- que antes solo existian en memoria (se perdian al recargar)

ALTER TABLE players ADD COLUMN IF NOT EXISTS memberships_paid NUMERIC DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS memberships_due NUMERIC DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC;
