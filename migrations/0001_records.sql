CREATE TABLE IF NOT EXISTS core_dummy_web.records (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  created_by uuid NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS records_organization_created_at_idx
  ON core_dummy_web.records (organization_id, created_at DESC);
