-- MotoMind: Deterministic Reminders with DB-Generated Dedupe
-- Prevents duplicate reminders with generated dedupe key

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('registration','inspection','emissions','maintenance','other')) NOT NULL,
  priority TEXT CHECK (priority IN ('low','medium','high')) NOT NULL DEFAULT 'medium',
  due_date DATE,
  due_miles INTEGER,
  status TEXT CHECK (status IN ('open','scheduled','done','dismissed')) NOT NULL DEFAULT 'open',
  source TEXT CHECK (source IN ('user')) NOT NULL DEFAULT 'user',
  
  -- Dedupe key for preventing duplicate reminders (computed in application)
  dedupe_key TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on dedupe key for open/scheduled reminders only
CREATE UNIQUE INDEX IF NOT EXISTS ux_reminders_dedupe_open
  ON reminders(dedupe_key) 
  WHERE status IN ('open','scheduled');

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_status
  ON reminders(vehicle_id, status);

CREATE INDEX IF NOT EXISTS idx_reminders_due_date
  ON reminders(due_date) 
  WHERE status IN ('open','scheduled');

CREATE INDEX IF NOT EXISTS idx_reminders_due_miles
  ON reminders(due_miles) 
  WHERE status IN ('open','scheduled');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_updated_at();

-- Comments
COMMENT ON TABLE reminders IS 'User-created reminders with deterministic deduplication';
COMMENT ON COLUMN reminders.dedupe_key IS 'Generated MD5 hash for preventing duplicate reminders';
COMMENT ON INDEX ux_reminders_dedupe_open IS 'Prevents duplicate open/scheduled reminders';
