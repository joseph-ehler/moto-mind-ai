-- Phase 3: Final Naming Field Cleanup (Local Development)
-- SAFE: Remove deprecated label/nickname columns after successful validation
-- 
-- ROLLBACK PLAN (if needed):
-- UPDATE vehicles SET label = b.label, nickname = b.nickname 
-- FROM vehicles_naming_backup b WHERE vehicles.id = b.id;

-- =============================================================================
-- FINAL VALIDATION BEFORE CLEANUP
-- =============================================================================

-- Verify backup table exists and has data
SELECT 
  COUNT(*) as backup_row_count,
  'Backup should have 5 rows' as note
FROM vehicles_naming_backup;

-- Verify all vehicles have display_name
SELECT 
  COUNT(*) as vehicles_with_display_name,
  'Should be 5' as expected
FROM vehicles 
WHERE display_name IS NOT NULL AND display_name != '';

-- Final check for any remaining conflicts (should be 0)
SELECT 
  COUNT(*) as final_conflicts,
  'Should be 0 for safe removal' as status
FROM vehicles 
WHERE label IS DISTINCT FROM display_name 
   OR (nickname IS NOT NULL AND nickname IS DISTINCT FROM display_name);

-- =============================================================================
-- PHASE 3: REMOVE DEPRECATED COLUMNS
-- =============================================================================

-- Remove the deprecated label column
ALTER TABLE vehicles DROP COLUMN IF EXISTS label;

-- Remove the deprecated nickname column  
ALTER TABLE vehicles DROP COLUMN IF EXISTS nickname;

-- =============================================================================
-- POST-CLEANUP VALIDATION
-- =============================================================================

-- Verify columns were removed
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify display_name is still intact
SELECT 
  id,
  display_name,
  make,
  model
FROM vehicles 
ORDER BY created_at DESC
LIMIT 5;

-- Clean up backup table (optional - keep for extra safety in dev)
-- DROP TABLE IF EXISTS vehicles_naming_backup;

-- Success message
SELECT 'Phase 3 COMPLETE: Deprecated naming columns removed successfully!' as final_status;

-- =============================================================================
-- SCHEMA VERIFICATION FOR WEEK 4-5 PLANNING
-- =============================================================================

-- Current vehicles table schema after cleanup
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'id' THEN 'Primary Key'
    WHEN column_name = 'tenant_id' THEN 'Tenant Isolation'
    WHEN column_name = 'display_name' THEN 'CANONICAL Name Field'
    WHEN column_name IN ('created_at', 'updated_at') THEN 'Audit Timestamps'
    WHEN column_name = 'deleted_at' THEN 'Soft Delete'
    WHEN column_name LIKE '%_id' THEN 'Foreign Key'
    ELSE 'Data Field'
  END as field_category
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
