-- 83_close_anonymous_and_player_privacy.sql
-- Antes: cualquiera SIN iniciar sesión (solo con la clave pública de la app) podía leer
-- players (teléfonos, documento, alergias, condiciones médicas, contactos de emergencia),
-- user_profiles y fixture_players. Y cualquier jugador autenticado veía la ficha completa
-- de todos (players_select USING true, que además anulaba el filtro de borrados).
--
-- Ahora:
--   * players: el staff (rango <= 3) ve a todos; cada jugador solo su propia ficha activa.
--     La app ya cargaba solo la ficha propia para los jugadores (useSync), así que no cambia nada visible.
--   * user_profiles y fixture_players: solo usuarios autenticados.
--   * anon pierde el permiso de lectura sobre esas tablas. El login por usuario usa la
--     función resolve_player_login (SECURITY DEFINER), que no depende de este permiso.

DROP POLICY IF EXISTS players_select ON public.players;
DROP POLICY IF EXISTS players_hide_deleted_select ON public.players;
CREATE POLICY players_select ON public.players
  FOR SELECT TO authenticated
  USING (
    (select COALESCE(public.get_user_tier() <= 3, false))
    OR (user_id = (select auth.uid()) AND deleted_at IS NULL)
  );

DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS fixture_players_select ON public.fixture_players;
CREATE POLICY fixture_players_select ON public.fixture_players
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.players, public.user_profiles, public.fixture_players FROM anon;
