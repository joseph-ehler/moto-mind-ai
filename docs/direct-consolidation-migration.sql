-- Week 2: Direct Naming Field Consolidation Migration
-- SAFE: Zero data loss risk - execute Phase 1-2 immediately
-- 
-- ROLLBACK PLAN:
-- UPDATE vehicles SET label = b.label, nickname = b.nickname 
-- FROM vehicles_naming_backup b WHERE vehicles.id = b.id;
-- DROP TABLE vehicles_naming_backup;

-- =============================================================================
-- PHASE 1: PRE-MIGRATION VALIDATION
-- =============================================================================

-- Verify no data loss scenarios (should return 0)
SELECT 
  COUNT(*) as potential_data_loss_vehicles,
  'STOP if this is > 0' as warning
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
-- PHASE 2: ADD DEPRECATION COMMENTS (SAFE - NO DATA CHANGES)
-- =============================================================================

-- Mark label column as deprecated
COMMENT ON COLUMN vehicles.label IS 
  'DEPRECATED as of Week 2 cleanup: Use display_name instead. Scheduled for removal after monitoring period.';

-- Mark nickname column as deprecated
COMMENT ON COLUMN vehicles.nickname IS 
  'DEPRECATED as of Week 2 cleanup: Use display_name instead. Scheduled for removal after monitoring period.';

-- Mark display_name as canonical
COMMENT ON COLUMN vehicles.display_name IS 
  'CANONICAL vehicle name field. Consolidated from label/nickname during Week 2 cleanup.';

-- =============================================================================
-- VALIDATION QUERIES (RUN THESE TO VERIFY SUCCESS)
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

-- Verify comments were added
SELECT 
  column_name,
  col_description(pgc.oid, ordinal_position) as comment
FROM information_schema.columns isc
JOIN pg_class pgc ON pgc.relname = isc.table_name
WHERE table_name = 'vehicles' 
  AND column_name IN ('label', 'nickname', 'display_name')
ORDER BY column_name;

-- Success message
SELECT 'Week 2 naming consolidation: PHASE 1-2 COMPLETE - Ready for monitoring period' as status;

-- =============================================================================
-- MONITORING PERIOD: 7-14 DAYS
-- =============================================================================

-- During monitoring period, watch for:
-- 1. Application errors mentioning 'label' or 'nickname'
-- 2. API responses that might still reference old fields
-- 3. UI components that might break
-- 4. Any user-reported issues with vehicle names

-- =============================================================================
-- PHASE 3: COLUMN REMOVAL (EXECUTE AFTER MONITORING PERIOD)
-- =============================================================================

-- ONLY RUN THESE AFTER 7-14 DAYS OF SUCCESSFUL MONITORING:

-- Remove deprecated columns
-- ALTER TABLE vehicles DROP COLUMN label;
-- ALTER TABLE vehicles DROP COLUMN nickname;

-- Clean up backup table
-- DROP TABLE vehicles_naming_backup;

-- Final verification after column removal:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'vehicles' AND column_name IN ('label', 'nickname');
-- (Should return no rows)

-- Final success message:
-- SELECT 'Week 2 naming consolidation: COMPLETE - Redundant columns removed' as final_status;
