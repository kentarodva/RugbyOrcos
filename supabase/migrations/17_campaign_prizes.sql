ALTER TABLE fundraising_campaigns
ADD COLUMN IF NOT EXISTS prizes JSONB DEFAULT '[]'::jsonb;
