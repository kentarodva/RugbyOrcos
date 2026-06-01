-- Migration 09: Fix Mak'Gora duplicate teams + add UNIQUE(name)

-- 1. Delete duplicate rows, keeping the one with lowest sort_order (then earliest created_at)
DELETE FROM makgora_teams m
WHERE EXISTS (
  SELECT 1 FROM makgora_teams m2
  WHERE m2.name = m.name
  AND (
    m2.sort_order < m.sort_order
    OR (m2.sort_order = m.sort_order AND m2.created_at < m.created_at)
  )
);

-- 2. Add UNIQUE constraint on name
ALTER TABLE makgora_teams ADD CONSTRAINT makgora_teams_name_key UNIQUE (name);
