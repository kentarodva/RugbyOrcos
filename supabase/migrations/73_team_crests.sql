-- 73_team_crests.sql
-- Escudos como datos: cada rival y cada clan Mak'Gora guarda la URL de su escudo.
-- Reemplaza la detección por nombre ("si contiene 'guepardo'...") del frontend.
-- Idempotente: se puede ejecutar más de una vez sin efectos secundarios.

-- 1. Columnas
ALTER TABLE rivals        ADD COLUMN IF NOT EXISTS crest_url TEXT;
ALTER TABLE makgora_teams ADD COLUMN IF NOT EXISTS crest_url TEXT;
ALTER TABLE makgora_teams ADD COLUMN IF NOT EXISTS motto     TEXT;

COMMENT ON COLUMN rivals.crest_url        IS 'URL pública del escudo (bucket crests). NULL = mostrar iniciales.';
COMMENT ON COLUMN makgora_teams.crest_url IS 'URL pública del escudo (bucket crests). NULL = mostrar iniciales.';
COMMENT ON COLUMN makgora_teams.motto     IS 'Lema de guerra del clan, mostrado en su estandarte.';

-- 2. Bucket público de lectura (2 MB, solo imágenes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('crests', 'crests', true, 2097152, ARRAY['image/png', 'image/webp', 'image/jpeg', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas: todos ven; solo staff (tier <= 3) sube, cambia o borra
DROP POLICY IF EXISTS "Escudos visibles para todos" ON storage.objects;
CREATE POLICY "Escudos visibles para todos" ON storage.objects
  FOR SELECT USING (bucket_id = 'crests');

DROP POLICY IF EXISTS "Staff sube escudos" ON storage.objects;
CREATE POLICY "Staff sube escudos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'crests' AND auth.role() = 'authenticated' AND (SELECT get_user_tier() <= 3)
  );

DROP POLICY IF EXISTS "Staff actualiza escudos" ON storage.objects;
CREATE POLICY "Staff actualiza escudos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'crests' AND auth.role() = 'authenticated' AND (SELECT get_user_tier() <= 3)
  );

DROP POLICY IF EXISTS "Staff borra escudos" ON storage.objects;
CREATE POLICY "Staff borra escudos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'crests' AND auth.role() = 'authenticated' AND (SELECT get_user_tier() <= 3)
  );
