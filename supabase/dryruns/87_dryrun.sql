-- Dry-run for migration 87. Run in one transaction that is rolled back:
--   BEGIN; <contents of 87_attendance_summary_trigger.sql>; <this block>; ROLLBACK;
-- The final RAISE aborts everything anyway. Expected:
--   after late: late=+1 burpees=+15 | resave same: burpees=+15 |
--   to absent: burpees=+50 cones=t | delete: late=+0 burpees=+0
DO $t$
DECLARE pid uuid; b0 int; b int; c boolean; l0 int; l int; n int; res text;
BEGIN
  SELECT count(*) INTO n FROM player_attendance_summary;
  res := 'summaries=' || n;
  SELECT id INTO pid FROM players WHERE deleted_at IS NULL LIMIT 1;
  SELECT coalesce((SELECT burpees FROM penalties WHERE player_id=pid),0) INTO b0;
  SELECT coalesce((SELECT late FROM player_attendance_summary WHERE player_id=pid),0) INTO l0;

  INSERT INTO attendance(player_id, event_date, status) VALUES (pid, '2000-01-01', 'late');
  SELECT burpees INTO b FROM penalties WHERE player_id=pid;
  SELECT late INTO l FROM player_attendance_summary WHERE player_id=pid;
  res := res || format(' | after late: late=+%s burpees=+%s', l-l0, b-b0);

  UPDATE attendance SET status='late' WHERE player_id=pid AND event_date='2000-01-01';
  SELECT burpees INTO b FROM penalties WHERE player_id=pid;
  res := res || format(' | resave same: burpees=+%s', b-b0);

  UPDATE attendance SET status='absent_unjustified' WHERE player_id=pid AND event_date='2000-01-01';
  SELECT burpees, cones INTO b, c FROM penalties WHERE player_id=pid;
  res := res || format(' | to absent: burpees=+%s cones=%s', b-b0, c);

  DELETE FROM attendance WHERE player_id=pid AND event_date='2000-01-01';
  SELECT burpees INTO b FROM penalties WHERE player_id=pid;
  SELECT late INTO l FROM player_attendance_summary WHERE player_id=pid;
  res := res || format(' | delete: late=+%s burpees=+%s', l-l0, b-b0);

  RAISE EXCEPTION 'DRYRUN (rolled back): %', res;
END $t$;
