-- Add missing fuel event fields to capture ALL vision-extracted data
-- Currently we extract this data but don't save it!

-- Add price per gallon (calculated from total/gallons)
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS price_per_gallon DECIMAL(5,3);

-- Add fuel level from gauge reading
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS fuel_level INTEGER;

-- Add fuel grade (Regular, Premium, Diesel, etc.)
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS fuel_grade VARCHAR(50);

-- Add products/additives as JSON array
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]'::jsonb;

-- Add detailed per-photo confidence scores
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS vision_confidence_detail JSONB;

-- Add validation results for audit trail
ALTER TABLE vehicle_events
ADD COLUMN IF NOT EXISTS validation_results JSONB;

-- Add helpful comments
COMMENT ON COLUMN vehicle_events.price_per_gallon IS 'Price per gallon at time of purchase (calculated from total/gallons)';
COMMENT ON COLUMN vehicle_events.fuel_level IS 'Fuel gauge percentage (0-100) after fill-up, extracted from gauge photo';
COMMENT ON COLUMN vehicle_events.fuel_grade IS 'Fuel type: Regular, Premium, Diesel, Super Unleaded, etc.';
COMMENT ON COLUMN vehicle_events.products IS 'Array of fuel additives/products used (e.g., Sea Foam, Octane Booster)';
COMMENT ON COLUMN vehicle_events.vision_confidence_detail IS 'Detailed confidence scores per photo type {receipt: 95, odometer: 89, gauge: 85, additives: 80}';
COMMENT ON COLUMN vehicle_events.validation_results IS 'Cross-validation check results (gallons vs gauge, price reasonableness, etc.)';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vehicle_events_fuel_grade ON vehicle_events(fuel_grade);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_price_per_gallon ON vehicle_events(price_per_gallon);
