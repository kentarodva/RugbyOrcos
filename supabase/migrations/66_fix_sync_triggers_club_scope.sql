-- ============================================================
-- 66_fix_sync_triggers_club_scope.sql
-- Corrige las funciones sync_team_id_from_category() y
-- sync_team_category_from_id() para que funcionen tambien
-- en la tabla user_profiles (que usa club_scope en vez de
-- team_category).
--
-- Bug: las funciones originales solo accedian NEW.team_category,
-- pero user_profiles no tiene esa columna. Al ejecutarse el
-- trigger trg_sync_user_profile en cascada, la transaccion
-- completa hacia rollback (POST 400 en /players).
-- ============================================================

-- sync_team_id_from_category: soporta team_category (la mayoria de tablas) y club_scope (user_profiles)
CREATE OR REPLACE FUNCTION sync_team_id_from_category() RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'user_profiles' THEN
    IF NEW.club_scope IS NOT NULL THEN
      NEW.team_id = (SELECT id FROM teams WHERE category = NEW.club_scope);
    END IF;
  ELSE
    IF NEW.team_category IS NOT NULL THEN
      NEW.team_id = (SELECT id FROM teams WHERE category = NEW.team_category);
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- sync_team_category_from_id: soporta team_category y club_scope
CREATE OR REPLACE FUNCTION sync_team_category_from_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    IF TG_TABLE_NAME = 'user_profiles' THEN
      NEW.club_scope = (SELECT category FROM teams WHERE id = NEW.team_id);
    ELSE
      NEW.team_category = (SELECT category FROM teams WHERE id = NEW.team_id);
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
