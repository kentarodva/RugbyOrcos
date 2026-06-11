-- ============================================================
-- RUGBY ORCOS NEGROS — Fase: Eliminacion localStorage
-- Migracion: 13_eliminar_localstorage.sql
-- ============================================================

-- 1. Clubs dinamicos (antes en localStorage, solo los veia quien los creaba)
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clubs_select" ON clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "clubs_insert" ON clubs FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND system_role IN ('desarrollador','presidente')));
CREATE POLICY "clubs_delete" ON clubs FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND system_role IN ('desarrollador','presidente')));

-- 2. Configuracion del club (API keys IA, streaming, provider activo)
CREATE TABLE IF NOT EXISTS club_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE club_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "club_settings_select" ON club_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "club_settings_all" ON club_settings FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND system_role IN ('desarrollador','presidente')))
    WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND system_role IN ('desarrollador','presidente')));

-- 3. Rate limits IA por usuario + dia
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER DEFAULT 1,
    UNIQUE(user_id, provider_id, model_id, usage_date)
);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_select" ON ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ai_usage_insert" ON ai_usage FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_usage_update" ON ai_usage FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 4. Historial de chat IA por usuario
CREATE TABLE IF NOT EXISTS ai_chat_history (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    messages JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_chat_select" ON ai_chat_history FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ai_chat_insert" ON ai_chat_history FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_chat_update" ON ai_chat_history FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 5. Preferencias de UI en user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
