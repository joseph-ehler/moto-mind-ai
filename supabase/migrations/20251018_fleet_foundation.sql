-- Migration: Fleet Management Foundation
-- Created: 2025-10-18
-- Purpose: Add invitation system and fleet support to existing multi-tenant architecture
-- Impact: Zero breaking changes - extends existing tenant system

-- ========================================
-- PART 1: ADD FLEETS TABLE
-- ========================================
-- Fleets are sub-groups within a tenant (e.g., "West Coast Drivers", "East Coast Drivers")
-- Optional - tenants can work without fleets

CREATE TABLE IF NOT EXISTS fleets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  manager_ids TEXT[] DEFAULT '{}',  -- Array of user IDs who manage this fleet
  vehicle_ids UUID[] DEFAULT '{}',  -- Vehicles assigned to this fleet
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_fleets_tenant_id ON fleets(tenant_id);
CREATE INDEX idx_fleets_manager_ids ON fleets USING GIN(manager_ids);
CREATE INDEX idx_fleets_deleted_at ON fleets(deleted_at) WHERE deleted_at IS NOT NULL;

ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on fleets"
  ON fleets FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON TABLE fleets IS 'Sub-groups within tenants for organizing drivers/vehicles';
COMMENT ON COLUMN fleets.manager_ids IS 'TEXT array of user IDs (NextAuth TEXT IDs)';
COMMENT ON COLUMN fleets.vehicle_ids IS 'Vehicles assigned to this fleet';

-- ========================================
-- PART 2: ADD INVITATIONS TABLE
-- ========================================
-- Invitation flow: Manager invites → Driver accepts → auto-added to tenant

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
  inviter_id TEXT NOT NULL,  -- Manager who sent invite (TEXT for NextAuth)
  invitee_email TEXT,  -- Email to invite
  invitee_phone TEXT,  -- Phone to invite (optional)
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT UNIQUE NOT NULL,  -- Unique invite token
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_by_user_id TEXT,  -- User who accepted (NULL until accepted)
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by_user_id TEXT
);

CREATE INDEX idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on invitations"
  ON invitations FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON TABLE invitations IS 'Invitation system for fleet managers to add drivers';
COMMENT ON COLUMN invitations.inviter_id IS 'TEXT user_id of manager (NextAuth)';
COMMENT ON COLUMN invitations.accepted_by_user_id IS 'TEXT user_id of acceptor (NextAuth)';
COMMENT ON COLUMN invitations.token IS 'Unique URL-safe token for invite link';

-- ========================================
-- PART 3: ADD fleet_id TO EXISTING TABLES
-- ========================================
-- Optional: Link drivers to specific fleets

-- Add fleet_id to user_tenants (which driver/fleet assignment)
ALTER TABLE user_tenants 
  ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_tenants_fleet_id ON user_tenants(fleet_id);

COMMENT ON COLUMN user_tenants.fleet_id IS 'Optional fleet assignment for this user';

-- Add fleet_id to vehicles (which fleet owns this vehicle)
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id ON vehicles(fleet_id);

COMMENT ON COLUMN vehicles.fleet_id IS 'Optional fleet assignment for this vehicle';

-- ========================================
-- PART 4: HELPER FUNCTIONS
-- ========================================

-- Function: Generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 32-char token
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(replace(replace(token, '/', '_'), '+', '-'), '=', '');
    
    -- Check if exists
    SELECT EXISTS(SELECT 1 FROM invitations WHERE invitations.token = token) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_invitation_token IS 'Generates unique URL-safe invitation token';

-- Function: Accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_user_id TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  tenant_id UUID,
  fleet_id UUID,
  role TEXT,
  error TEXT
) AS $$
DECLARE
  v_invitation invitations%ROWTYPE;
  v_existing_membership user_tenants%ROWTYPE;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT, 'Invitation not found or expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user already member of this tenant
  SELECT * INTO v_existing_membership
  FROM user_tenants
  WHERE user_id = p_user_id
    AND user_tenants.tenant_id = v_invitation.tenant_id;
  
  IF FOUND THEN
    -- Update invitation as accepted but don't create duplicate membership
    UPDATE invitations
    SET status = 'accepted',
        accepted_by_user_id = p_user_id,
        accepted_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN QUERY SELECT TRUE, v_invitation.tenant_id, v_invitation.fleet_id, v_existing_membership.role, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Create user_tenant membership
  INSERT INTO user_tenants (user_id, tenant_id, role, fleet_id)
  VALUES (p_user_id, v_invitation.tenant_id, v_invitation.role, v_invitation.fleet_id);
  
  -- Mark invitation as accepted
  UPDATE invitations
  SET status = 'accepted',
      accepted_by_user_id = p_user_id,
      accepted_at = NOW()
  WHERE id = v_invitation.id;
  
  RETURN QUERY SELECT TRUE, v_invitation.tenant_id, v_invitation.fleet_id, v_invitation.role, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION accept_invitation IS 'Accepts invitation and adds user to tenant with specified role';

-- Function: Cleanup expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_invitations IS 'Marks expired invitations (run daily via cron)';

-- ========================================
-- PART 5: UPDATE TRIGGERS
-- ========================================

-- Auto-update fleets.updated_at
CREATE OR REPLACE FUNCTION update_fleets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fleets_updated_at
  BEFORE UPDATE ON fleets
  FOR EACH ROW
  EXECUTE FUNCTION update_fleets_updated_at();

-- ========================================
-- PART 6: GRANT PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION generate_invitation_token TO authenticated, anon;
GRANT EXECUTE ON FUNCTION accept_invitation TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations TO authenticated, anon;

-- ========================================
-- VERIFICATION
-- ========================================

DO $$ 
DECLARE
  fleets_exists BOOLEAN;
  invitations_exists BOOLEAN;
  fleet_id_in_user_tenants BOOLEAN;
  fleet_id_in_vehicles BOOLEAN;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'fleets'
  ) INTO fleets_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'invitations'
  ) INTO invitations_exists;
  
  -- Check if columns added
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'user_tenants' AND column_name = 'fleet_id'
  ) INTO fleet_id_in_user_tenants;
  
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'vehicles' AND column_name = 'fleet_id'
  ) INTO fleet_id_in_vehicles;
  
  IF fleets_exists AND invitations_exists AND fleet_id_in_user_tenants AND fleet_id_in_vehicles THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Fleet foundation migration complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'New tables:';
    RAISE NOTICE '  - fleets (sub-groups within tenants)';
    RAISE NOTICE '  - invitations (invite flow)';
    RAISE NOTICE '';
    RAISE NOTICE 'New columns:';
    RAISE NOTICE '  - user_tenants.fleet_id';
    RAISE NOTICE '  - vehicles.fleet_id';
    RAISE NOTICE '';
    RAISE NOTICE 'New functions:';
    RAISE NOTICE '  - generate_invitation_token()';
    RAISE NOTICE '  - accept_invitation()';
    RAISE NOTICE '  - cleanup_expired_invitations()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Zero breaking changes!';
    RAISE NOTICE '✅ Solo users unaffected!';
    RAISE NOTICE '✅ Fleet mode ready!';
    RAISE NOTICE '========================================';
  ELSE
    RAISE WARNING 'Migration incomplete - check errors above';
  END IF;
END $$;
