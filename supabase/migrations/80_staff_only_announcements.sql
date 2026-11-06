-- 80_staff_only_announcements.sql
-- QA 2026-11-05: la política msg_insert_own (auth.uid() = sender_id) dejaba a CUALQUIER usuario,
-- incluido un jugador, publicar en el canal 'announcement' (sale como ventana emergente a todo el club).
-- Política RESTRICTIVA: se combina con AND con las existentes, así que no abre nada nuevo;
-- solo exige ser staff (tier <= 3) para el canal de anuncios. Mensajes normales no cambian. Idempotente.

DROP POLICY IF EXISTS "msg_announcement_staff_only" ON public.messages;
CREATE POLICY "msg_announcement_staff_only" ON public.messages
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (channel IS DISTINCT FROM 'announcement' OR (SELECT COALESCE(public.get_user_tier(), 4) <= 3));
