ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.gym_history
  ADD COLUMN IF NOT EXISTS height NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS custom_lifts JSONB DEFAULT '{}'::jsonb;

ALTER POLICY "gym_history_insert" ON public.gym_history
  WITH CHECK (
    (SELECT public.get_user_tier()) <= 3
    OR player_id IN (SELECT id FROM public.players WHERE user_id = (SELECT auth.uid()))
    OR (SELECT auth.uid()) IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.player_record_progress_snapshot(
  p_player_id TEXT,
  p_weight NUMERIC DEFAULT NULL,
  p_height NUMERIC DEFAULT NULL,
  p_squat NUMERIC DEFAULT 0,
  p_bench NUMERIC DEFAULT 0,
  p_deadlift NUMERIC DEFAULT 0,
  p_custom_lifts JSONB DEFAULT '{}'::jsonb,
  p_tracked_exercises JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_prefs JSONB;
  v_pid UUID := p_player_id::UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'No autenticado');
  END IF;

  SELECT COALESCE(preferences, '{}'::jsonb) INTO v_prefs
  FROM public.players
  WHERE id = v_pid;

  v_prefs := v_prefs || jsonb_build_object(
    'profile_confirmed', true,
    'profile_confirmed_at', now(),
    'tracked_exercises', COALESCE(p_tracked_exercises, v_prefs->'tracked_exercises', '["squat","bench","deadlift"]'::jsonb),
    'custom_lifts', COALESCE(p_custom_lifts, v_prefs->'custom_lifts', '{}'::jsonb)
  );

  UPDATE public.players
  SET
    weight_kg = COALESCE(p_weight, weight_kg),
    height_m = COALESCE(p_height, height_m),
    gym_squat = COALESCE(p_squat, gym_squat),
    gym_bench = COALESCE(p_bench, gym_bench),
    gym_deadlift = COALESCE(p_deadlift, gym_deadlift),
    preferences = v_prefs,
    updated_at = now()
  WHERE id = v_pid;

  INSERT INTO public.gym_history (
    player_id, recorded_date, squat, bench, deadlift, weight, height, custom_lifts
  ) VALUES (
    v_pid,
    v_today,
    COALESCE(p_squat, 0),
    COALESCE(p_bench, 0),
    COALESCE(p_deadlift, 0),
    p_weight,
    p_height,
    COALESCE(p_custom_lifts, '{}'::jsonb)
  )
  ON CONFLICT (player_id, recorded_date)
  DO UPDATE SET
    squat = EXCLUDED.squat,
    bench = EXCLUDED.bench,
    deadlift = EXCLUDED.deadlift,
    weight = COALESCE(EXCLUDED.weight, public.gym_history.weight),
    height = COALESCE(EXCLUDED.height, public.gym_history.height),
    custom_lifts = COALESCE(EXCLUDED.custom_lifts, public.gym_history.custom_lifts);

  RETURN jsonb_build_object('success', true, 'recorded_date', v_today, 'preferences', v_prefs);
END;
$$;
