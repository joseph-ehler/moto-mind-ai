-- ===================================================
-- CANONICAL VEHICLES SYSTEM
-- Multi-tenant vehicle tracking with shared VIN data
-- ===================================================
-- Author: MotoMind AI
-- Date: 2025-10-18
-- Purpose: Enable vehicle continuity across owners and households
-- ===================================================

-- ===================================================
-- TABLE: canonical_vehicles
-- One record per VIN (global, shared by all users)
-- ===================================================
CREATE TABLE IF NOT EXISTS canonical_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin TEXT UNIQUE NOT NULL,
  
  -- VIN decode data (shared by all users)
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  display_name TEXT NOT NULL,
  
  -- Vehicle specs
  body_type TEXT,
  engine TEXT,
  transmission TEXT,
  drive_type TEXT,
  fuel_type TEXT,
  
  -- Extended specs (JSONB for flexibility)
  extended_specs JSONB,
  
  -- Aggregated data (from all users who opt-in)
  total_owners INTEGER DEFAULT 1,
  first_registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Crowdsourced data (optional, anonymized)
  avg_annual_cost INTEGER, -- From users who share
  avg_mpg_city DECIMAL(4,1),
  avg_mpg_highway DECIMAL(4,1),
  common_issues JSONB DEFAULT '[]'::jsonb,
  
  -- Raw VIN decode data (for reference)
  raw_vin_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_canonical_vehicles_vin ON canonical_vehicles(vin);
CREATE INDEX idx_canonical_vehicles_make_model ON canonical_vehicles(make, model);
CREATE INDEX idx_canonical_vehicles_year ON canonical_vehicles(year);

-- RLS Policies
ALTER TABLE canonical_vehicles ENABLE ROW LEVEL SECURITY;

-- Allow all users to read canonical vehicle data
CREATE POLICY "Allow read access to canonical vehicles"
  ON canonical_vehicles FOR SELECT
  USING (true);

-- Only service role can write (via API)
CREATE POLICY "Service role can manage canonical vehicles"
  ON canonical_vehicles FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE canonical_vehicles IS 
  'One record per VIN. Shared by all users. Contains VIN decode data and aggregated insights.';

COMMENT ON POLICY "Service role can manage canonical vehicles" ON canonical_vehicles IS
  'Auth handled in API via NextAuth. Service role bypasses RLS.';

-- ===================================================
-- TABLE: user_vehicles (REFACTORED)
-- One record per user/tenant vehicle instance
-- Links to canonical_vehicles
-- ===================================================
CREATE TABLE IF NOT EXISTS user_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to canonical vehicle (REQUIRED)
  canonical_vehicle_id UUID NOT NULL REFERENCES canonical_vehicles(id) ON DELETE CASCADE,
  
  -- User ownership
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Primary owner/driver (NextAuth ID)
  
  -- User-specific customization
  nickname TEXT, -- "My Daily Driver", "The Family Car"
  color TEXT,
  license_plate TEXT,
  
  -- Ownership details
  purchase_date DATE,
  purchase_price INTEGER,
  current_mileage INTEGER,
  
  -- Privacy settings (opt-in data sharing)
  share_maintenance_history BOOLEAN DEFAULT false,
  share_cost_data BOOLEAN DEFAULT false,
  share_usage_patterns BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'totaled', 'inactive')),
  ownership_start_date TIMESTAMPTZ DEFAULT NOW(),
  ownership_end_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_vehicles_tenant ON user_vehicles(tenant_id);
CREATE INDEX idx_user_vehicles_user ON user_vehicles(user_id);
CREATE INDEX idx_user_vehicles_canonical ON user_vehicles(canonical_vehicle_id);
CREATE INDEX idx_user_vehicles_status ON user_vehicles(status) WHERE status = 'active';

-- Partial unique index: Only ONE active vehicle per canonical_vehicle_id + tenant_id
CREATE UNIQUE INDEX idx_user_vehicles_unique_active_per_tenant 
  ON user_vehicles(canonical_vehicle_id, tenant_id) 
  WHERE status = 'active';

-- RLS Policies
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;

-- Permissive policy (auth in API)
CREATE POLICY "Allow all operations on user_vehicles"
  ON user_vehicles FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE user_vehicles IS 
  'User-specific vehicle instances. Links to canonical_vehicles. Private data.';

COMMENT ON POLICY "Allow all operations on user_vehicles" ON user_vehicles IS
  'Auth handled in API via NextAuth requireUserServer(). Service role bypasses RLS.';

-- ===================================================
-- TABLE: vehicle_ownership_history
-- Track ownership timeline for continuity
-- ===================================================
CREATE TABLE IF NOT EXISTS vehicle_ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_vehicle_id UUID NOT NULL REFERENCES canonical_vehicles(id) ON DELETE CASCADE,
  
  -- Ownership details
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_vehicle_id UUID REFERENCES user_vehicles(id) ON DELETE SET NULL,
  
  -- Timeline
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Mileage at transfer
  starting_mileage INTEGER,
  ending_mileage INTEGER,
  
  -- Transfer details (optional)
  transfer_type TEXT CHECK (transfer_type IN ('purchase', 'sale', 'lease_end', 'gift', 'trade_in', 'unknown')),
  transfer_price INTEGER,
  transfer_to_tenant_id UUID REFERENCES tenants(id),
  transfer_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ownership_history_canonical ON vehicle_ownership_history(canonical_vehicle_id);
CREATE INDEX idx_ownership_history_tenant ON vehicle_ownership_history(tenant_id);
CREATE INDEX idx_ownership_history_timeline ON vehicle_ownership_history(started_at, ended_at);
CREATE INDEX idx_ownership_history_active ON vehicle_ownership_history(canonical_vehicle_id) 
  WHERE ended_at IS NULL;

-- RLS Policies
ALTER TABLE vehicle_ownership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on vehicle_ownership_history"
  ON vehicle_ownership_history FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE vehicle_ownership_history IS 
  'Track vehicle ownership over time. Enables continuity when vehicles change hands.';

COMMENT ON POLICY "Allow all operations on vehicle_ownership_history" ON vehicle_ownership_history IS
  'Auth handled in API via NextAuth. Service role bypasses RLS.';

-- ===================================================
-- TABLE: shared_vehicle_access
-- Household/fleet vehicle sharing
-- ===================================================
CREATE TABLE IF NOT EXISTS shared_vehicle_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_vehicle_id UUID NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
  
  -- Sharing details
  shared_with_user_id TEXT NOT NULL,
  shared_by_user_id TEXT NOT NULL,
  
  -- Access level
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'edit', 'full')),
  
  -- Granular permissions
  can_view_maintenance BOOLEAN DEFAULT true,
  can_add_maintenance BOOLEAN DEFAULT false,
  can_view_costs BOOLEAN DEFAULT true,
  can_edit_vehicle BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,
  
  -- Invitation
  invitation_token TEXT UNIQUE,
  invitation_accepted_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by_user_id TEXT
);

-- Indexes
CREATE INDEX idx_shared_access_vehicle ON shared_vehicle_access(user_vehicle_id);
CREATE INDEX idx_shared_access_user ON shared_vehicle_access(shared_with_user_id);
CREATE INDEX idx_shared_access_status ON shared_vehicle_access(status) WHERE status = 'active';
CREATE INDEX idx_shared_access_token ON shared_vehicle_access(invitation_token) WHERE invitation_token IS NOT NULL;

-- Partial unique index: Only ONE active share per vehicle + user
CREATE UNIQUE INDEX idx_shared_access_unique_active_per_user
  ON shared_vehicle_access(user_vehicle_id, shared_with_user_id)
  WHERE status = 'active';

-- RLS Policies
ALTER TABLE shared_vehicle_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on shared_vehicle_access"
  ON shared_vehicle_access FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE shared_vehicle_access IS 
  'Share vehicle access within household or fleet. Fine-grained permissions.';

COMMENT ON POLICY "Allow all operations on shared_vehicle_access" ON shared_vehicle_access IS
  'Auth handled in API via NextAuth. Service role bypasses RLS.';

-- ===================================================
-- HELPER FUNCTIONS
-- ===================================================

-- Function: Get or create canonical vehicle
CREATE OR REPLACE FUNCTION get_or_create_canonical_vehicle(
  p_vin TEXT,
  p_year INTEGER,
  p_make TEXT,
  p_model TEXT,
  p_trim TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_body_type TEXT DEFAULT NULL,
  p_engine TEXT DEFAULT NULL,
  p_transmission TEXT DEFAULT NULL,
  p_drive_type TEXT DEFAULT NULL,
  p_fuel_type TEXT DEFAULT NULL,
  p_extended_specs JSONB DEFAULT NULL,
  p_raw_vin_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_canonical_id UUID;
BEGIN
  -- Try to get existing
  SELECT id INTO v_canonical_id
  FROM canonical_vehicles
  WHERE vin = p_vin;
  
  IF v_canonical_id IS NOT NULL THEN
    -- Update last_active_at
    UPDATE canonical_vehicles
    SET last_active_at = NOW(),
        updated_at = NOW()
    WHERE id = v_canonical_id;
    
    RETURN v_canonical_id;
  END IF;
  
  -- Create new
  INSERT INTO canonical_vehicles (
    vin, year, make, model, trim, display_name,
    body_type, engine, transmission, drive_type, fuel_type,
    extended_specs, raw_vin_data
  ) VALUES (
    p_vin, p_year, p_make, p_model, p_trim, 
    COALESCE(p_display_name, p_year || ' ' || p_make || ' ' || p_model),
    p_body_type, p_engine, p_transmission, p_drive_type, p_fuel_type,
    p_extended_specs, p_raw_vin_data
  )
  RETURNING id INTO v_canonical_id;
  
  RETURN v_canonical_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_canonical_vehicle IS 
  'Get existing or create new canonical vehicle record. Idempotent.';

-- Function: Increment owner count
CREATE OR REPLACE FUNCTION increment_canonical_vehicle_owners(
  p_canonical_vehicle_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE canonical_vehicles
  SET total_owners = total_owners + 1,
      last_active_at = NOW(),
      updated_at = NOW()
  WHERE id = p_canonical_vehicle_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_canonical_vehicle_owners IS 
  'Increment total_owners count when new user adds this vehicle.';

-- Function: Update aggregated data
CREATE OR REPLACE FUNCTION update_canonical_vehicle_aggregates(
  p_canonical_vehicle_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE canonical_vehicles cv
  SET 
    avg_annual_cost = (
      SELECT AVG((maintenance_cost + fuel_cost + insurance_cost)::INTEGER)
      FROM (
        SELECT 
          uv.tenant_id,
          COALESCE(SUM(m.cost), 0) as maintenance_cost,
          0 as fuel_cost, -- TODO: Calculate from tracking
          0 as insurance_cost -- TODO: Add insurance tracking
        FROM user_vehicles uv
        LEFT JOIN maintenance_records m ON m.vehicle_id = uv.id
        WHERE uv.canonical_vehicle_id = p_canonical_vehicle_id
          AND uv.share_cost_data = true
          AND m.created_at >= NOW() - INTERVAL '1 year'
        GROUP BY uv.tenant_id
      ) costs
    ),
    updated_at = NOW()
  WHERE cv.id = p_canonical_vehicle_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_canonical_vehicle_aggregates IS 
  'Recalculate aggregated data from users who opted in to sharing.';

-- ===================================================
-- TRIGGERS
-- ===================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_canonical_vehicles_updated_at
  BEFORE UPDATE ON canonical_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vehicles_updated_at
  BEFORE UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- MIGRATION: Existing vehicles table
-- (If exists, create migration data)
-- ===================================================

-- Check if old 'vehicles' table exists and migrate
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vehicles') THEN
    RAISE NOTICE 'Found existing vehicles table. Run migration script separately.';
    -- Migration script will be in separate file
  END IF;
END $$;

-- ===================================================
-- COMPLETE
-- ===================================================

-- Verification queries
DO $$
BEGIN
  RAISE NOTICE '✅ Canonical vehicles system installed';
  RAISE NOTICE '   - canonical_vehicles: % records', (SELECT COUNT(*) FROM canonical_vehicles);
  RAISE NOTICE '   - user_vehicles: % records', (SELECT COUNT(*) FROM user_vehicles);
  RAISE NOTICE '   - vehicle_ownership_history: % records', (SELECT COUNT(*) FROM vehicle_ownership_history);
  RAISE NOTICE '   - shared_vehicle_access: % records', (SELECT COUNT(*) FROM shared_vehicle_access);
END $$;
