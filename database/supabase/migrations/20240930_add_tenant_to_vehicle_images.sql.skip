-- Add tenant_id to vehicle_images if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_images' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE vehicle_images 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id);
        
        -- Populate tenant_id from vehicles table
        UPDATE vehicle_images vi
        SET tenant_id = v.tenant_id
        FROM vehicles v
        WHERE vi.vehicle_id = v.id;
        
        -- Make it NOT NULL after population
        ALTER TABLE vehicle_images 
        ALTER COLUMN tenant_id SET NOT NULL;
        
        -- Add index
        CREATE INDEX idx_vehicle_images_tenant_id ON vehicle_images(tenant_id);
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view images for their tenant's vehicles" ON vehicle_images;
DROP POLICY IF EXISTS "Users can insert images for their tenant's vehicles" ON vehicle_images;
DROP POLICY IF EXISTS "Users can update images for their tenant's vehicles" ON vehicle_images;
DROP POLICY IF EXISTS "Users can delete images for their tenant's vehicles" ON vehicle_images;

-- Create RLS policies
CREATE POLICY "Users can view images for their tenant's vehicles"
  ON vehicle_images FOR SELECT
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text OR tenant_id IS NULL);

CREATE POLICY "Users can insert images for their tenant's vehicles"
  ON vehicle_images FOR INSERT
  WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Users can update images for their tenant's vehicles"
  ON vehicle_images FOR UPDATE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY "Users can delete images for their tenant's vehicles"
  ON vehicle_images FOR DELETE
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);
