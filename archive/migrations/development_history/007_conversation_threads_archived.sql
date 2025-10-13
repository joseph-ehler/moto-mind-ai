-- Migration: Add soft delete support to conversation threads

-- 1. Add archived_at column
ALTER TABLE conversation_threads
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 2. Add comment
COMMENT ON COLUMN conversation_threads.archived_at IS 'Soft delete timestamp. When set, thread is hidden from active conversations but retained for data integrity.';

-- 3. Create index for filtering active threads
CREATE INDEX IF NOT EXISTS idx_conversation_threads_active 
ON conversation_threads(vehicle_id, updated_at DESC) 
WHERE archived_at IS NULL;

-- 4. Update existing queries to exclude archived threads by default
-- (This is handled in application code - API endpoints should filter WHERE archived_at IS NULL)
