-- 87_attendance_summary_trigger.sql
-- Auditoría de recorridos, punto 3 (2026-11-06): había 119 asistencias y 0 resúmenes.
-- La app calculaba el resumen y los burpees dentro de un setState de React y los
-- guardaba vacíos, ignorando errores. Ahora lo hace la base de datos:
--   * player_attendance_summary se recalcula desde attendance en cada cambio
--     (no puede desincronizarse).
--   * penalties.burpees se ajusta por diferencia: tarde = 15, falta injustificada = 50.
--     Cambiar un estado resta los burpees del anterior y suma los del nuevo.
--     La falta injustificada activa los conos. Los canjes (redeemPenalty) se siguen
--     restando desde la app, por eso los burpees son un saldo y no se recalculan.
-- Relleno inicial: SOLO resúmenes (derivados). No se aplican burpees retroactivos.
-- Idempotente.

CREATE OR REPLACE FUNCTION public.attendance_burpees(p_status TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_status WHEN 'late' THEN 15 WHEN 'absent_unjustified' THEN 50 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_attendance_summary(p_player UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO player_attendance_summary
    (player_id, total, present, late, absent_unjustified, absent_justified, updated_at)
  SELECT p_player,
         count(a.id),
         count(a.id) FILTER (WHERE a.status = 'present'),
         count(a.id) FILTER (WHERE a.status = 'late'),
         count(a.id) FILTER (WHERE a.status = 'absent_unjustified'),
         count(a.id) FILTER (WHERE a.status = 'absent_justified'),
         now()
  FROM players p
  LEFT JOIN attendance a ON a.player_id = p.id
  WHERE p.id = p_player          -- skips players being deleted (cascade)
  GROUP BY p.id
  ON CONFLICT (player_id) DO UPDATE SET
    total = EXCLUDED.total, present = EXCLUDED.present, late = EXCLUDED.late,
    absent_unjustified = EXCLUDED.absent_unjustified,
    absent_justified = EXCLUDED.absent_justified, updated_at = now();
$$;

CREATE OR REPLACE FUNCTION public.add_attendance_penalty(p_player UUID, p_delta INTEGER, p_cones BOOLEAN)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO penalties (player_id, burpees, cones, updated_at)
  SELECT p_player, GREATEST(0, p_delta), p_cones, now()
  WHERE EXISTS (SELECT 1 FROM players WHERE id = p_player)
  ON CONFLICT (player_id) DO UPDATE SET
    burpees = GREATEST(0, penalties.burpees + p_delta),
    cones = penalties.cones OR p_cones,
    updated_at = now();
$$;

CREATE OR REPLACE FUNCTION public.on_attendance_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  delta INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.player_id = OLD.player_id THEN
    -- Re-saving the same status (upsert overwrite) must not change burpees.
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NULL; END IF;
    PERFORM refresh_attendance_summary(NEW.player_id);
    delta := attendance_burpees(NEW.status) - attendance_burpees(OLD.status);
    IF delta <> 0 OR NEW.status = 'absent_unjustified' THEN
      PERFORM add_attendance_penalty(NEW.player_id, delta, NEW.status = 'absent_unjustified');
    END IF;
    RETURN NULL;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    PERFORM refresh_attendance_summary(OLD.player_id);
    IF attendance_burpees(OLD.status) > 0 THEN
      PERFORM add_attendance_penalty(OLD.player_id, -attendance_burpees(OLD.status), FALSE);
    END IF;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM refresh_attendance_summary(NEW.player_id);
    IF attendance_burpees(NEW.status) > 0 OR NEW.status = 'absent_unjustified' THEN
      PERFORM add_attendance_penalty(NEW.player_id, attendance_burpees(NEW.status),
                                     NEW.status = 'absent_unjustified');
    END IF;
  END IF;
  RETURN NULL;
END $$;

REVOKE ALL ON FUNCTION public.refresh_attendance_summary(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_attendance_penalty(UUID, INTEGER, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_attendance_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_attendance_change ON public.attendance;
CREATE TRIGGER trg_attendance_change
  AFTER INSERT OR UPDATE OF status, player_id OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.on_attendance_change();

-- Relleno: un resumen por cada jugador con asistencias.
SELECT public.refresh_attendance_summary(player_id)
FROM (SELECT DISTINCT player_id FROM public.attendance) s;
