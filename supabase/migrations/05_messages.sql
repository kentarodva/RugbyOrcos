-- ============================================================
-- RUGBY ORCOS NEGROS — Fase: Mensajería Interna
-- Tabla: messages
-- ============================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    channel VARCHAR(30) DEFAULT 'direct' CHECK (channel IN ('direct','group','announcement')),
    text TEXT NOT NULL DEFAULT '',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
CREATE INDEX idx_msg_sender ON messages(sender_id);
CREATE INDEX idx_msg_receiver ON messages(receiver_id);
CREATE INDEX idx_msg_channel ON messages(channel);

-- RLS: leer mensajes propios o anuncios, escribir solo como sender
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select_own" ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id OR channel = 'announcement'
);
CREATE POLICY "msg_insert_own" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Vistas de anuncios: qué usuarios ya vieron cada anuncio
CREATE TABLE announcement_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);
CREATE INDEX idx_av_message ON announcement_views(message_id);
CREATE INDEX idx_av_user ON announcement_views(user_id);

ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "av_select" ON announcement_views FOR SELECT USING (true);
CREATE POLICY "av_insert" ON announcement_views FOR INSERT WITH CHECK (auth.uid() = user_id);
