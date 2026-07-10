-- ============================================================
-- Migration 37: Fix active_team_memberships SECURITY DEFINER
-- ============================================================
-- La view active_team_memberships estaba creada con SECURITY DEFINER,
-- lo que significa que ignora RLS y corre como el owner (postgres).
-- Se cambia a SECURITY INVOKER para que respete RLS del usuario.
-- ============================================================

DROP VIEW IF EXISTS active_team_memberships CASCADE;

CREATE VIEW active_team_memberships
WITH (security_invoker = true)
AS
  SELECT
    tm.user_id,
    tm.team_category,
    tm.role,
    t.label AS team_label,
    t.club,
    t.division
  FROM team_members tm
  JOIN teams t ON t.category::text = tm.team_category::text
  WHERE tm.is_active = true;
