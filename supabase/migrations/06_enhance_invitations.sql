-- ============================================================
-- RUGBY ORCOS NEGROS — Mejora de Invitaciones v1.0
-- Agrega FKs rival_id, guest_count, response tracking
-- ============================================================

-- 1. Agregar rival_id a future_fixtures
ALTER TABLE future_fixtures ADD COLUMN IF NOT EXISTS rival_id UUID REFERENCES rivals(id) ON DELETE SET NULL;

-- Migrar datos: buscar rivals.id por nombre en future_fixtures.opponent
UPDATE future_fixtures ff
SET rival_id = r.id
FROM rivals r
WHERE LOWER(ff.opponent) = LOWER(r.name)
  AND ff.rival_id IS NULL;

-- 2. Agregar rival_id a fixtures (consistencia)
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS rival_id UUID REFERENCES rivals(id) ON DELETE SET NULL;

UPDATE fixtures f
SET rival_id = r.id
FROM rivals r
WHERE LOWER(f.opponent) = LOWER(r.name)
  AND f.rival_id IS NULL;

-- 3. Agregar rival_id a match_invitations
ALTER TABLE match_invitations ADD COLUMN IF NOT EXISTS rival_id UUID REFERENCES rivals(id) ON DELETE SET NULL;

UPDATE match_invitations mi
SET rival_id = r.id
FROM rivals r
WHERE LOWER(mi.rival_name) = LOWER(r.name)
  AND mi.rival_id IS NULL;

-- 4. Agregar guest_count cacheado en match_invitations (se actualiza via trigger)
ALTER TABLE match_invitations ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 0;

-- 5. Agregar response tracking
ALTER TABLE match_invitations ADD COLUMN IF NOT EXISTS response VARCHAR(30) DEFAULT 'pending'
  CHECK (response IN ('pending','accepted','declined'));
ALTER TABLE match_invitations ADD COLUMN IF NOT EXISTS response_notes TEXT;
ALTER TABLE match_invitations ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- 6. Agregar notified_at para administradores
ALTER TABLE match_invitations ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- 7. Funcion para mantener actualizado guest_count
CREATE OR REPLACE FUNCTION update_invitation_guest_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE match_invitations SET guest_count = guest_count + 1 WHERE id = NEW.invitation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE match_invitations SET guest_count = GREATEST(guest_count - 1, 0) WHERE id = OLD.invitation_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger sobre guest_players para actualizar guest_count
DROP TRIGGER IF EXISTS trg_guest_count ON guest_players;
CREATE TRIGGER trg_guest_count
  AFTER INSERT OR DELETE ON guest_players
  FOR EACH ROW EXECUTE FUNCTION update_invitation_guest_count();

-- 8. Sincronizar guest_count con datos existentes
UPDATE match_invitations mi
SET guest_count = (
  SELECT COUNT(*) FROM guest_players gp WHERE gp.invitation_id = mi.id
);

-- 9. Indice para busquedas por rival_id
CREATE INDEX IF NOT EXISTS idx_ff_rival ON future_fixtures(rival_id);
CREATE INDEX IF NOT EXISTS idx_fix_rival ON fixtures(rival_id);
CREATE INDEX IF NOT EXISTS idx_inv_rival ON match_invitations(rival_id);
