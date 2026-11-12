-- 91_players_created_by.sql
-- Auditoría de recorridos, punto 7 (2026-11-12): players.user_id tenía dos significados.
-- Al crear una ficha se guardaba el id de QUIEN LA CREA; al generar credenciales se
-- reemplazaba por la cuenta del jugador. En producción 58 de 60 fichas tenían como
-- user_id al presidente, así que "Mi Ficha" le mostraba al staff una ficha ajena y
-- las políticas trataban al creador como dueño.
--
--   * players.created_by: quién creó la ficha (lo pone la BD).
--   * players.user_id: SOLO la cuenta del jugador (NULL hasta que tenga credenciales).
--   * current_player_id(): la ficha del usuario que pregunta.
-- Relleno: las fichas cuyo user_id es de un staff pasan a created_by, salvo la ficha
-- propia de ese staff (mismo email o mismo nombre que su perfil). Idempotente.

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS players_created_by_idx ON public.players(created_by);

CREATE OR REPLACE FUNCTION public.players_set_created_by()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.created_by := coalesce(NEW.created_by, auth.uid());
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.players_set_created_by() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_players_created_by ON public.players;
CREATE TRIGGER trg_players_created_by BEFORE INSERT ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.players_set_created_by();

-- El staff que crea fichas (tier <= 3) puede crearlas y editarlas sin ser su "dueño".
DROP POLICY IF EXISTS players_creator_insert ON public.players;
CREATE POLICY players_creator_insert ON public.players FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()) AND (SELECT coalesce(get_user_tier(), 4) <= 3));
DROP POLICY IF EXISTS players_creator_update ON public.players;
CREATE POLICY players_creator_update ON public.players FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid()) AND (SELECT coalesce(get_user_tier(), 4) <= 3))
  WITH CHECK (created_by = (SELECT auth.uid()) AND (SELECT coalesce(get_user_tier(), 4) <= 3));

-- La ficha del usuario actual (una sola regla para todas las pantallas).
CREATE OR REPLACE FUNCTION public.current_player_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM players
  WHERE user_id = auth.uid() AND deleted_at IS NULL
  ORDER BY (username IS NOT NULL AND username <> '') DESC, created_at
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.current_player_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_player_id() TO authenticated;

-- Relleno: separar creador y dueño.
UPDATE public.players p
   SET created_by = coalesce(p.created_by, p.user_id),
       user_id = NULL
  FROM public.user_profiles up
  LEFT JOIN auth.users au ON au.id = up.user_id
 WHERE up.user_id = p.user_id
   AND up.system_role <> 'jugador'
   AND NOT (
     (p.email IS NOT NULL AND au.email IS NOT NULL AND lower(p.email) = lower(au.email))
     OR lower(trim(concat_ws(' ', p.first_name, p.last_name))) = lower(trim(coalesce(up.display_name, '')))
   );
