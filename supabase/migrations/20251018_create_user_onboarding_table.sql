-- Migration: Create User Onboarding Table
-- Created: 2025-10-18
-- Purpose: Track user onboarding progress for activation optimization

-- =====================================================
-- USER ONBOARDING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- NextAuth user ID (TEXT, not UUID!)
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Progress tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  current_step TEXT DEFAULT 'welcome' CHECK (current_step IN (
    'welcome',           -- Initial welcome screen
    'add_vehicle',       -- Adding first vehicle
    'dashboard',         -- Reached dashboard
    'complete'           -- Onboarding complete
  )),
  
  -- Completion flags
  vehicle_added BOOLEAN DEFAULT false,
  dashboard_visited BOOLEAN DEFAULT false,
  first_ride_tracked BOOLEAN DEFAULT false,
  
  -- User preferences
  skip_onboarding BOOLEAN DEFAULT false,
  
  -- Analytics metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One onboarding per user
  UNIQUE(user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX idx_user_onboarding_tenant_id ON user_onboarding(tenant_id);
CREATE INDEX idx_user_onboarding_current_step ON user_onboarding(current_step);
CREATE INDEX idx_user_onboarding_completed_at ON user_onboarding(completed_at) 
  WHERE completed_at IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on user_onboarding"
  ON user_onboarding FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on user_onboarding" ON user_onboarding IS 
  'Permissive - auth handled in API via NextAuth';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_timestamp();

-- Auto-complete when all flags are true
CREATE OR REPLACE FUNCTION auto_complete_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- If vehicle added and dashboard visited, mark as complete
  IF NEW.vehicle_added = true 
     AND NEW.dashboard_visited = true 
     AND NEW.completed_at IS NULL 
  THEN
    NEW.completed_at = NOW();
    NEW.current_step = 'complete';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_complete_onboarding
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_onboarding();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_onboarding IS 
  'Tracks user onboarding progress for activation metrics and UX optimization';

COMMENT ON COLUMN user_onboarding.user_id IS 
  'NextAuth user ID (TEXT format, e.g., email or "104135...")';

COMMENT ON COLUMN user_onboarding.current_step IS 
  'Current onboarding step for resuming interrupted flows';

COMMENT ON COLUMN user_onboarding.metadata IS 
  'Flexible storage for A/B test variants, referral source, etc.';

-- =====================================================
-- HELPER FUNCTION: Initialize Onboarding
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_user_onboarding(
  p_user_id TEXT,
  p_tenant_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_onboarding_id UUID;
BEGIN
  -- Insert or return existing
  INSERT INTO user_onboarding (user_id, tenant_id)
  VALUES (p_user_id, p_tenant_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_onboarding_id;
  
  RETURN v_onboarding_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION initialize_user_onboarding IS 
  'Creates or updates onboarding record for user (idempotent)';

-- =====================================================
-- HELPER FUNCTION: Update Progress
-- =====================================================

CREATE OR REPLACE FUNCTION update_onboarding_progress(
  p_user_id TEXT,
  p_step TEXT,
  p_flags JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE user_onboarding
  SET 
    current_step = COALESCE(p_step, current_step),
    vehicle_added = COALESCE((p_flags->>'vehicle_added')::BOOLEAN, vehicle_added),
    dashboard_visited = COALESCE((p_flags->>'dashboard_visited')::BOOLEAN, dashboard_visited),
    first_ride_tracked = COALESCE((p_flags->>'first_ride_tracked')::BOOLEAN, first_ride_tracked),
    metadata = metadata || COALESCE(p_flags, '{}'::jsonb)
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_onboarding_progress IS 
  'Updates onboarding progress and flags for a user';

-- =====================================================
-- ANALYTICS VIEW
-- =====================================================

CREATE OR REPLACE VIEW onboarding_analytics AS
SELECT 
  COUNT(*) as total_started,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE vehicle_added = true) as added_vehicle,
  COUNT(*) FILTER (WHERE dashboard_visited = true) as visited_dashboard,
  COUNT(*) FILTER (WHERE first_ride_tracked = true) as tracked_ride,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE completed_at IS NOT NULL) / NULLIF(COUNT(*), 0),
    2
  ) as completion_rate,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) 
    FILTER (WHERE completed_at IS NOT NULL),
    2
  ) as avg_completion_time_minutes
FROM user_onboarding
WHERE started_at > NOW() - INTERVAL '30 days';

COMMENT ON VIEW onboarding_analytics IS 
  'Onboarding funnel metrics (last 30 days)';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION initialize_user_onboarding TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_onboarding_progress TO authenticated, anon;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  function_count INTEGER;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_onboarding'
  ) INTO table_exists;
  
  -- Count helper functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN ('initialize_user_onboarding', 'update_onboarding_progress');
  
  IF table_exists AND function_count = 2 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ User Onboarding Table Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Table: user_onboarding';
    RAISE NOTICE '  • Tracks progress (welcome → vehicle → dashboard)';
    RAISE NOTICE '  • Auto-completes when flags met';
    RAISE NOTICE '  • Analytics view for metrics';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions:';
    RAISE NOTICE '  • initialize_user_onboarding()';
    RAISE NOTICE '  • update_onboarding_progress()';
    RAISE NOTICE '';
    RAISE NOTICE 'Analytics View:';
    RAISE NOTICE '  • onboarding_analytics (30-day metrics)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready for onboarding implementation!';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING 'Migration incomplete - check errors above';
  END IF;
END $$;
