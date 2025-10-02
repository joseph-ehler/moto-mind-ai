-- Week 2: Naming Field Consolidation Migration
-- SAFE: Zero data loss risk - all vehicles have identical label/display_name values
-- 
-- ROLLBACK PLAN:
-- UPDATE vehicles SET label = b.label, nickname = b.nickname 
-- FROM vehicles_naming_backup b WHERE vehicles.id = b.id;
-- DROP TABLE vehicles_naming_backup;

-- =============================================================================
-- PHASE 1: PRE-MIGRATION VALIDATION AND BACKUP
-- =============================================================================

-- Verify no data loss scenarios (should return 0)
SELECT 
  COUNT(*) as potential_data_loss_vehicles,
  'If this is > 0, STOP and review manually' as warning
FROM vehicles 
WHERE label IS DISTINCT FROM display_name 
   OR (nickname IS NOT NULL AND nickname IS DISTINCT FROM display_name);

-- Create backup table for safety
CREATE TABLE IF NOT EXISTS vehicles_naming_backup AS 
SELECT 
  id, 
  label, 
  nickname, 
  display_name, 
  created_at,
  now() as backup_created_at
FROM vehicles;

-- Verify backup created successfully
SELECT 
  COUNT(*) as backup_row_count,
  'Should match vehicles table count' as note
FROM vehicles_naming_backup;

-- =============================================================================
-- PHASE 2: MARK COLUMNS AS DEPRECATED (SAFE)
-- =============================================================================

-- Add deprecation comments (safe, no data changes)
COMMENT ON COLUMN vehicles.label IS 
  'DEPRECATED as of Week 2 cleanup: Use display_name instead. Scheduled for removal after monitoring period.';

COMMENT ON COLUMN vehicles.nickname IS 
  'DEPRECATED as of Week 2 cleanup: Use display_name instead. Scheduled for removal after monitoring period.';

COMMENT ON COLUMN vehicles.display_name IS 
  'CANONICAL vehicle name field. Consolidated from label/nickname during Week 2 cleanup.';

-- =============================================================================
-- PHASE 3: VALIDATION QUERIES (RUN THESE TO VERIFY SUCCESS)
-- =============================================================================

-- Verify all vehicles have display_name (should be 5)
SELECT COUNT(*) as vehicles_with_display_name
FROM vehicles 
WHERE display_name IS NOT NULL AND display_name != '';

-- Check for any remaining conflicts (should be 0)
SELECT COUNT(*) as remaining_conflicts
FROM vehicles 
WHERE label IS DISTINCT FROM display_name;

-- Sample of current naming state
SELECT 
  id,
  label,
  nickname,
  display_name,
  CASE 
    WHEN label = display_name THEN 'SAFE'
    ELSE 'REVIEW'
  END as consolidation_status
FROM vehicles 
ORDER BY created_at DESC
LIMIT 5;

-- Success message
SELECT 'Week 2 naming consolidation: PHASE 1-2 COMPLETE - Ready for monitoring period' as status;

-- =============================================================================
-- PHASE 4: COLUMN REMOVAL (EXECUTE AFTER 7-14 DAYS OF MONITORING)
-- =============================================================================

-- ONLY RUN THESE AFTER CONFIRMING NO APPLICATION ERRORS FOR 1-2 WEEKS:

-- DROP COLUMN label;
-- DROP COLUMN nickname;
-- DROP TABLE vehicles_naming_backup;

-- Final verification after column removal:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'vehicles' AND column_name IN ('label', 'nickname');
-- (Should return no rows)
