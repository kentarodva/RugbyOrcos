-- 69_fix_player_avatar_policies.sql
-- Arregla las politicas RLS del bucket player-avatars para que:
-- 1. Cualquier usuario autenticado pueda subir su foto (antes solo staff)
-- 2. Cualquier usuario autenticado pueda actualizar su foto
-- 3. Exista politica DELETE (antes no existia)

-- Reemplazar INSERT policy (ampliar de staff a cualquier authenticated)
DROP POLICY IF EXISTS "Staff puede subir avatares" ON storage.objects;
CREATE POLICY "Usuarios pueden subir avatares" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'player-avatars'
    AND auth.role() = 'authenticated'
  );

-- Reemplazar UPDATE policy
DROP POLICY IF EXISTS "Staff puede actualizar avatares" ON storage.objects;
CREATE POLICY "Usuarios pueden actualizar avatares" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'player-avatars'
    AND auth.role() = 'authenticated'
  );

-- Agregar DELETE policy (faltaba)
CREATE POLICY "Usuarios pueden eliminar avatares" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'player-avatars'
    AND auth.role() = 'authenticated'
  );
