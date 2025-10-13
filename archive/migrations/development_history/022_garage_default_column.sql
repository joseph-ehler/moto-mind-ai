-- Add is_default column to garages table
ALTER TABLE garages ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Create index for default garage lookups
CREATE INDEX IF NOT EXISTS idx_garages_default ON garages(is_default) WHERE is_default = true;
