-- ============================================================
-- RUGBY ORCOS NEGROS — Fase 9: Invitacion a Equipos Rivales
-- Tablas: match_invitations + guest_players
-- ============================================================

-- Invitaciones: un link unico por partido futuro
CREATE TABLE match_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    future_fixture_id UUID NOT NULL REFERENCES future_fixtures(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    rival_name VARCHAR(200),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active','completed','expired')),
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inv_token ON match_invitations(token);
CREATE INDEX idx_inv_fixture ON match_invitations(future_fixture_id);

-- Jugadores invitados: registrados por el rival sin cuenta en el sistema
CREATE TABLE guest_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES match_invitations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    number INTEGER,
    position VARCHAR(50),
    notes VARCHAR(300),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_guest_inv ON guest_players(invitation_id);

-- Solo una invitación activa por fixture
CREATE UNIQUE INDEX idx_unique_active_invitation 
  ON match_invitations(future_fixture_id) 
  WHERE status = 'active';

-- RLS: select publico (sin login), INSERT publico, write solo owner
ALTER TABLE match_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_select_public" ON match_invitations FOR SELECT USING (true);
CREATE POLICY "inv_insert_owner" ON match_invitations FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());
CREATE POLICY "inv_update_owner" ON match_invitations FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "inv_delete_owner" ON match_invitations FOR DELETE USING (user_id = auth.uid() OR is_admin());

ALTER TABLE guest_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guest_select_public" ON guest_players FOR SELECT USING (true);
CREATE POLICY "guest_insert_public" ON guest_players FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM match_invitations 
      WHERE id = invitation_id 
      AND status = 'active' 
      AND expires_at >= CURRENT_DATE
    )
  );
CREATE POLICY "guest_update_owner" ON guest_players FOR UPDATE USING (
    EXISTS (SELECT 1 FROM match_invitations mi WHERE mi.id = invitation_id AND (mi.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "guest_delete_owner" ON guest_players FOR DELETE USING (
    EXISTS (SELECT 1 FROM match_invitations mi WHERE mi.id = invitation_id AND (mi.user_id = auth.uid() OR is_admin()))
);
