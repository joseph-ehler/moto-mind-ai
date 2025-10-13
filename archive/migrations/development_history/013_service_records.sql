-- Service Records Table for Vehicle Maintenance Records
-- Migration: 013_service_records.sql

-- Create service_records table
CREATE TABLE IF NOT EXISTS service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Service details
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_type VARCHAR(100) NOT NULL, -- oil_change, brake_service, tire_rotation, etc.
    description TEXT,
    
    -- Financial details
    total_cost DECIMAL(10,2) NOT NULL CHECK (total_cost >= 0),
    labor_cost DECIMAL(10,2) CHECK (labor_cost >= 0),
    parts_cost DECIMAL(10,2) CHECK (parts_cost >= 0),
    tax_amount DECIMAL(8,2) CHECK (tax_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Service provider details
    shop_name VARCHAR(255),
    shop_address TEXT,
    technician_name VARCHAR(255),
    
    -- Vehicle condition at service
    odometer_reading INTEGER CHECK (odometer_reading >= 0),
    
    -- Service items (for detailed breakdowns)
    service_items JSONB, -- array of {item, cost, quantity, type: 'labor'|'parts'}
    
    -- Data source and quality
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'photo', 'import', 'api')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    image_url TEXT,
    ocr_data JSONB,
    
    -- Service tracking
    warranty_months INTEGER CHECK (warranty_months >= 0),
    next_service_date DATE,
    next_service_miles INTEGER CHECK (next_service_miles >= 0),
    
    -- Additional metadata
    notes TEXT,
    tags TEXT[],
    is_verified BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_date ON service_records(vehicle_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_records_type ON service_records(service_type);
CREATE INDEX IF NOT EXISTS idx_service_records_shop ON service_records(shop_name);

-- Enable Row Level Security
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON service_records TO authenticated;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_records_updated_at_trigger
    BEFORE UPDATE ON service_records
    FOR EACH ROW
    EXECUTE FUNCTION update_service_records_updated_at();

-- View for latest service per vehicle
CREATE OR REPLACE VIEW latest_service_records AS
SELECT DISTINCT ON (vehicle_id)
    sr.*,
    v.make,
    v.model,
    v.year,
    v.display_name as vehicle_name
FROM service_records sr
JOIN vehicles v ON sr.vehicle_id = v.id
ORDER BY vehicle_id, service_date DESC, created_at DESC;

-- View for service statistics per vehicle
CREATE OR REPLACE VIEW service_record_stats AS
SELECT 
    vehicle_id,
    tenant_id,
    COUNT(*) as total_services,
    SUM(total_cost) as total_spent,
    AVG(total_cost) as avg_service_cost,
    MIN(service_date) as first_service_date,
    MAX(service_date) as last_service_date,
    COUNT(DISTINCT service_type) as service_types_count,
    SUM(CASE WHEN service_type LIKE '%oil%' THEN 1 ELSE 0 END) as oil_changes,
    SUM(CASE WHEN service_type LIKE '%brake%' THEN 1 ELSE 0 END) as brake_services
FROM service_records
WHERE is_verified = true
GROUP BY vehicle_id, tenant_id;

-- Comments for documentation
COMMENT ON TABLE service_records IS 'Vehicle service and maintenance records with OCR support';
COMMENT ON COLUMN service_records.source IS 'Data source: manual, photo, import, api';
COMMENT ON COLUMN service_records.confidence_score IS 'OCR confidence score (0.0 to 1.0)';
COMMENT ON COLUMN service_records.service_items IS 'Detailed breakdown of service items and costs';
COMMENT ON COLUMN service_records.ocr_data IS 'Raw OCR extraction data for audit trail';
COMMENT ON VIEW latest_service_records IS 'Most recent service record per vehicle';
COMMENT ON VIEW service_record_stats IS 'Aggregated service statistics per vehicle';
