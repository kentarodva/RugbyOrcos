-- ============================================================
-- FASE 4: Acceso de Guerreros + Username + Auto-generacion
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar username a players (UNIQUE)
ALTER TABLE players ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE players ADD CONSTRAINT players_username_unique UNIQUE (username);

-- 2. Agregar email_interno (para jugadores sin email real, se usa este en auth.users)
--    Esto NO se agrega como columna, se deriva del player id.
--    El email para auth sera: player-{shortened_uuid}@orcos.local

-- 3. Funcion para generar username unico a partir del nombre
CREATE OR REPLACE FUNCTION generate_player_username(
  p_first_name TEXT,
  p_last_name TEXT,
  p_nickname TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_base TEXT;
  v_username TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Usar nickname si existe, sino nombre+apellido
  IF p_nickname IS NOT NULL AND p_nickname != '' THEN
    v_base := lower(regexp_replace(p_nickname, '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    v_base := lower(
      regexp_replace(
        COALESCE(p_first_name, '') || '.' || COALESCE(p_last_name, ''),
        '[^a-zA-Z0-9.]', '', 'g'
      )
    );
  END IF;

  -- Acortar si es muy largo
  IF length(v_base) > 40 THEN
    v_base := left(v_base, 40);
  END IF;

  -- Si esta vacio, usar un default
  IF v_base = '' OR v_base = '.' THEN
    v_base := 'guerrero';
  END IF;

  v_username := v_base;

  -- Buscar colisiones
  WHILE EXISTS (SELECT 1 FROM players WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_base || v_counter::TEXT;
  END LOOP;

  RETURN v_username;
END;
$$;

-- 4. Seed: generar usernames para jugadores existentes que no tengan
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, first_name, last_name, nickname FROM players WHERE username IS NULL LOOP
    UPDATE players SET username = generate_player_username(r.first_name, r.last_name, r.nickname)
    WHERE id = r.id;
  END LOOP;
END;
$$;
