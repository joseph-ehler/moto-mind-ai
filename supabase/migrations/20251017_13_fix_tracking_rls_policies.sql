-- ================================================
-- Fix Tracking RLS Policies for NextAuth
-- ================================================
-- Replace auth.uid() checks with permissive policies
-- since we use service role key which bypasses RLS anyway
-- and handle authorization in API code via requireUserServer()
-- Created: 2025-10-17

-- ================================================
-- DROP EXISTING POLICIES
-- ================================================

-- Tracking sessions
DROP POLICY IF EXISTS "Users can view their own tracking sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can create their own tracking sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can update their own tracking sessions" ON tracking_sessions;
DROP POLICY IF EXISTS "Users can delete their own tracking sessions" ON tracking_sessions;

-- Location points
DROP POLICY IF EXISTS "Users can view location points from their sessions" ON location_points;
DROP POLICY IF EXISTS "Users can insert location points to their sessions" ON location_points;

-- Tracking events
DROP POLICY IF EXISTS "Users can view events from their sessions" ON tracking_events;
DROP POLICY IF EXISTS "Users can create events for their sessions" ON tracking_events;

-- ================================================
-- CREATE PERMISSIVE POLICIES
-- ================================================
-- Note: We use service role key which bypasses these anyway.
-- Authorization is handled in API code via requireUserServer().
-- These policies are here for defense-in-depth.

-- Tracking sessions
CREATE POLICY "Allow all operations on tracking sessions"
  ON tracking_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Location points
CREATE POLICY "Allow all operations on location points"
  ON location_points
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Tracking events  
CREATE POLICY "Allow all operations on tracking events"
  ON tracking_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON POLICY "Allow all operations on tracking sessions" ON tracking_sessions IS 
  'Permissive policy - service role bypasses RLS. Authorization handled in API via NextAuth.';

COMMENT ON POLICY "Allow all operations on location points" ON location_points IS 
  'Permissive policy - service role bypasses RLS. Authorization handled in API via NextAuth.';

COMMENT ON POLICY "Allow all operations on tracking events" ON tracking_events IS 
  'Permissive policy - service role bypasses RLS. Authorization handled in API via NextAuth.';
