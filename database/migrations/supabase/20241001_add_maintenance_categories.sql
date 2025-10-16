-- Add maintenance-related categories to vehicle_spec_enhancements
-- Expands from 6 to 9 categories

-- Drop the old constraint
ALTER TABLE vehicle_spec_enhancements 
DROP CONSTRAINT IF EXISTS vehicle_spec_enhancements_category_check;

-- Add new constraint with all 9 categories
ALTER TABLE vehicle_spec_enhancements
ADD CONSTRAINT vehicle_spec_enhancements_category_check 
CHECK (category IN (
  'engine', 
  'drivetrain', 
  'dimensions', 
  'fuel_economy', 
  'safety', 
  'features',
  'maintenance_intervals',
  'fluids_capacities',
  'tire_specifications'
));

-- Update comment to reflect new categories
COMMENT ON COLUMN vehicle_spec_enhancements.category IS 'Specification category: engine, drivetrain, dimensions, fuel_economy, safety, features, maintenance_intervals, fluids_capacities, tire_specifications';
