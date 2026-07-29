-- 71_exercise_dataset_columns.sql
-- Expande exercise_catalog para soportar el dataset de 1,324 ejercicios
-- con GIFs, instrucciones multi-idioma, targeting muscular y metadata

ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS gif_url TEXT;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS instructions JSONB DEFAULT '{}';
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS muscle_group TEXT;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS secondary_muscles JSONB DEFAULT '[]';
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS target_muscle TEXT;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS force_type VARCHAR(30);
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS body_weight BOOLEAN DEFAULT false;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'manual';

-- Re-crear CHECK constraint (necesario porque la migracion 59 expandio las categorias)
ALTER TABLE exercise_catalog DROP CONSTRAINT IF EXISTS exercise_catalog_category_check;
ALTER TABLE exercise_catalog ADD CONSTRAINT exercise_catalog_category_check CHECK (category IN ('campo','gym','crossfit','casa','calentamiento','recuperacion','prevencion'));
