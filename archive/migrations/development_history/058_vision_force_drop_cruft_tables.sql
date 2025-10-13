-- =============================================================================
-- FORCE DROP ALL CRUFT TABLES - NUCLEAR CLEANUP
-- =============================================================================
-- This script forcefully drops all the technical debt tables that should have been eliminated

-- DISABLE all foreign key checks temporarily to force drops
SET session_replication_role = replica;

-- =============================================================================
-- DROP OLD EVENT TABLES (replaced by vehicle_events)
-- =============================================================================
DROP TABLE IF EXISTS public.fuel_logs CASCADE;
DROP TABLE IF EXISTS public.service_records CASCADE;
DROP TABLE IF EXISTS public.odometer_readings CASCADE;
DROP TABLE IF EXISTS public.manual_events CASCADE;

-- =============================================================================
-- DROP FEATURE BLOAT TABLES (unused/abandoned features)
-- =============================================================================
DROP TABLE IF EXISTS public.explanations CASCADE;
DROP TABLE IF EXISTS public.vehicle_generations CASCADE;
DROP TABLE IF EXISTS public.vehicle_metrics CASCADE;
DROP TABLE IF EXISTS public.vehicle_onboarding CASCADE;
DROP TABLE IF EXISTS public.provider_integrations CASCADE;
DROP TABLE IF EXISTS public.vin_cache CASCADE;
DROP TABLE IF EXISTS public.image_generation_queue CASCADE;

-- =============================================================================
-- DROP BILLING/SUBSCRIPTION CRUFT (if not needed)
-- =============================================================================
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.plan_limits CASCADE;
DROP TABLE IF EXISTS public.usage_counters CASCADE;

-- =============================================================================
-- DROP INFRASTRUCTURE CRUFT
-- =============================================================================
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.uploads CASCADE;
DROP TABLE IF EXISTS public.users CASCADE; -- Replaced by Supabase auth.users + profiles
DROP TABLE IF EXISTS public.vehicles_naming_backup CASCADE; -- Obviously a backup table

-- =============================================================================
-- DROP MIGRATION CRUFT
-- =============================================================================
DROP TABLE IF EXISTS public.schema_migrations CASCADE;

-- =============================================================================
-- DROP OLD VIEWS THAT REFERENCE DROPPED TABLES
-- =============================================================================
DROP VIEW IF EXISTS public.odometer_reading_stats CASCADE;
DROP VIEW IF EXISTS public.service_record_stats CASCADE;
DROP VIEW IF EXISTS public.performance_dashboard CASCADE;
DROP VIEW IF EXISTS public.vehicle_current_mileage CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- =============================================================================
-- VERIFICATION: Show remaining tables (should be only 7 core + partitions)
-- =============================================================================
SELECT 'REMAINING TABLES:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
ORDER BY table_name;

SELECT 'REMAINING VIEWS:' as status;
SELECT table_name AS view_name FROM information_schema.views 
WHERE table_schema = 'public' 
ORDER BY table_name;
