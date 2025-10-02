-- MotoMind Database Cleanup Execution Script
-- CRITICAL: Run in transaction with rollback capability
-- BACKUP DATABASE BEFORE RUNNING

BEGIN;

-- =============================================================================
-- PHASE 1: REMOVE EMPTY TABLES (SAFE)
-- =============================================================================

-- Confirmed empty tables - safe to remove
DROP TABLE IF EXISTS vehicle_metrics CASCADE;
DROP TABLE IF EXISTS image_generation_queue CASCADE;  
DROP TABLE IF EXISTS provider_integrations CASCADE;
DROP TABLE IF EXISTS usage_counters CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS manual_events CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;

SELECT 'Phase 1 Complete: Removed 7 empty tables' as status;

-- =============================================================================
-- PHASE 2: MIGRATE LEGACY EVENT DATA
-- =============================================================================

-- Check current vehicle_events count
SELECT COUNT(*) as current_vehicle_events FROM vehicle_events;

-- 1. Migrate odometer readings (4 rows expected)
INSERT INTO vehicle_events (tenant_id, vehicle_id, type, date, miles, payload, created_at, updated_at)
SELECT 
  tenant_id,
  vehicle_id,
  'odometer' as type,
  reading_date::date as date,
  mileage as miles,
  jsonb_build_object(
    'source', COALESCE(source, 'migrated'),
    'confidence_score', confidence_score,
    'reading_time', reading_time,
    'notes', COALESCE(notes, ''),
    'migrated_from', 'odometer_readings',
    'migration_date', now()
  ) as payload,
  created_at,
  COALESCE(updated_at, created_at)
FROM odometer_readings
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_events ve 
  WHERE ve.vehicle_id = odometer_readings.vehicle_id 
    AND ve.type = 'odometer'
    AND ve.date = odometer_readings.reading_date::date
    AND ve.miles = odometer_readings.mileage
);

-- 2. Migrate fuel logs (2 rows expected)
INSERT INTO vehicle_events (tenant_id, vehicle_id, type, date, miles, payload, created_at, updated_at)
SELECT 
  tenant_id,
  vehicle_id,
  'fuel' as type,
  date,
  NULL as miles, -- Will be inferred by API if needed
  jsonb_build_object(
    'total_amount', total_amount,
    'gallons', gallons,
    'price_per_gallon', price_per_gallon,
    'station', COALESCE(station_name, 'Unknown'),
    'fuel_type', COALESCE(fuel_type, 'regular'),
    'source', COALESCE(source, 'migrated'),
    'migrated_from', 'fuel_logs',
    'migration_date', now()
  ) as payload,
  created_at,
  COALESCE(updated_at, created_at)
FROM fuel_logs
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_events ve 
  WHERE ve.vehicle_id = fuel_logs.vehicle_id 
    AND ve.type = 'fuel'
    AND ve.date = fuel_logs.date
    AND (ve.payload->>'total_amount')::numeric = fuel_logs.total_amount
);

-- 3. Migrate service records (6 rows expected)
INSERT INTO vehicle_events (tenant_id, vehicle_id, type, date, miles, payload, created_at, updated_at)
SELECT 
  tenant_id,
  vehicle_id,
  'maintenance' as type,
  service_date as date,
  odometer_reading as miles,
  jsonb_build_object(
    'kind', COALESCE(service_type, 'Service'),
    'service_type', service_type,
    'total_amount', total_cost,
    'vendor', COALESCE(shop_name, 'Unknown'),
    'description', COALESCE(description, ''),
    'labor_cost', labor_cost,
    'parts_cost', parts_cost,
    'source', COALESCE(source, 'migrated'),
    'migrated_from', 'service_records',
    'migration_date', now()
  ) as payload,
  created_at,
  COALESCE(updated_at, created_at)
FROM service_records
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_events ve 
  WHERE ve.vehicle_id = service_records.vehicle_id 
    AND ve.type = 'maintenance'
    AND ve.date = service_records.service_date
    AND (ve.payload->>'total_amount')::numeric = service_records.total_cost
);

-- Verify migration results
SELECT 
  'Migration Summary' as report,
  type,
  COUNT(*) as migrated_count,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM vehicle_events 
WHERE payload->>'migrated_from' IS NOT NULL
GROUP BY type
ORDER BY type;

-- Check total vehicle_events count after migration
SELECT COUNT(*) as total_vehicle_events_after_migration FROM vehicle_events;

SELECT 'Phase 2 Complete: Migrated legacy event data' as status;

-- =============================================================================
-- PHASE 3: VERIFY MIGRATION SUCCESS
-- =============================================================================

-- Verify no data loss - compare counts
SELECT 
  'Data Verification' as report,
  (SELECT COUNT(*) FROM odometer_readings) as original_odometer_count,
  (SELECT COUNT(*) FROM vehicle_events WHERE payload->>'migrated_from' = 'odometer_readings') as migrated_odometer_count,
  (SELECT COUNT(*) FROM fuel_logs) as original_fuel_count,
  (SELECT COUNT(*) FROM vehicle_events WHERE payload->>'migrated_from' = 'fuel_logs') as migrated_fuel_count,
  (SELECT COUNT(*) FROM service_records) as original_service_count,
  (SELECT COUNT(*) FROM vehicle_events WHERE payload->>'migrated_from' = 'service_records') as migrated_service_count;

-- =============================================================================
-- PHASE 4: REMOVE LEGACY TABLES (ONLY IF MIGRATION VERIFIED)
-- =============================================================================

-- UNCOMMENT THESE LINES ONLY AFTER VERIFYING MIGRATION SUCCESS:
-- DROP TABLE odometer_readings CASCADE;
-- DROP TABLE fuel_logs CASCADE;  
-- DROP TABLE service_records CASCADE;

-- SELECT 'Phase 4 Complete: Removed legacy tables' as status;

-- =============================================================================
-- PHASE 5: CLEANUP AND OPTIMIZATION
-- =============================================================================

-- Add indexes for better performance on migrated data
CREATE INDEX IF NOT EXISTS idx_vehicle_events_migrated 
  ON vehicle_events(vehicle_id, type, date DESC) 
  WHERE payload->>'migrated_from' IS NOT NULL;

-- Update statistics
ANALYZE vehicle_events;

-- Final summary
SELECT 
  'CLEANUP COMPLETE' as status,
  COUNT(*) as total_vehicle_events,
  COUNT(CASE WHEN payload->>'migrated_from' IS NOT NULL THEN 1 END) as migrated_events,
  COUNT(CASE WHEN payload->>'migrated_from' IS NULL THEN 1 END) as original_events
FROM vehicle_events;

-- COMMIT only if everything looks correct
-- COMMIT;

-- If anything went wrong, run: ROLLBACK;
