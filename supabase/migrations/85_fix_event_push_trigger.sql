-- 85_fix_event_push_trigger.sql
-- notify_schedule_event nunca enviaba nada:
--   1. COALESCE(NEW.time, '') mezcla TIME con texto y fallaba siempre (el error se tragaba en silencio).
--   2. send-push exige el token de un usuario staff y el trigger llamaba sin Authorization (401).
-- Ahora reenvía el token de quien crea el evento (PostgREST lo deja en request.headers).
-- Si el evento se crea sin usuario (SQL directo, scripts), no se notifica.

CREATE OR REPLACE FUNCTION public.notify_schedule_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth TEXT;
BEGIN
  v_auth := current_setting('request.headers', true)::json ->> 'authorization';
  IF v_auth IS NULL OR v_auth = '' THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://qtvmqlbjcotvbzuwanjs.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', v_auth),
    body := jsonb_build_object(
      'title', 'Nuevo evento: ' || NEW.title,
      'body', to_char(NEW.date, 'DD/MM/YYYY')
              || COALESCE(' ' || to_char(NEW.time, 'HH24:MI'), '')
              || COALESCE(' - ' || NULLIF(NEW.location, ''), ''),
      'filters', jsonb_build_object('team_category', NEW.team_category)
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_schedule_event error: %', SQLERRM;
  RETURN NEW;
END;
$$;
