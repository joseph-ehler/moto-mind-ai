-- Add change history audit trail
-- Tracks all database changes via the toolkit

CREATE TABLE IF NOT EXISTS registry.change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type TEXT NOT NULL CHECK (change_type IN ('preflight', 'auto_fix', 'migration', 'manual')),
  object_name TEXT NOT NULL,
  object_type TEXT, -- 'table', 'view', 'function', etc.
  actor TEXT, -- Git user email
  git_sha TEXT, -- Git commit SHA
  change_plan JSONB, -- Full preflight/fix results
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_change_history_object ON registry.change_history(object_name);
CREATE INDEX idx_change_history_type ON registry.change_history(change_type);
CREATE INDEX idx_change_history_created_at ON registry.change_history(created_at DESC);
CREATE INDEX idx_change_history_actor ON registry.change_history(actor) WHERE actor IS NOT NULL;

COMMENT ON TABLE registry.change_history IS 
  'Audit trail of all database changes made via the toolkit. Tracks who, what, when, and why for compliance and debugging.';

COMMENT ON COLUMN registry.change_history.change_type IS 
  'Type of change: preflight (validation only), auto_fix (automated fix), migration (manual migration), manual (direct SQL)';

COMMENT ON COLUMN registry.change_history.change_plan IS 
  'Full JSON output from preflight or auto-fix command for complete audit trail';

-- Sample query to view recent changes
COMMENT ON TABLE registry.change_history IS 
  'Audit trail. Example: SELECT object_name, change_type, actor, created_at FROM registry.change_history ORDER BY created_at DESC LIMIT 10';
