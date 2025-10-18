-- ============================================================================
-- OWNERSHIP RESOLUTION FOUNDATION
-- Phase 2: Smart conflict resolution and auto-transfers
-- ============================================================================

-- Add ownership resolution columns to user_vehicles
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS
  last_activity_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS
  ownership_confidence INTEGER DEFAULT 100 CHECK (ownership_confidence BETWEEN 0 AND 100);

ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS
  transfer_reversible_until TIMESTAMPTZ;

ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS
  transfer_reason TEXT;

ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS
  notification_sent_at TIMESTAMPTZ;

ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS
  notification_responded_at TIMESTAMPTZ;

-- Add new status values for transfers
ALTER TABLE user_vehicles 
  DROP CONSTRAINT IF EXISTS user_vehicles_status_check;

ALTER TABLE user_vehicles ADD CONSTRAINT user_vehicles_status_check
  CHECK (status IN (
    'active',
    'sold',
    'totaled',
    'inactive',
    'stale',
    'pending_verification',
    'transferred',
    'disputed'
  ));

-- Add transfer types to ownership history
ALTER TABLE vehicle_ownership_history 
  DROP CONSTRAINT IF EXISTS vehicle_ownership_history_transfer_type_check;

ALTER TABLE vehicle_ownership_history ADD CONSTRAINT vehicle_ownership_history_transfer_type_check
  CHECK (transfer_type IN (
    'purchase',
    'lease_start',
    'lease_end',
    'gift',
    'inheritance',
    'sale',
    'trade_in',
    'total_loss',
    'theft_recovery',
    'auto_transfer',
    'mileage_proof',
    'stale_inactive',
    'manual_override'
  ));

-- Create indexes for ownership queries
CREATE INDEX IF NOT EXISTS idx_user_vehicles_last_activity 
  ON user_vehicles(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_vehicles_confidence 
  ON user_vehicles(ownership_confidence) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_vehicles_pending_verification 
  ON user_vehicles(status, notification_sent_at) 
  WHERE status = 'pending_verification';

CREATE INDEX IF NOT EXISTS idx_user_vehicles_reversible_transfers
  ON user_vehicles(transfer_reversible_until)
  WHERE transfer_reversible_until IS NOT NULL;

-- ============================================================================
-- FUNCTION: Calculate Ownership Confidence
-- Returns 0-100 score based on activity, mileage, tracking, maintenance
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_ownership_confidence(
  p_user_vehicle_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_confidence INTEGER := 100;
  v_days_since_activity INTEGER;
  v_has_recent_tracking BOOLEAN;
  v_has_recent_maintenance BOOLEAN;
  v_account_status TEXT;
BEGIN
  -- Get basic activity data
  SELECT 
    EXTRACT(EPOCH FROM (NOW() - last_activity_at)) / 86400,
    'active' -- TODO: Join with users table when available
  INTO 
    v_days_since_activity,
    v_account_status
  FROM user_vehicles
  WHERE id = p_user_vehicle_id;
  
  -- Base confidence on days since activity
  IF v_days_since_activity > 180 THEN
    v_confidence := 0;   -- Impossible they still own it
  ELSIF v_days_since_activity > 120 THEN
    v_confidence := 10;  -- Very unlikely
  ELSIF v_days_since_activity > 90 THEN
    v_confidence := 20;  -- Unlikely
  ELSIF v_days_since_activity > 60 THEN
    v_confidence := 40;  -- Uncertain
  ELSIF v_days_since_activity > 30 THEN
    v_confidence := 70;  -- Likely
  ELSE
    v_confidence := 100; -- Certain
  END IF;
  
  -- Check for recent tracking sessions
  SELECT EXISTS (
    SELECT 1 FROM tracking_sessions
    WHERE vehicle_id = p_user_vehicle_id
      AND ended_at > NOW() - INTERVAL '60 days'
    LIMIT 1
  ) INTO v_has_recent_tracking;
  
  IF v_has_recent_tracking THEN
    v_confidence := LEAST(100, v_confidence + 20);
  END IF;
  
  -- Check for recent maintenance records
  SELECT EXISTS (
    SELECT 1 FROM maintenance_records
    WHERE vehicle_id = p_user_vehicle_id
      AND created_at > NOW() - INTERVAL '60 days'
    LIMIT 1
  ) INTO v_has_recent_maintenance;
  
  IF v_has_recent_maintenance THEN
    v_confidence := LEAST(100, v_confidence + 20);
  END IF;
  
  -- Account deleted = zero confidence
  IF v_account_status = 'deleted' THEN
    v_confidence := 0;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, v_confidence));
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_ownership_confidence IS 
  'Calculate 0-100 confidence score that user still owns vehicle based on activity';

-- ============================================================================
-- FUNCTION: Mark Stale Vehicles
-- Run daily to auto-mark inactive vehicles as stale
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_stale_vehicles() RETURNS INTEGER AS $$
DECLARE
  v_stale_count INTEGER;
BEGIN
  -- Mark vehicles as stale if:
  -- 1. Status = 'active'
  -- 2. Confidence < 40 (60+ days inactive)
  -- 3. No recent activity
  
  WITH stale_candidates AS (
    SELECT 
      id,
      calculate_ownership_confidence(id) as confidence
    FROM user_vehicles
    WHERE status = 'active'
      AND last_activity_at < NOW() - INTERVAL '60 days'
  )
  UPDATE user_vehicles
  SET 
    status = 'stale',
    ownership_confidence = stale_candidates.confidence,
    updated_at = NOW()
  FROM stale_candidates
  WHERE user_vehicles.id = stale_candidates.id
    AND stale_candidates.confidence < 40;
    
  GET DIAGNOSTICS v_stale_count = ROW_COUNT;
  
  RETURN v_stale_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_stale_vehicles IS 
  'Automatically mark inactive vehicles as stale. Run daily via cron.';

-- ============================================================================
-- FUNCTION: Resolve Pending Transfers
-- Auto-resolve transfers where notification period expired
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_pending_transfers() RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER := 0;
BEGIN
  -- Auto-resolve transfers where:
  -- 1. Status = 'pending_verification'
  -- 2. Notification sent 7+ days ago
  -- 3. No response from previous owner
  
  UPDATE user_vehicles
  SET 
    status = 'transferred',
    transferred_at = NOW(),
    transfer_reason = COALESCE(transfer_reason, 'no_response_7_days'),
    updated_at = NOW()
  WHERE 
    status = 'pending_verification'
    AND notification_sent_at < NOW() - INTERVAL '7 days'
    AND notification_responded_at IS NULL;
    
  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  
  RETURN v_resolved_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION resolve_pending_transfers IS 
  'Auto-resolve pending transfers after 7 days with no response. Run daily via cron.';

-- ============================================================================
-- FUNCTION: Expire Reversible Transfers
-- Remove reversibility after expiration period
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_reversible_transfers() RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
BEGIN
  -- Clear reversibility for transfers older than 30 days
  UPDATE user_vehicles
  SET 
    transfer_reversible_until = NULL,
    updated_at = NOW()
  WHERE 
    transfer_reversible_until IS NOT NULL
    AND transfer_reversible_until < NOW();
    
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_reversible_transfers IS 
  'Remove reversibility from old transfers. Run daily via cron.';

-- ============================================================================
-- VIEW: Active Ownership Conflicts
-- Shows vehicles with multiple active instances across tenants
-- ============================================================================

CREATE OR REPLACE VIEW active_ownership_conflicts AS
SELECT 
  cv.id as canonical_vehicle_id,
  cv.vin,
  cv.display_name,
  cv.total_owners,
  COUNT(uv.id) as active_instances,
  jsonb_agg(
    jsonb_build_object(
      'user_vehicle_id', uv.id,
      'tenant_id', uv.tenant_id,
      'user_id', uv.user_id,
      'status', uv.status,
      'last_activity', uv.last_activity_at,
      'confidence', uv.ownership_confidence,
      'created_at', uv.created_at
    )
    ORDER BY uv.last_activity_at DESC
  ) as instances
FROM canonical_vehicles cv
JOIN user_vehicles uv ON uv.canonical_vehicle_id = cv.id
WHERE uv.status IN ('active', 'pending_verification')
GROUP BY cv.id, cv.vin, cv.display_name, cv.total_owners
HAVING COUNT(uv.id) > 1;

COMMENT ON VIEW active_ownership_conflicts IS 
  'Vehicles with multiple active instances across different tenants';

-- ============================================================================
-- METRICS QUERIES (for monitoring)
-- ============================================================================

-- Stale vehicle count
CREATE OR REPLACE VIEW stale_vehicles_summary AS
SELECT 
  COUNT(*) as total_stale,
  COUNT(*) FILTER (WHERE last_activity_at < NOW() - INTERVAL '90 days') as stale_90_days,
  COUNT(*) FILTER (WHERE last_activity_at < NOW() - INTERVAL '120 days') as stale_120_days,
  COUNT(*) FILTER (WHERE last_activity_at < NOW() - INTERVAL '180 days') as stale_180_days
FROM user_vehicles
WHERE status = 'stale';

-- Pending transfers
CREATE OR REPLACE VIEW pending_transfers_summary AS
SELECT 
  COUNT(*) as total_pending,
  COUNT(*) FILTER (WHERE notification_sent_at < NOW() - INTERVAL '3 days') as pending_3_days,
  COUNT(*) FILTER (WHERE notification_sent_at < NOW() - INTERVAL '7 days') as pending_7_days,
  AVG(EXTRACT(EPOCH FROM (NOW() - notification_sent_at)) / 86400) as avg_days_pending
FROM user_vehicles
WHERE status = 'pending_verification';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_ownership_confidence TO authenticated;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION mark_stale_vehicles TO service_role;
GRANT EXECUTE ON FUNCTION resolve_pending_transfers TO service_role;
GRANT EXECUTE ON FUNCTION expire_reversible_transfers TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_vehicles.last_activity_at IS 
  'Last time user interacted with this vehicle (tracking, maintenance, etc)';

COMMENT ON COLUMN user_vehicles.ownership_confidence IS 
  '0-100 score indicating confidence user still owns vehicle';

COMMENT ON COLUMN user_vehicles.transfer_reversible_until IS 
  'If set, previous owner can reclaim vehicle until this date';

COMMENT ON COLUMN user_vehicles.transfer_reason IS 
  'Why this vehicle was transferred (mileage_proof, stale_inactive, etc)';

COMMENT ON COLUMN user_vehicles.notification_sent_at IS 
  'When we notified previous owner about potential transfer';

COMMENT ON COLUMN user_vehicles.notification_responded_at IS 
  'When previous owner responded to notification';
