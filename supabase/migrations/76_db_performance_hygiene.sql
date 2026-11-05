-- 76_db_performance_hygiene.sql
-- Limpieza de rendimiento señalada por los advisors de Supabase (auditoría 2026-11-05).
-- No cambia datos ni permisos efectivos. Idempotente.
--   1. Borra índices DUPLICADOS exactos (misma tabla, columnas, opclass, sin predicado),
--      nunca los que respaldan una PK/UNIQUE/constraint. Se conserva el de OID más bajo.
--   2. Crea índice en cada FK de una sola columna que no tenga ya un índice que empiece por ella.
--   3. Políticas RLS: auth.uid() -> (SELECT auth.uid()) para que Postgres lo evalúe una vez
--      por consulta y no por fila (advisor auth_rls_initplan). Misma lógica, solo más rápido.

-- ─── 1. Índices duplicados ──────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    WITH idx AS (
      SELECT i.indexrelid, i.indrelid, c.relname AS index_name,
             i.indkey::text AS cols, i.indclass::text AS ops, i.indcollation::text AS colls,
             i.indisunique, i.indisprimary,
             EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid) AS backs_constraint
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND i.indexprs IS NULL AND i.indpred IS NULL
    )
    SELECT d.index_name
    FROM idx d
    JOIN idx keep ON keep.indrelid = d.indrelid AND keep.cols = d.cols AND keep.ops = d.ops
                 AND keep.colls = d.colls AND keep.indisunique = d.indisunique
                 AND keep.indexrelid < d.indexrelid
    WHERE NOT d.indisprimary AND NOT d.backs_constraint
    GROUP BY d.index_name
  LOOP
    RAISE NOTICE 'Borrando índice duplicado: %', r.index_name;
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.index_name);
  END LOOP;
END $$;

-- ─── 2. Índices para FKs sin índice ─────────────────────────────────────────
DO $$
DECLARE r RECORD; v_name TEXT;
BEGIN
  FOR r IN
    SELECT cl.relname AS tbl, a.attname AS col
    FROM pg_constraint k
    JOIN pg_class cl ON cl.oid = k.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = k.conkey[1]
    WHERE k.contype = 'f' AND n.nspname = 'public' AND array_length(k.conkey, 1) = 1
      AND cl.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i WHERE i.indrelid = k.conrelid AND i.indkey[0] = k.conkey[1]
      )
  LOOP
    v_name := left('idx_fk_' || r.tbl || '_' || r.col, 63);
    RAISE NOTICE 'Creando índice FK: % (%.%)', v_name, r.tbl, r.col;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)', v_name, r.tbl, r.col);
  END LOOP;
END $$;

-- ─── 3. auth.uid() por fila -> una vez por consulta ─────────────────────────
DO $$
DECLARE r RECORD; v_qual TEXT; v_check TEXT; v_sql TEXT;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual ~ '(?<!SELECT )auth\.uid\(\)' OR with_check ~ '(?<!SELECT )auth\.uid\(\)')
  LOOP
    v_qual  := regexp_replace(r.qual,       '(?<!SELECT )auth\.uid\(\)', '(SELECT auth.uid())', 'g');
    v_check := regexp_replace(r.with_check, '(?<!SELECT )auth\.uid\(\)', '(SELECT auth.uid())', 'g');
    v_sql := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF v_qual  IS NOT NULL THEN v_sql := v_sql || format(' USING (%s)', v_qual); END IF;
    IF v_check IS NOT NULL THEN v_sql := v_sql || format(' WITH CHECK (%s)', v_check); END IF;
    RAISE NOTICE 'Optimizando política: %.%', r.tablename, r.policyname;
    EXECUTE v_sql;
  END LOOP;
END $$;
