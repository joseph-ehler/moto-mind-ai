-- Fuel Logs Table for Vehicle Fuel Records
-- Migration: 011_fuel_logs.sql

-- Create fuel_logs table
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Fuel transaction details
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    
    -- Financial details
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Fuel details
    gallons DECIMAL(8,3) CHECK (gallons > 0),
    price_per_gallon DECIMAL(6,3) CHECK (price_per_gallon > 0),
    fuel_type VARCHAR(50) DEFAULT 'Regular',
    
    -- Location details
    station_name VARCHAR(255),
    station_address TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    
    -- Transaction details
    payment_method VARCHAR(50),
    transaction_number VARCHAR(100),
    tax_amount DECIMAL(8,2),
    
    -- Data source and quality
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'photo', 'import', 'api')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    image_url TEXT,
    ocr_data JSONB,
    
    -- Odometer reading at time of fuel-up (optional)
    odometer_reading INTEGER CHECK (odometer_reading >= 0),
    
    -- Additional metadata
    notes TEXT,
    tags TEXT[],
    is_verified BOOLEAN DEFAULT false,
    is_estimated BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Constraints
    CONSTRAINT fuel_logs_tenant_vehicle_fk FOREIGN KEY (tenant_id, vehicle_id) 
        REFERENCES vehicles(tenant_id, id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fuel_logs_tenant_id ON fuel_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON fuel_logs(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_created_at ON fuel_logs(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY fuel_logs_tenant_isolation ON fuel_logs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_fuel_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fuel_logs_updated_at_trigger
    BEFORE UPDATE ON fuel_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_fuel_logs_updated_at();

-- View for latest fuel logs per vehicle
CREATE OR REPLACE VIEW latest_fuel_logs AS
SELECT DISTINCT ON (vehicle_id)
    fl.*,
    v.make,
    v.model,
    v.year,
    v.display_name as vehicle_name
FROM fuel_logs fl
JOIN vehicles v ON fl.vehicle_id = v.id
ORDER BY vehicle_id, date DESC, time DESC, created_at DESC;

-- View for fuel statistics per vehicle
CREATE OR REPLACE VIEW fuel_log_stats AS
SELECT 
    vehicle_id,
    tenant_id,
    COUNT(*) as total_fillups,
    SUM(total_amount) as total_spent,
    SUM(gallons) as total_gallons,
    AVG(price_per_gallon) as avg_price_per_gallon,
    MIN(date) as first_fillup_date,
    MAX(date) as last_fillup_date,
    AVG(total_amount) as avg_fillup_cost,
    AVG(gallons) as avg_gallons_per_fillup
FROM fuel_logs
WHERE is_verified = true OR is_estimated = false
GROUP BY vehicle_id, tenant_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON fuel_logs TO authenticated;
GRANT SELECT ON latest_fuel_logs TO authenticated;
GRANT SELECT ON fuel_log_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE fuel_logs IS 'Vehicle fuel purchase records with OCR support';
COMMENT ON COLUMN fuel_logs.source IS 'Data source: manual, photo, import, api';
COMMENT ON COLUMN fuel_logs.confidence_score IS 'OCR confidence score (0.0 to 1.0)';
COMMENT ON COLUMN fuel_logs.ocr_data IS 'Raw OCR extraction data for audit trail';
COMMENT ON VIEW latest_fuel_logs IS 'Most recent fuel log per vehicle';
COMMENT ON VIEW fuel_log_stats IS 'Aggregated fuel statistics per vehicle';
