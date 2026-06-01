-- Migration: Custom Tactics + Normalized Positions (idempotent)
-- Crea tabla custom_tactics, rugby_positions y agrega position_id a players

-- 1. Catálogo de posiciones normalizadas
CREATE TABLE IF NOT EXISTS rugby_positions (
  id INTEGER PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT,
  abbreviation TEXT NOT NULL
);

INSERT INTO rugby_positions (id, name_es, name_en, abbreviation) VALUES
  (1,  'Pilar izquierdo', 'Loosehead prop',      'PIL'),
  (2,  'Talonador',       'Hooker',              'TAL'),
  (3,  'Pilar derecho',   'Tighthead prop',      'PIL'),
  (4,  'Segunda línea',   'Lock',                '2L'),
  (5,  'Segunda línea',   'Lock',                '2L'),
  (6,  'Ala',             'Blindside flanker',   'ALA'),
  (7,  'Ala',             'Openside flanker',    'ALA'),
  (8,  'Número 8',        'Number 8',            'N8'),
  (9,  'Medio scrum',     'Scrum-half',           'MS'),
  (10, 'Apertura',        'Fly-half',            'AP'),
  (11, 'Wing izquierdo',  'Left wing',           'W'),
  (12, 'Centro interior', 'Inside centre',       'CI'),
  (13, 'Centro exterior', 'Outside centre',      'CE'),
  (14, 'Wing derecho',    'Right wing',          'W'),
  (15, 'Zaguero',         'Fullback',            'ZAG')
ON CONFLICT (id) DO NOTHING;

-- 2. Columna position_id en players
ALTER TABLE players ADD COLUMN IF NOT EXISTS position_id INTEGER REFERENCES rugby_positions(id);

-- Migrar datos existentes: mapear texto suelto a ID
UPDATE players SET position_id = 1
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%pilar%izquierdo%' OR LOWER(position) LIKE '%pilar%izq%'
      OR LOWER(position) IN ('pilar izquierdo', 'pillar izquierdo', 'pilar izq', 'pilarizq')
      OR LOWER(position) = 'pilar'
    );

UPDATE players SET position_id = 2
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%talonador%' OR LOWER(position) LIKE '%hooker%'
      OR LOWER(position) IN ('talonador', 'hooker')
    );

UPDATE players SET position_id = 3
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%pilar%derecho%' OR LOWER(position) LIKE '%pilar%der%'
      OR LOWER(position) IN ('pilar derecho', 'pillar derecho', 'pilar der')
    );

UPDATE players SET position_id = 4
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%segunda%linea%' OR LOWER(position) LIKE '%segunda%línea%'
      OR LOWER(position) LIKE '%lock%' OR LOWER(position) LIKE '%second%row%'
      OR LOWER(position) IN ('segunda linea', 'segunda línea', '2da linea')
    );

UPDATE players SET position_id = 6
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%ala%' OR LOWER(position) LIKE '%flanker%' OR LOWER(position) LIKE '%flanco%'
      OR LOWER(position) IN ('ala', 'flanker')
    );

UPDATE players SET position_id = 8
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%octavo%' OR LOWER(position) LIKE '%numero 8%' OR LOWER(position) LIKE '%número 8%'
      OR LOWER(position) LIKE '%n8%' OR LOWER(position) LIKE '%number 8%'
      OR LOWER(position) IN ('octavo', 'numero 8', 'número 8')
    );

UPDATE players SET position_id = 9
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%medio%mele%' OR LOWER(position) LIKE '%medio%melé%' OR LOWER(position) LIKE '%medio scrum%'
      OR LOWER(position) LIKE '%scrum half%' OR LOWER(position) LIKE '%scrum-half%'
      OR LOWER(position) IN ('medio mele', 'medio melé', 'medio scrum', 'scrum half', 'scrum-half', 'mm')
    );

UPDATE players SET position_id = 10
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%apertura%' OR LOWER(position) LIKE '%fly half%' OR LOWER(position) LIKE '%fly-half%'
      OR LOWER(position) LIKE '%apertura%'
      OR LOWER(position) IN ('apertura', 'fly half', 'fly-half')
    );

UPDATE players SET position_id = 15
  WHERE position_id IS NULL
    AND (
      LOWER(position) LIKE '%zaguero%' OR LOWER(position) LIKE '%fullback%'
      OR LOWER(position) IN ('zaguero', 'zaguera', 'fullback')
    );

-- 3. Tabla de tácticas personalizadas
CREATE TABLE IF NOT EXISTS custom_tactics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all',
  formation_type TEXT NOT NULL DEFAULT 'union',
  positions_horizontal JSONB NOT NULL,
  positions_vertical JSONB NOT NULL,
  lineup JSONB DEFAULT '{}',
  notes TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_tactics_scope ON custom_tactics(scope);
CREATE INDEX IF NOT EXISTS idx_custom_tactics_user ON custom_tactics(user_id);

ALTER TABLE custom_tactics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (se dropean primero por si ya existen)
DROP POLICY IF EXISTS "Todos los autenticados pueden leer tácticas" ON custom_tactics;
CREATE POLICY "Todos los autenticados pueden leer tácticas"
  ON custom_tactics FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias tácticas" ON custom_tactics;
CREATE POLICY "Usuarios pueden insertar sus propias tácticas"
  ON custom_tactics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias tácticas" ON custom_tactics;
CREATE POLICY "Usuarios pueden actualizar sus propias tácticas"
  ON custom_tactics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias tácticas" ON custom_tactics;
CREATE POLICY "Usuarios pueden eliminar sus propias tácticas"
  ON custom_tactics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Realtime (solo si no está ya en la publicación)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'custom_tactics'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE custom_tactics;
  END IF;
END $$;

-- 4. Presets iniciales
DO $$
DECLARE
  system_user_id UUID;
BEGIN
  SELECT id INTO system_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF system_user_id IS NOT NULL THEN
    INSERT INTO custom_tactics (user_id, name, scope, formation_type, positions_horizontal, positions_vertical, lineup, notes, sort_order)
    VALUES
      (system_user_id, 'Ataque estructurado XV', 'all', 'union',
        '[{"id":1,"name":"Pilar Izquierdo","short":"p1","x":48,"y":30},{"id":2,"name":"Talonador (Hooker)","short":"p2","x":46,"y":45},{"id":3,"name":"Pilar Derecho","short":"p3","x":46,"y":60},{"id":4,"name":"Segunda Línea Izq","short":"sl4","x":42,"y":36},{"id":5,"name":"Segunda Línea Der","short":"sl5","x":42,"y":54},{"id":6,"name":"Flanker Ciego","short":"fl6","x":44,"y":22},{"id":7,"name":"Flanker Abierto","short":"fl7","x":42,"y":68},{"id":8,"name":"Octavo (N8)","short":"n8","x":38,"y":45},{"id":9,"name":"Medio Melé (Half)","short":"mm9","x":34,"y":44},{"id":10,"name":"Apertura (Fly)","short":"ap10","x":30,"y":28},{"id":11,"name":"Ala Izquierdo (Wing)","short":"w11","x":16,"y":12},{"id":12,"name":"Primer Centro","short":"c12","x":26,"y":24},{"id":13,"name":"Segundo Centro","short":"c13","x":30,"y":20},{"id":14,"name":"Ala Derecho (Wing)","short":"w14","x":24,"y":82},{"id":15,"name":"Zaguero (Fullback)","short":"fb15","x":12,"y":50}]',
        '[{"id":1,"name":"Pilar Izquierdo","short":"p1","x":28,"y":54},{"id":2,"name":"Talonador (Hooker)","short":"p2","x":46,"y":54},{"id":3,"name":"Pilar Derecho","short":"p3","x":62,"y":54},{"id":4,"name":"Segunda Línea Izq","short":"sl4","x":36,"y":44},{"id":5,"name":"Segunda Línea Der","short":"sl5","x":54,"y":44},{"id":6,"name":"Flanker Ciego","short":"fl6","x":22,"y":44},{"id":7,"name":"Flanker Abierto","short":"fl7","x":68,"y":44},{"id":8,"name":"Octavo (N8)","short":"n8","x":46,"y":38},{"id":9,"name":"Medio Melé (Half)","short":"mm9","x":44,"y":32},{"id":10,"name":"Apertura (Fly)","short":"ap10","x":28,"y":28},{"id":11,"name":"Ala Izquierdo (Wing)","short":"w11","x":10,"y":10},{"id":12,"name":"Primer Centro","short":"c12","x":26,"y":22},{"id":13,"name":"Segundo Centro","short":"c13","x":22,"y":18},{"id":14,"name":"Ala Derecho (Wing)","short":"w14","x":84,"y":10},{"id":15,"name":"Zaguero (Fullback)","short":"fb15","x":48,"y":6}]',
        '{}', 'Ataque balanceado con forwards de punta y backs escalonados', 0),
      (system_user_id, 'Defensa cerrada 7s', 'all', 'sevens',
        '[{"id":1,"name":"Pilar (7s)","short":"p1","x":42,"y":22},{"id":2,"name":"Hooker (7s)","short":"p2","x":42,"y":42},{"id":3,"name":"Pilar (7s)","short":"p3","x":42,"y":62},{"id":9,"name":"Medio Melé (7s)","short":"mm9","x":34,"y":42},{"id":10,"name":"Apertura (7s)","short":"ap10","x":44,"y":18},{"id":11,"name":"Centro (7s)","short":"w11","x":56,"y":30},{"id":12,"name":"Ala/Zaguero (7s)","short":"c12","x":68,"y":56}]',
        '[{"id":1,"name":"Pilar (7s)","short":"p1","x":35,"y":18},{"id":2,"name":"Hooker (7s)","short":"p2","x":50,"y":15},{"id":3,"name":"Pilar (7s)","short":"p3","x":65,"y":18},{"id":9,"name":"Medio Melé (7s)","short":"mm9","x":40,"y":32},{"id":10,"name":"Apertura (7s)","short":"ap10","x":55,"y":36},{"id":11,"name":"Centro (7s)","short":"w11","x":46,"y":52},{"id":12,"name":"Ala/Zaguero (7s)","short":"c12","x":62,"y":68}]',
        '{}', 'Defensa en línea con sweeper profundo para seven', 1),
      (system_user_id, 'Ataque League 13s', 'all', 'league',
        '[{"id":1,"name":"Pilar (13s)","short":"p1","x":42,"y":62},{"id":2,"name":"Hooker (13s)","short":"p2","x":42,"y":50},{"id":3,"name":"Pilar (13s)","short":"p3","x":42,"y":74},{"id":4,"name":"Second Row (13s)","short":"sl4","x":36,"y":56},{"id":5,"name":"Second Row (13s)","short":"sl5","x":48,"y":56},{"id":8,"name":"Lock (13s)","short":"n8","x":42,"y":66},{"id":9,"name":"Scrum-half (13s)","short":"mm9","x":30,"y":44},{"id":10,"name":"Stand-off (13s)","short":"ap10","x":40,"y":30},{"id":11,"name":"Wing Izq (13s)","short":"w11","x":56,"y":85},{"id":12,"name":"Centre Izq (13s)","short":"c12","x":40,"y":20},{"id":13,"name":"Centre Der (13s)","short":"c13","x":48,"y":24},{"id":14,"name":"Wing Der (13s)","short":"w14","x":64,"y":80},{"id":15,"name":"Fullback (13s)","short":"fb15","x":18,"y":50}]',
        '[{"id":1,"name":"Pilar (13s)","short":"p1","x":35,"y":28},{"id":2,"name":"Hooker (13s)","short":"p2","x":50,"y":24},{"id":3,"name":"Pilar (13s)","short":"p3","x":65,"y":28},{"id":4,"name":"Second Row (13s)","short":"sl4","x":40,"y":36},{"id":5,"name":"Second Row (13s)","short":"sl5","x":60,"y":36},{"id":8,"name":"Lock (13s)","short":"n8","x":50,"y":42},{"id":9,"name":"Scrum-half (13s)","short":"mm9","x":42,"y":50},{"id":10,"name":"Stand-off (13s)","short":"ap10","x":58,"y":50},{"id":11,"name":"Wing Izq (13s)","short":"w11","x":15,"y":72},{"id":12,"name":"Centre Izq (13s)","short":"c12","x":30,"y":62},{"id":13,"name":"Centre Der (13s)","short":"c13","x":70,"y":62},{"id":14,"name":"Wing Der (13s)","short":"w14","x":85,"y":72},{"id":15,"name":"Fullback (13s)","short":"fb15","x":50,"y":84}]',
        '{}', 'Ofensiva con centros potentes y alas rápidas', 2)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
