-- ============================================================
-- RUGBY ORCOS NEGROS — Fase: Atributos RPG auto-calculados
-- Migracion: 14_auto_attributes.sql
-- ============================================================

-- 1. Unificar default de tecnica con los demas atributos
ALTER TABLE players ALTER COLUMN attr_technique SET DEFAULT 50;

-- 2. Columna source en attribute_history para trazabilidad
ALTER TABLE attribute_history ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'auto';
