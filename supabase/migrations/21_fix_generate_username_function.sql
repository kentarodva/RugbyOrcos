-- Fix: generate_player_username acepta VARCHAR (como los campos de la tabla players)
-- PostgreSQL no hace matching de tipos TEXT vs VARCHAR para resolución de funciones
CREATE OR REPLACE FUNCTION generate_player_username(
  p_first_name VARCHAR, p_last_name VARCHAR, p_nickname VARCHAR DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SET search_path = 'public' AS $$
DECLARE v_base TEXT; v_username TEXT; v_counter INTEGER := 0;
BEGIN
  IF p_nickname IS NOT NULL AND p_nickname != '' THEN
    v_base := lower(regexp_replace(p_nickname, '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    v_base := lower(regexp_replace(COALESCE(p_first_name,'')||'.'||COALESCE(p_last_name,''), '[^a-zA-Z0-9.]', '', 'g'));
  END IF;
  IF length(v_base) > 40 THEN v_base := left(v_base, 40); END IF;
  IF v_base = '' OR v_base = '.' THEN v_base := 'guerrero'; END IF;
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM public.players WHERE username = v_username) LOOP
    v_counter := v_counter + 1; v_username := v_base || v_counter::TEXT;
  END LOOP;
  RETURN v_username;
END;
$$;
