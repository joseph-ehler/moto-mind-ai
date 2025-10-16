-- Proper Multi-Tenant Architecture
-- This replaces the email-based workaround with proper UUID-based tenants

-- Step 1: Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- Step 2: Create user_tenants mapping table (supports multiple tenants per user)
CREATE TABLE IF NOT EXISTS user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Auth provider user ID (email for now)
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, tenant_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);

-- Step 4: Backfill existing data
-- Create a tenant for the current user (joseph.ehler@gmail.com)
DO $$
DECLARE
  v_tenant_id UUID;
  v_user_email TEXT := 'joseph.ehler@gmail.com';
BEGIN
  -- Create tenant for current user
  INSERT INTO tenants (name, created_at)
  VALUES ('Personal', now())
  RETURNING id INTO v_tenant_id;
  
  -- Link user to tenant
  INSERT INTO user_tenants (user_id, tenant_id, role)
  VALUES (v_user_email, v_tenant_id, 'owner');
  
  -- Backfill all existing records with this tenant_id
  UPDATE vehicle_events SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE vehicles SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE capture_sessions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE vehicle_images SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE photo_metadata SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Created tenant % and backfilled existing data', v_tenant_id;
END $$;

-- Step 5: Re-enable NOT NULL constraints
ALTER TABLE vehicle_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE vehicles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE capture_sessions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE vehicle_images ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE photo_metadata ALTER COLUMN tenant_id SET NOT NULL;

-- Step 6: Add foreign key constraints
ALTER TABLE vehicle_events 
  ADD CONSTRAINT fk_vehicle_events_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE vehicles 
  ADD CONSTRAINT fk_vehicles_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE capture_sessions 
  ADD CONSTRAINT fk_capture_sessions_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE vehicle_images 
  ADD CONSTRAINT fk_vehicle_images_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE photo_metadata 
  ADD CONSTRAINT fk_photo_metadata_tenant 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 7: Update column comments
COMMENT ON COLUMN vehicle_events.tenant_id IS 'Tenant UUID - enforces multi-tenant data isolation';
COMMENT ON COLUMN vehicles.tenant_id IS 'Tenant UUID - enforces multi-tenant data isolation';
COMMENT ON COLUMN capture_sessions.tenant_id IS 'Tenant UUID - enforces multi-tenant data isolation';
COMMENT ON COLUMN vehicle_images.tenant_id IS 'Tenant UUID - enforces multi-tenant data isolation';
COMMENT ON COLUMN photo_metadata.tenant_id IS 'Tenant UUID - enforces multi-tenant data isolation';

-- Step 8: Add RLS policies (optional, for future use)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tenant memberships
CREATE POLICY user_tenants_select ON user_tenants
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);
