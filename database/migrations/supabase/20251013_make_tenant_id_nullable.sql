-- Make tenant_id nullable in vehicle_events
-- TEMPORARY FIX: Auth currently uses email instead of UUID for tenant_id
-- This allows events to be created without tenant_id until proper user/tenant system is implemented

ALTER TABLE vehicle_events 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Also make tenant_id nullable in capture_sessions
ALTER TABLE capture_sessions 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Also make tenant_id nullable in vehicle_images (for photo uploads)
ALTER TABLE vehicle_images 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Also make tenant_id nullable in photo_metadata
ALTER TABLE photo_metadata 
ALTER COLUMN tenant_id DROP NOT NULL;

-- Add comments explaining the temporary state
COMMENT ON COLUMN vehicle_events.tenant_id IS 'Tenant ID (temporarily nullable until auth system is fixed to use UUIDs instead of emails)';
COMMENT ON COLUMN capture_sessions.tenant_id IS 'Tenant ID (temporarily nullable until auth system is fixed to use UUIDs instead of emails)';
COMMENT ON COLUMN vehicle_images.tenant_id IS 'Tenant ID (temporarily nullable until auth system is fixed to use UUIDs instead of emails)';
COMMENT ON COLUMN photo_metadata.tenant_id IS 'Tenant ID (temporarily nullable until auth system is fixed to use UUIDs instead of emails)';
