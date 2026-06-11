-- Fundraising & Payment History System

CREATE TABLE fundraising_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_category TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('raffle', 'food', 'general')),
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  deadline DATE,
  ticket_price NUMERIC,
  total_tickets INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fundraising_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES fundraising_campaigns(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount_due NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  ticket_start INTEGER,
  ticket_end INTEGER,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, player_id)
);

CREATE TABLE raffle_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES fundraising_campaigns(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  assigned_to UUID REFERENCES players(id),
  sold_to_name TEXT DEFAULT '',
  sold_at DATE,
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, ticket_number)
);

CREATE TABLE player_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL CHECK (source IN ('membership', 'fundraising')),
  assignment_id UUID REFERENCES fundraising_assignments(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES fundraising_campaigns(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fundraising_campaigns_team ON fundraising_campaigns(team_category);
CREATE INDEX idx_fundraising_assignments_campaign ON fundraising_assignments(campaign_id);
CREATE INDEX idx_fundraising_assignments_player ON fundraising_assignments(player_id);
CREATE INDEX idx_raffle_tickets_campaign ON raffle_tickets(campaign_id);
CREATE INDEX idx_player_payments_player ON player_payments(player_id);
CREATE INDEX idx_player_payments_source ON player_payments(source);
