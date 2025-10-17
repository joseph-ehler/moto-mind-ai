-- Migration: Add Performance Indexes
-- Generated: 2025-10-16
-- Purpose: Add critical and high-priority indexes for API performance

-- ============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable pg_trgm for fuzzy text search (used by gin_trgm_ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Try to enable PostGIS for geospatial operations (optional, requires superuser)
-- If this fails, we'll skip geospatial indexes
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
  RAISE NOTICE 'PostGIS extension enabled';
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PostGIS not available (requires superuser) - skipping geography indexes';
WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS not available - skipping geography indexes';
END $$;

-- ============================================================================
-- CRITICAL INDEXES - Tenant Isolation
-- ============================================================================
-- These are essential for RLS performance

-- Vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id 
  ON vehicles(tenant_id);

-- Vehicle Events
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_id 
  ON vehicle_events(tenant_id);

-- Garages
CREATE INDEX IF NOT EXISTS idx_garages_tenant_id 
  ON garages(tenant_id);

-- Vehicle Images
CREATE INDEX IF NOT EXISTS idx_vehicle_images_tenant_id 
  ON vehicle_images(tenant_id);

-- Photo Metadata
CREATE INDEX IF NOT EXISTS idx_photo_metadata_tenant_id 
  ON photo_metadata(tenant_id);

-- Capture Sessions
CREATE INDEX IF NOT EXISTS idx_capture_sessions_tenant_id 
  ON capture_sessions(tenant_id);

-- ============================================================================
-- HIGH PRIORITY INDEXES - Foreign Keys
-- ============================================================================

-- Vehicle Events -> Vehicle relationship (most queried)
CREATE INDEX IF NOT EXISTS idx_vehicle_events_vehicle_id 
  ON vehicle_events(vehicle_id);

-- Vehicle Events -> Type filtering
CREATE INDEX IF NOT EXISTS idx_vehicle_events_type 
  ON vehicle_events(type);

-- Vehicle Images -> Vehicle relationship
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id 
  ON vehicle_images(vehicle_id);

-- Photo Metadata -> Image relationship (not vehicle, as photo_metadata doesn't have vehicle_id)
-- Photo metadata is linked to images, which are linked to vehicles
-- No direct vehicle_id column exists on photo_metadata

-- Capture Sessions -> Vehicle relationship
CREATE INDEX IF NOT EXISTS idx_capture_sessions_vehicle_id 
  ON capture_sessions(vehicle_id);

-- Garages -> Vehicles (if garage_id exists on vehicles)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'garage_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_garage_id ON vehicles(garage_id);
  END IF;
END $$;

-- ============================================================================
-- COMPOSITE INDEXES - Date Range Queries with Tenant Isolation
-- ============================================================================

-- Vehicle Events: Tenant + Date (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_date 
  ON vehicle_events(tenant_id, date DESC);

-- Vehicle Events: Tenant + Vehicle + Date
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_vehicle_date 
  ON vehicle_events(tenant_id, vehicle_id, date DESC);

-- Vehicle Events: Tenant + Type + Date
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_type_date 
  ON vehicle_events(tenant_id, type, date DESC);

-- ============================================================================
-- SEARCH INDEXES - Vendor and Location Searches
-- ============================================================================

-- Vehicle Events: Vendor search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_vehicle_events_vendor_lower 
  ON vehicle_events(LOWER(vendor));

CREATE INDEX IF NOT EXISTS idx_vehicle_events_display_vendor_lower 
  ON vehicle_events(LOWER(display_vendor));

-- Vehicle Events: Location search (partial text)
-- Note: pg_trgm extension already enabled at top of migration
CREATE INDEX IF NOT EXISTS idx_vehicle_events_station_address 
  ON vehicle_events USING gin(station_address gin_trgm_ops);

-- ============================================================================
-- GEOSPATIAL INDEXES - Location-Based Queries
-- ============================================================================

-- Vehicle Events: Geospatial queries
-- Convert lat/lng to PostGIS geography for efficient distance queries
-- Only if PostGIS is available
DO $$
BEGIN
  -- Check if PostGIS is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    -- Add geography column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vehicle_events' AND column_name = 'location'
    ) THEN
      ALTER TABLE vehicle_events 
        ADD COLUMN location GEOGRAPHY(POINT, 4326);
      
      -- Populate from existing lat/lng
      UPDATE vehicle_events 
      SET location = ST_SetSRID(ST_MakePoint(geocoded_lng, geocoded_lat), 4326)::geography
      WHERE geocoded_lat IS NOT NULL AND geocoded_lng IS NOT NULL;
      
      -- Add trigger to auto-update location when lat/lng changes
      CREATE OR REPLACE FUNCTION update_vehicle_events_location()
      RETURNS TRIGGER AS $func$
      BEGIN
        IF NEW.geocoded_lat IS NOT NULL AND NEW.geocoded_lng IS NOT NULL THEN
          NEW.location = ST_SetSRID(ST_MakePoint(NEW.geocoded_lng, NEW.geocoded_lat), 4326)::geography;
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
      
      CREATE TRIGGER trigger_update_vehicle_events_location
      BEFORE INSERT OR UPDATE ON vehicle_events
      FOR EACH ROW
      EXECUTE FUNCTION update_vehicle_events_location();
      
      -- Create GIST index on geography column
      CREATE INDEX IF NOT EXISTS idx_vehicle_events_location 
        ON vehicle_events USING GIST(location);
      
      RAISE NOTICE '✅ PostGIS geography column and index created';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  PostGIS not available - using simple lat/lng indexes instead';
  END IF;
END $$;

-- Also keep B-tree indexes on lat/lng for simple range queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_geocoded_lat 
  ON vehicle_events(geocoded_lat);

CREATE INDEX IF NOT EXISTS idx_vehicle_events_geocoded_lng 
  ON vehicle_events(geocoded_lng);

-- Composite for bounding box queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_lat_lng 
  ON vehicle_events(geocoded_lat, geocoded_lng);

-- ============================================================================
-- SOFT DELETE SUPPORT
-- ============================================================================

-- Vehicle Events: Exclude deleted items (most queries filter by deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_vehicle_events_deleted_at 
  ON vehicle_events(deleted_at) 
  WHERE deleted_at IS NULL;

-- Composite: Active events by tenant
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_active 
  ON vehicle_events(tenant_id, date DESC) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- AGGREGATION SUPPORT
-- ============================================================================

-- Vehicle Events: Sum/Avg calculations
CREATE INDEX IF NOT EXISTS idx_vehicle_events_tenant_amounts 
  ON vehicle_events(tenant_id, date, total_amount, gallons) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- MAINTENANCE INDEXES
-- ============================================================================

-- User Maintenance Preferences
-- Note: This table doesn't have tenant_id, only user_id and vehicle_id
CREATE INDEX IF NOT EXISTS idx_user_maintenance_prefs_user 
  ON user_maintenance_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_maintenance_prefs_vehicle 
  ON user_maintenance_preferences(vehicle_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  critical_indexes TEXT[] := ARRAY[
    'idx_vehicles_tenant_id',
    'idx_vehicle_events_tenant_id',
    'idx_garages_tenant_id'
  ];
  index_name TEXT;
  index_exists BOOLEAN;
BEGIN
  FOREACH index_name IN ARRAY critical_indexes
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = index_name
    ) INTO index_exists;
    
    IF NOT index_exists THEN
      RAISE EXCEPTION 'Critical index missing: %', index_name;
    END IF;
    
    RAISE NOTICE '✅ Index exists: %', index_name;
  END LOOP;
  
  RAISE NOTICE '✅ All performance indexes created successfully';
  RAISE NOTICE 'ℹ️  Run ANALYZE to update query planner statistics';
END $$;

-- Update statistics for query planner
ANALYZE vehicles;
ANALYZE vehicle_events;
ANALYZE garages;
ANALYZE profiles;
ANALYZE user_maintenance_preferences;
