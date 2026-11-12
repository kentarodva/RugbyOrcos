-- 90_push_fixtures_and_announcements.sql
-- Auditoría de recorridos, punto 9 (2026-11-12): las notificaciones no llegaban.
--   * Crear un partido programado no avisaba a nadie (no había trigger en future_fixtures).
--   * Un anuncio del staff tampoco enviaba push.
--   * El aviso de eventos (migración 85) solo usaba send-push (Firebase / app Android),
--     así que quien usa la app en el navegador nunca lo recibía.
-- Una sola función envía a los dos canales (send-push y web-push) reenviando el token
-- de quien crea el dato, como en la migración 85 (las funciones exigen un staff).
-- Con la app abierta los avisos ya llegan por Realtime (useLiveNotices); esto cubre
-- la app cerrada. Si falla, no bloquea el guardado.

CREATE OR REPLACE FUNCTION public.push_to_club(p_title TEXT, p_body TEXT, p_filters JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth TEXT;
  v_fn TEXT;
BEGIN
  v_auth := current_setting('request.headers', true)::json ->> 'authorization';
  IF v_auth IS NULL OR v_auth = '' THEN
    RETURN; -- creado por SQL/scripts: sin usuario, sin aviso
  END IF;
  FOREACH v_fn IN ARRAY ARRAY['send-push', 'web-push'] LOOP
    PERFORM net.http_post(
      url := 'https://qtvmqlbjcotvbzuwanjs.supabase.co/functions/v1/' || v_fn,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', v_auth),
      body := jsonb_build_object('title', p_title, 'body', p_body, 'filters', coalesce(p_filters, '{}'::jsonb))
    );
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'push_to_club error: %', SQLERRM;
END $$;

REVOKE ALL ON FUNCTION public.push_to_club(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- Eventos del calendario: ahora a los dos canales.
CREATE OR REPLACE FUNCTION public.notify_schedule_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM push_to_club(
    'Nuevo evento: ' || NEW.title,
    to_char(NEW.date, 'DD/MM/YYYY')
      || COALESCE(' ' || to_char(NEW.time, 'HH24:MI'), '')
      || COALESCE(' - ' || NULLIF(NEW.location, ''), ''),
    jsonb_build_object('team_category', NEW.team_category));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_schedule_event error: %', SQLERRM;
  RETURN NEW;
END $$;

-- Partidos programados.
CREATE OR REPLACE FUNCTION public.notify_future_fixture()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM push_to_club(
    'Nuevo partido vs ' || coalesce(NULLIF(NEW.opponent, ''), 'rival'),
    to_char(NEW.date, 'DD/MM/YYYY')
      || COALESCE(' ' || to_char(NEW.time, 'HH24:MI'), '')
      || COALESCE(' - ' || NULLIF(NEW.location, ''), ''),
    jsonb_build_object('team_category', NEW.team_category));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_future_fixture error: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_future_fixture ON public.future_fixtures;
CREATE TRIGGER trg_notify_future_fixture AFTER INSERT ON public.future_fixtures
  FOR EACH ROW EXECUTE FUNCTION public.notify_future_fixture();

-- Anuncios del staff.
CREATE OR REPLACE FUNCTION public.notify_announcement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.channel = 'announcement' THEN
    PERFORM push_to_club('📣 Anuncio del club', left(coalesce(NEW.text, ''), 140), '{}'::jsonb);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_announcement error: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_announcement ON public.messages;
CREATE TRIGGER trg_notify_announcement AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_announcement();

REVOKE ALL ON FUNCTION public.notify_future_fixture() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_announcement() FROM PUBLIC, anon, authenticated;
