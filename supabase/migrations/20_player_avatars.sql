-- Añadir columnas a players
ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT NULL;

-- Crear bucket de storage para fotos de perfil
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('player-avatars', 'player-avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier usuario autenticado puede ver avatares
DROP POLICY IF EXISTS "Avatares visibles para todos" ON storage.objects;
CREATE POLICY "Avatares visibles para todos" ON storage.objects
  FOR SELECT USING (bucket_id = 'player-avatars');

-- Política: staff puede subir avatares
DROP POLICY IF EXISTS "Staff puede subir avatares" ON storage.objects;
CREATE POLICY "Staff puede subir avatares" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'player-avatars'
    AND auth.role() = 'authenticated'
    AND (SELECT get_user_tier() <= 3)
  );

-- Política: staff puede actualizar avatares
DROP POLICY IF EXISTS "Staff puede actualizar avatares" ON storage.objects;
CREATE POLICY "Staff puede actualizar avatares" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'player-avatars'
    AND auth.role() = 'authenticated'
    AND (SELECT get_user_tier() <= 3)
  );
