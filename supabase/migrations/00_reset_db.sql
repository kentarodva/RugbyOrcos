-- ============================================================
-- RESET: Borrar TODO lo existente en la BD
-- Ejecutar PRIMERO en Supabase SQL Editor
-- Esto elimina todas las tablas, funciones, triggers y politicas.
-- Los datos de auth.users NO se borran.
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Borrar TODAS las funciones
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT proname, pronamespace::regnamespace::text AS nsp
    FROM pg_proc WHERE pronamespace IN ('public'::regnamespace) AND prokind = 'f'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE';
  END LOOP;
END;
$$;

-- Borrar TODAS las tablas del schema public
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END;
$$;

-- Borrar tipos compuestos (enums)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e'
  LOOP
    EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
  END LOOP;
END;
$$;
