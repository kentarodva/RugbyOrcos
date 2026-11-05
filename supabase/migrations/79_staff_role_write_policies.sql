-- 79_staff_role_write_policies.sql
-- QA por roles (2026-11-05): entrenador/tesorero (tier 3) no podían escribir en agenda, jugadores,
-- finanzas… aunque la app les muestra esos botones. Causa: las políticas "<tabla>_write" de 01_schema
-- solo permiten "user_id = auth.uid() OR is_admin()", e is_admin() = desarrollador/presidente/promotor.
-- Esta migración SOLO AÑADE políticas permisivas por rol, alineadas con usePermissions.js:
--   entrenador: manage_players, manage_schedule, manage_tactics, manage_inventory
--   tesorero:   manage_finances, manage_inventory
-- No quita permisos a nadie. Idempotente.

CREATE OR REPLACE FUNCTION public.has_club_role(p_roles TEXT[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND is_active IS NOT FALSE AND system_role = ANY (p_roles)
  );
$$;
REVOKE ALL ON FUNCTION public.has_club_role(TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_club_role(TEXT[]) TO authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- tabla,            roles,                          comandos
      ('schedule_events', ARRAY['entrenador'],             ARRAY['INSERT','UPDATE','DELETE']),
      ('players',         ARRAY['entrenador'],             ARRAY['INSERT','UPDATE']),
      ('lineups',         ARRAY['entrenador'],             ARRAY['INSERT','UPDATE','DELETE']),
      ('fixtures',        ARRAY['entrenador'],             ARRAY['INSERT','UPDATE','DELETE']),
      ('future_fixtures', ARRAY['entrenador'],             ARRAY['INSERT','UPDATE','DELETE']),
      ('rivals',          ARRAY['entrenador'],             ARRAY['INSERT','UPDATE','DELETE']),
      ('championships',   ARRAY['entrenador'],             ARRAY['INSERT','UPDATE','DELETE']),
      ('inventory',       ARRAY['entrenador','tesorero'],  ARRAY['INSERT','UPDATE','DELETE']),
      ('finances',        ARRAY['tesorero'],               ARRAY['INSERT','UPDATE','DELETE'])
    ) AS t(tbl, roles, cmds)
  LOOP
    IF to_regclass('public.' || r.tbl) IS NULL THEN
      RAISE NOTICE 'Tabla % no existe, se omite', r.tbl;
      CONTINUE;
    END IF;
    DECLARE c TEXT; pname TEXT; cond TEXT;
    BEGIN
      cond := format('(SELECT public.has_club_role(%L::text[]))', r.roles);
      FOREACH c IN ARRAY r.cmds LOOP
        pname := format('%s_staff_%s', r.tbl, lower(c));
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pname, r.tbl);
        IF c = 'INSERT' THEN
          EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', pname, r.tbl, cond);
        ELSIF c = 'UPDATE' THEN
          EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', pname, r.tbl, cond, cond);
        ELSE
          EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', pname, r.tbl, cond);
        END IF;
        RAISE NOTICE 'Política % creada', pname;
      END LOOP;
    END;
  END LOOP;
END $$;
