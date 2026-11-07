-- Dry-run for migration 86: applies it, tries writes as coach / referee / treasurer,
-- then RAISEs so the whole thing rolls back. Expected message:
-- coach attendance OK; coach injury OK; ref attendance OK; ref injury DENIED;
-- treas attendance DENIED; treas injury DENIED;
DO $t$
DECLARE
  r RECORD; c TEXT; pname TEXT; cond TEXT;
  coach uuid; treas uuid; ref uuid; pid uuid; res text := '';
  who RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
      ('attendance', ARRAY['entrenador','arbitro']),('player_attendance_summary', ARRAY['entrenador','arbitro']),
      ('penalties', ARRAY['entrenador','arbitro']),('infractions', ARRAY['entrenador','arbitro']),
      ('match_stats', ARRAY['entrenador','arbitro']),('injury_log', ARRAY['entrenador']),
      ('hia_assessments', ARRAY['entrenador']),('wellness_logs', ARRAY['entrenador']),
      ('workout_logs', ARRAY['entrenador']),('attribute_history', ARRAY['entrenador'])) AS t(tbl, roles)
  LOOP
    cond := format('(SELECT public.has_club_role(%L::text[]))', r.roles);
    FOREACH c IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
      pname := format('%s_staff_%s', r.tbl, lower(c));
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pname, r.tbl);
      IF c = 'INSERT' THEN EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', pname, r.tbl, cond);
      ELSIF c = 'UPDATE' THEN EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', pname, r.tbl, cond, cond);
      ELSE EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', pname, r.tbl, cond);
      END IF;
    END LOOP;
  END LOOP;

  SELECT user_id INTO coach FROM user_profiles WHERE system_role='entrenador' AND is_active IS NOT FALSE LIMIT 1;
  SELECT user_id INTO treas FROM user_profiles WHERE system_role='tesorero' LIMIT 1;
  SELECT user_id INTO ref   FROM user_profiles WHERE system_role='arbitro' LIMIT 1;
  SELECT id INTO pid FROM players WHERE deleted_at IS NULL AND user_id NOT IN (coach, treas, ref) LIMIT 1;

  FOR who IN SELECT * FROM (VALUES ('coach', coach), ('ref', ref), ('treas', treas)) AS w(label, uid) LOOP
    PERFORM set_config('request.jwt.claims', json_build_object('sub', who.uid, 'role','authenticated')::text, true);
    PERFORM set_config('role', 'authenticated', true);
    BEGIN INSERT INTO attendance(player_id, event_date, status) VALUES (pid, '2000-01-01', 'present');
      res := res || who.label || ' attendance OK; ';
    EXCEPTION WHEN insufficient_privilege THEN res := res || who.label || ' attendance DENIED; '; END;
    BEGIN INSERT INTO injury_log(player_id, diagnosis) VALUES (pid, 'dry-run');
      res := res || who.label || ' injury OK; ';
    EXCEPTION WHEN insufficient_privilege THEN res := res || who.label || ' injury DENIED; '; END;
    PERFORM set_config('role', 'postgres', true);
  END LOOP;

  RAISE EXCEPTION 'DRYRUN (rolled back): %', res;
END $t$;
