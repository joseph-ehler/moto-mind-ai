-- Migrate existing edit_changes data to the new edit_history format
-- This ensures that events edited before the history feature still show their edit history

UPDATE public.vehicle_events 
SET edit_history = CASE 
  WHEN edit_changes IS NOT NULL AND edited_at IS NOT NULL THEN
    JSONB_BUILD_ARRAY(
      JSONB_BUILD_OBJECT(
        'timestamp', edited_at,
        'reason', COALESCE(edit_reason, 'Previous edit'),
        'changes', edit_changes
      )
    )
  ELSE 
    NULL
END
WHERE edit_changes IS NOT NULL 
  AND edited_at IS NOT NULL 
  AND (edit_history IS NULL OR JSONB_ARRAY_LENGTH(edit_history) = 0);

-- Add a comment about the migration
COMMENT ON COLUMN public.vehicle_events.edit_history IS 'Array of edit entries: [{"timestamp": "ISO", "reason": "string", "changes": {...}}] - migrated from edit_changes';
