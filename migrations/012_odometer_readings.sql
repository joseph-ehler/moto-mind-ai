-- Odometer Readings Table for Vehicle Mileage Records
-- Migration: 012_odometer_readings.sql

-- Create odometer_readings table
CREATE TABLE IF NOT EXISTS odometer_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    
    -- Reading details
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reading_time TIME DEFAULT CURRENT_TIME,
    
    -- Data source and quality
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'photo', 'import', 'api')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    image_url TEXT,
    ocr_data JSONB,
    
    -- Reading context
    display_type VARCHAR(50), -- analog, digital, lcd, etc.
    reading_quality VARCHAR(20), -- clear, blurry, partial, etc.
    
    -- Location and context
    location TEXT,
    fuel_level VARCHAR(20), -- empty, quarter, half, three_quarters, full
    warning_lights TEXT[], -- array of warning light names
    
    -- Validation flags
    is_verified BOOLEAN DEFAULT false,
    is_estimated BOOLEAN DEFAULT false,
    
    -- Calculated fields (computed from previous readings)
    miles_since_last INTEGER,
    days_since_last INTEGER,
    
    -- Additional metadata
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_odometer_readings_vehicle_id ON odometer_readings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_odometer_readings_date ON odometer_readings(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_odometer_readings_vehicle_date ON odometer_readings(vehicle_id, reading_date DESC, reading_time DESC);
CREATE INDEX IF NOT EXISTS idx_odometer_readings_mileage ON odometer_readings(vehicle_id, mileage DESC);

-- Enable Row Level Security
ALTER TABLE odometer_readings ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON odometer_readings TO authenticated;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_odometer_readings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER odometer_readings_updated_at_trigger
    BEFORE UPDATE ON odometer_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_odometer_readings_updated_at();

-- View for latest odometer reading per vehicle
CREATE OR REPLACE VIEW latest_odometer_readings AS
SELECT DISTINCT ON (vehicle_id)
    or_.*,
    v.make,
    v.model,
    v.year,
    v.display_name as vehicle_name
FROM odometer_readings or_
JOIN vehicles v ON or_.vehicle_id = v.id
ORDER BY vehicle_id, reading_date DESC, reading_time DESC, created_at DESC;

-- View for odometer statistics per vehicle
CREATE OR REPLACE VIEW odometer_reading_stats AS
SELECT 
    vehicle_id,
    tenant_id,
    COUNT(*) as total_readings,
    MIN(mileage) as lowest_mileage,
    MAX(mileage) as highest_mileage,
    MAX(mileage) - MIN(mileage) as total_miles_tracked,
    MIN(reading_date) as first_reading_date,
    MAX(reading_date) as last_reading_date,
    AVG(miles_since_last) as avg_miles_between_readings,
    AVG(days_since_last) as avg_days_between_readings
FROM odometer_readings
WHERE is_verified = true OR is_estimated = false
GROUP BY vehicle_id, tenant_id;

-- Comments for documentation
COMMENT ON TABLE odometer_readings IS 'Vehicle odometer/mileage readings with OCR support';
COMMENT ON COLUMN odometer_readings.source IS 'Data source: manual, photo, import, api';
COMMENT ON COLUMN odometer_readings.confidence_score IS 'OCR confidence score (0.0 to 1.0)';
COMMENT ON COLUMN odometer_readings.ocr_data IS 'Raw OCR extraction data for audit trail';
COMMENT ON VIEW latest_odometer_readings IS 'Most recent odometer reading per vehicle';
COMMENT ON VIEW odometer_reading_stats IS 'Aggregated odometer statistics per vehicle';
