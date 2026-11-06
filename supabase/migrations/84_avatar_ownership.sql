-- 84_avatar_ownership.sql
-- Antes: cualquier usuario autenticado podía subir, reemplazar o borrar la foto de cualquier jugador.
-- La app guarda cada foto como "<player_id>.webp" (usePlayerAvatar.js).
-- Ahora solo puede escribir el staff (rango <= 3) o el jugador dueño de esa ficha.

CREATE OR REPLACE FUNCTION public.is_own_player_avatar(p_object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id::text = split_part(p_object_name, '.', 1)
      AND p.user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.is_own_player_avatar(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_own_player_avatar(TEXT) TO authenticated;

DROP POLICY IF EXISTS "Autenticados pueden subir avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir avatares" ON storage.objects;
DROP POLICY IF EXISTS "Autenticados pueden actualizar avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar avatares" ON storage.objects;

DROP POLICY IF EXISTS avatars_insert_own_or_staff ON storage.objects;
CREATE POLICY avatars_insert_own_or_staff ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'player-avatars'
    AND ((select COALESCE(public.get_user_tier() <= 3, false)) OR public.is_own_player_avatar(name))
  );

DROP POLICY IF EXISTS avatars_update_own_or_staff ON storage.objects;
CREATE POLICY avatars_update_own_or_staff ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'player-avatars'
    AND ((select COALESCE(public.get_user_tier() <= 3, false)) OR public.is_own_player_avatar(name))
  )
  WITH CHECK (
    bucket_id = 'player-avatars'
    AND ((select COALESCE(public.get_user_tier() <= 3, false)) OR public.is_own_player_avatar(name))
  );

DROP POLICY IF EXISTS avatars_delete_own_or_staff ON storage.objects;
CREATE POLICY avatars_delete_own_or_staff ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'player-avatars'
    AND ((select COALESCE(public.get_user_tier() <= 3, false)) OR public.is_own_player_avatar(name))
  );
