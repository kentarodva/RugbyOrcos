-- Auto-notify players via push when a schedule event is created
-- Uses pg_net to call the send-push Edge Function asynchronously

-- Enable pg_net extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function: build payload and fire HTTP POST to send-push
CREATE OR REPLACE FUNCTION notify_schedule_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://qtvmqlbjcotvbzuwanjs.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := json_build_object(
      'title', 'Nuevo evento: ' || NEW.title,
      'body', NEW.date::text || ' a las ' || COALESCE(NEW.time, '09:00') || ' en ' || COALESCE(NEW.location, 'por definir'),
      'filters', json_build_object('team_category', NEW.team_category)
    )::text
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_schedule_event fallo: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Attach trigger to schedule_events
DROP TRIGGER IF EXISTS trg_notify_schedule_event ON schedule_events;
CREATE TRIGGER trg_notify_schedule_event
  AFTER INSERT ON schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_schedule_event();
