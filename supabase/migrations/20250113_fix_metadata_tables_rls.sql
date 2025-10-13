-- Fix RLS policies for photo_metadata and event_photos tables

-- ============================================================================
-- 1. FIX PHOTO_METADATA TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS photo_metadata_tenant_isolation ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_insert ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_select ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_update ON photo_metadata;
DROP POLICY IF EXISTS photo_metadata_delete ON photo_metadata;

-- Create permissive policies for development
CREATE POLICY photo_metadata_insert ON photo_metadata
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY photo_metadata_select ON photo_metadata
  FOR SELECT
  USING (true);

CREATE POLICY photo_metadata_update ON photo_metadata
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY photo_metadata_delete ON photo_metadata
  FOR DELETE
  USING (true);

COMMENT ON POLICY photo_metadata_insert ON photo_metadata IS 'Allow all inserts (development)';
COMMENT ON POLICY photo_metadata_select ON photo_metadata IS 'Allow all reads (development)';
COMMENT ON POLICY photo_metadata_update ON photo_metadata IS 'Allow all updates (development)';
COMMENT ON POLICY photo_metadata_delete ON photo_metadata IS 'Allow all deletes (development)';

-- ============================================================================
-- 2. FIX EVENT_PHOTOS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS event_photos_tenant_isolation ON event_photos;
DROP POLICY IF EXISTS event_photos_insert ON event_photos;
DROP POLICY IF EXISTS event_photos_select ON event_photos;
DROP POLICY IF EXISTS event_photos_update ON event_photos;
DROP POLICY IF EXISTS event_photos_delete ON event_photos;

-- Create permissive policies for development
CREATE POLICY event_photos_insert ON event_photos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY event_photos_select ON event_photos
  FOR SELECT
  USING (true);

CREATE POLICY event_photos_update ON event_photos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY event_photos_delete ON event_photos
  FOR DELETE
  USING (true);

COMMENT ON POLICY event_photos_insert ON event_photos IS 'Allow all inserts (development)';
COMMENT ON POLICY event_photos_select ON event_photos IS 'Allow all reads (development)';
COMMENT ON POLICY event_photos_update ON event_photos IS 'Allow all updates (development)';
COMMENT ON POLICY event_photos_delete ON event_photos IS 'Allow all deletes (development)';

-- ============================================================================
-- 3. VERIFY
-- ============================================================================

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('photo_metadata', 'event_photos')
GROUP BY tablename
ORDER BY tablename;
