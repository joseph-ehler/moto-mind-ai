-- Migration: Fix RLS Policies for NextAuth
-- Created: 2025-10-18
-- Purpose: Replace auth.uid() policies with permissive policies
-- Reason: This app uses NextAuth, not Supabase Auth
--         auth.uid() returns NULL with NextAuth
--         Authorization happens in API layer via requireUserServer()

-- =====================================================
-- PART 1: FIX TRACKING_SESSIONS POLICIES
-- =====================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view their own tracking sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can create their own tracking sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can update their own tracking sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can delete their own tracking sessions" ON tracking_sessions;

-- Create permissive policy (auth in API)
CREATE POLICY "Allow all operations on tracking_sessions"
  ON tracking_sessions FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on tracking_sessions" ON tracking_sessions IS 
  'Permissive - auth handled in API via NextAuth. Service role bypasses RLS anyway.';

-- =====================================================
-- PART 2: FIX LOCATION_POINTS POLICIES
-- =====================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view location points from their sessions" ON location_points;
DROP POLICY IF EXISTS "Users can insert location points to their sessions" ON location_points;

-- Create permissive policy
CREATE POLICY "Allow all operations on location_points"
  ON location_points FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on location_points" ON location_points IS 
  'Permissive - auth handled in API via NextAuth. Service role bypasses RLS anyway.';

-- =====================================================
-- PART 3: FIX TRACKING_EVENTS POLICIES
-- =====================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view events from their sessions" ON tracking_events;
DROP POLICY IF EXISTS "Users can create events for their sessions" ON tracking_events;

-- Create permissive policy
CREATE POLICY "Allow all operations on tracking_events"
  ON tracking_events FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on tracking_events" ON tracking_events IS 
  'Permissive - auth handled in API via NextAuth. Service role bypasses RLS anyway.';

-- =====================================================
-- PART 4: FIX LOGS POLICIES (if exists)
-- =====================================================

DO $$
BEGIN
  -- Check if logs table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'logs'
  ) THEN
    -- Drop broken policies
    DROP POLICY IF EXISTS "Users can view their tenant's logs" ON logs;
    DROP POLICY IF EXISTS "Service role can manage all logs" ON logs;
    
    -- Create permissive policy
    EXECUTE 'CREATE POLICY "Allow all operations on logs"
      ON logs FOR ALL
      USING (true) WITH CHECK (true)';
    
    EXECUTE 'COMMENT ON POLICY "Allow all operations on logs" ON logs IS 
      ''Permissive - auth handled in API via NextAuth. Service role bypasses RLS anyway.''';
    
    RAISE NOTICE '✅ Fixed logs policies';
  END IF;
END $$;

-- =====================================================
-- PART 5: FIX FAVORITE_STATIONS POLICIES (if exists)
-- =====================================================

DO $$
BEGIN
  -- Check if favorite_stations table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'favorite_stations'
  ) THEN
    -- Drop broken policies
    DROP POLICY IF EXISTS "Users can view their own favorites" ON favorite_stations;
    DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorite_stations;
    DROP POLICY IF EXISTS "Users can update their own favorites" ON favorite_stations;
    DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorite_stations;
    
    -- Create permissive policy
    EXECUTE 'CREATE POLICY "Allow all operations on favorite_stations"
      ON favorite_stations FOR ALL
      USING (true) WITH CHECK (true)';
    
    EXECUTE 'COMMENT ON POLICY "Allow all operations on favorite_stations" ON favorite_stations IS 
      ''Permissive - auth handled in API via NextAuth. Service role bypasses RLS anyway.''';
    
    RAISE NOTICE '✅ Fixed favorite_stations policies';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count fixed policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND policyname LIKE 'Allow all operations on%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS Policies Fixed for NextAuth!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed tables:';
  RAISE NOTICE '  • tracking_sessions';
  RAISE NOTICE '  • location_points';
  RAISE NOTICE '  • tracking_events';
  RAISE NOTICE '  • logs (if exists)';
  RAISE NOTICE '  • favorite_stations (if exists)';
  RAISE NOTICE '';
  RAISE NOTICE 'New permissive policies: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Authorization now handled in API layer';
  RAISE NOTICE '✅ No more auth.uid() NULL errors';
  RAISE NOTICE '✅ Service role access unaffected';
  RAISE NOTICE '========================================';
END $$;
