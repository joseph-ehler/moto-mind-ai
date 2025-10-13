-- Add deletion tracking columns to vehicle_events

-- Add deletion_reason column (stores why event was deleted)
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add restored_at column (tracks when/if event was restored)
ALTER TABLE vehicle_events 
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ;

-- Comment the columns for documentation
COMMENT ON COLUMN vehicle_events.deletion_reason IS 'Reason provided by user when deleting event (soft delete)';
COMMENT ON COLUMN vehicle_events.restored_at IS 'Timestamp when event was restored after deletion';

-- Note: deleted_at column already exists from previous migrations (ADD-MISSING-COLUMNS.sql)
-- This migration just adds the complementary tracking columns

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicle_events' 
  AND column_name IN ('deleted_at', 'deletion_reason', 'restored_at')
ORDER BY column_name;
