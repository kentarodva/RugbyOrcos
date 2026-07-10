-- 1. Backfill: calcular atributos para jugadores existentes
-- Usamos la misma lógica de calculateAttributes() del frontend
-- pero en SQL (simplificada por posición)

-- Primero reset atributos a default basado en posición
UPDATE players SET
  attr_force = CASE
    WHEN position IN ('Pilar', 'Talonador', 'Segunda Linea', 'Flanker', 'Octavo') THEN 70
    WHEN position IN ('Medio Mele', 'Apertura', 'Centro', 'Ala', 'Zaguero') THEN 45
    ELSE 50
  END,
  attr_speed = CASE
    WHEN position IN ('Pilar', 'Talonador', 'Segunda Linea') THEN 35
    WHEN position IN ('Flanker', 'Octavo') THEN 57
    WHEN position IN ('Medio Mele', 'Apertura', 'Ala', 'Zaguero') THEN 80
    WHEN position = 'Centro' THEN 70
    ELSE 50
  END,
  attr_stamina = CASE
    WHEN position IN ('Pilar', 'Talonador', 'Segunda Linea') THEN 55
    WHEN position IN ('Flanker', 'Octavo') THEN 71
    WHEN position IN ('Medio Mele', 'Apertura', 'Zaguero') THEN 70
    WHEN position = 'Centro' THEN 65
    WHEN position = 'Ala' THEN 60
    ELSE 55
  END,
  attr_technique = CASE
    WHEN position IN ('Medio Mele') THEN 85
    WHEN position IN ('Apertura') THEN 80
    WHEN position IN ('Zaguero') THEN 70
    WHEN position IN ('Centro') THEN 65
    WHEN position IN ('Ala') THEN 55
    WHEN position IN ('Pilar', 'Talonador') THEN 40
    WHEN position IN ('Segunda Linea', 'Flanker', 'Octavo') THEN 48
    ELSE 50
  END
WHERE position IS NOT NULL AND position != '';

-- 2. Unificar match_stats y tournament_player_stats
-- Crear columna context si no existe en tournament_player_stats
ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS context VARCHAR(20) NOT NULL DEFAULT 'makgora'
  CHECK (context IN ('general','makgora'));

ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS match_date DATE;
ALTER TABLE tournament_player_stats ADD COLUMN IF NOT EXISTS opponent VARCHAR(100);

-- 3. Trigger: recalcular atributos cuando cambia peso/posición
CREATE OR REPLACE FUNCTION recalculate_player_attributes()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo recalcular si cambiaron campos relevantes
  IF OLD.position IS DISTINCT FROM NEW.position
     OR OLD.weight_kg IS DISTINCT FROM NEW.weight_kg
     OR OLD.height_m IS DISTINCT FROM NEW.height_m
     OR OLD.gym_squat IS DISTINCT FROM NEW.gym_squat
     OR OLD.gym_bench IS DISTINCT FROM NEW.gym_bench
     OR OLD.gym_deadlift IS DISTINCT FROM NEW.gym_deadlift THEN
    NEW.attr_force = 50;
    NEW.attr_speed = 50;
    NEW.attr_stamina = 50;
    NEW.attr_technique = 50;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_attributes ON players;
CREATE TRIGGER trg_recalculate_attributes
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_player_attributes();
