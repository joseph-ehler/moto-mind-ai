-- ============================================================================
-- COMPOSITE INDEXES FOR MULTI-TENANT OPTIMIZATION
-- ============================================================================
-- Created: 2025-10-16
-- Purpose: Optimize tenant-scoped queries with composite indexes
-- Impact: Significant performance improvement for filtered queries
-- Note: Only indexes tables that currently exist (auth-related tables)
-- ============================================================================

-- User Tenants: User ID lookup (auth table - exists)
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id 
  ON user_tenants(user_id);

-- User Tenants: Role filtering (auth table - exists)
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_role 
  ON user_tenants(tenant_id, role);

-- Add comments
COMMENT ON INDEX idx_user_tenants_user_id IS 'Optimize user tenant lookups by user_id';
COMMENT ON INDEX idx_user_tenants_tenant_role IS 'Optimize tenant queries filtered by role';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Composite indexes created for existing tables';
  RAISE NOTICE '📊 Vehicles/events tables will get indexes when created';
END $$;
