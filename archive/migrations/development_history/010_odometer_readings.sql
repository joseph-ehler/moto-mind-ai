-- Odometer readings tracking for vehicles
-- Enables mileage history, trends, and service interval calculations

-- Create odometer_readings table
CREATE TABLE IF NOT EXISTS odometer_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Reading data
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reading_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Source and confidence
  source VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'manual', 'ocr', 'document', 'service'
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  image_url TEXT, -- Optional: photo of odometer
  
  -- OCR metadata (when source is 'ocr')
  ocr_data JSONB, -- Raw OCR response data
  display_type VARCHAR(50), -- 'digital', 'analog', 'lcd'
  reading_quality VARCHAR(50), -- 'clear', 'partially_obscured', 'glare'
  
  -- Additional context
  notes TEXT,
  location TEXT, -- Where reading was taken
  fuel_level VARCHAR(20), -- 'empty', 'quarter', 'half', 'three_quarter', 'full'
  warning_lights TEXT[], -- Array of warning indicators visible
  
  -- Validation and flags
  is_verified BOOLEAN DEFAULT false, -- User confirmed accuracy
  is_estimated BOOLEAN DEFAULT false, -- Estimated vs actual reading
  miles_since_last INTEGER, -- Calculated difference from previous reading
  days_since_last INTEGER, -- Days since previous reading
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_odometer_readings_tenant_id ON odometer_readings(tenant_id);
CREATE INDEX idx_odometer_readings_vehicle_id ON odometer_readings(vehicle_id);
CREATE INDEX idx_odometer_readings_date ON odometer_readings(reading_date DESC);
CREATE INDEX idx_odometer_readings_vehicle_date ON odometer_readings(vehicle_id, reading_date DESC);
CREATE INDEX idx_odometer_readings_source ON odometer_readings(source);

-- RLS policies
ALTER TABLE odometer_readings ENABLE ROW LEVEL SECURITY;

-- Users can only access readings for their tenant
CREATE POLICY "Users can view odometer readings for their tenant" ON odometer_readings
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert odometer readings for their tenant" ON odometer_readings
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update odometer readings for their tenant" ON odometer_readings
  FOR UPDATE USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete odometer readings for their tenant" ON odometer_readings
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Function to calculate miles and days since last reading
CREATE OR REPLACE FUNCTION calculate_odometer_deltas()
RETURNS TRIGGER AS $$
DECLARE
  last_reading RECORD;
BEGIN
  -- Get the most recent previous reading for this vehicle
  SELECT mileage, reading_date 
  INTO last_reading
  FROM odometer_readings 
  WHERE vehicle_id = NEW.vehicle_id 
    AND reading_date < NEW.reading_date
    AND id != NEW.id
  ORDER BY reading_date DESC 
  LIMIT 1;
  
  IF FOUND THEN
    NEW.miles_since_last := NEW.mileage - last_reading.mileage;
    NEW.days_since_last := NEW.reading_date - last_reading.reading_date;
  ELSE
    NEW.miles_since_last := NULL;
    NEW.days_since_last := NULL;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate deltas
CREATE TRIGGER calculate_odometer_deltas_trigger
  BEFORE INSERT OR UPDATE ON odometer_readings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_odometer_deltas();

-- Function to update vehicle's current mileage
CREATE OR REPLACE FUNCTION update_vehicle_current_mileage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the vehicle's current mileage with the latest reading
  UPDATE vehicles 
  SET 
    current_mileage = NEW.mileage,
    last_mileage_update = NEW.reading_date,
    updated_at = NOW()
  WHERE id = NEW.vehicle_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vehicle mileage
CREATE TRIGGER update_vehicle_mileage_trigger
  AFTER INSERT OR UPDATE ON odometer_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_current_mileage();

-- Add mileage tracking fields to vehicles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'last_mileage_update') THEN
    ALTER TABLE vehicles ADD COLUMN last_mileage_update DATE;
  END IF;
END $$;

-- View for latest odometer reading per vehicle
CREATE OR REPLACE VIEW latest_odometer_readings AS
SELECT DISTINCT ON (vehicle_id)
  vehicle_id,
  mileage,
  reading_date,
  reading_time,
  source,
  confidence_score,
  miles_since_last,
  days_since_last,
  created_at
FROM odometer_readings
ORDER BY vehicle_id, reading_date DESC, reading_time DESC;

-- View for odometer reading statistics per vehicle
CREATE OR REPLACE VIEW odometer_reading_stats AS
SELECT 
  vehicle_id,
  COUNT(*) as total_readings,
  MIN(mileage) as first_mileage,
  MAX(mileage) as current_mileage,
  MAX(mileage) - MIN(mileage) as total_miles_tracked,
  MIN(reading_date) as first_reading_date,
  MAX(reading_date) as latest_reading_date,
  MAX(reading_date) - MIN(reading_date) as days_tracked,
  ROUND(
    CASE 
      WHEN MAX(reading_date) - MIN(reading_date) > 0 
      THEN (MAX(mileage) - MIN(mileage))::DECIMAL / (MAX(reading_date) - MIN(reading_date))
      ELSE 0 
    END, 2
  ) as avg_miles_per_day,
  ROUND(AVG(miles_since_last), 0) as avg_miles_between_readings,
  ROUND(AVG(days_since_last), 1) as avg_days_between_readings
FROM odometer_readings
WHERE mileage IS NOT NULL
GROUP BY vehicle_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON odometer_readings TO authenticated;
GRANT SELECT ON latest_odometer_readings TO authenticated;
GRANT SELECT ON odometer_reading_stats TO authenticated;
