-- TEST SCENARIO 2: Service History Table
-- 
-- Scenario: Developer wants to track service history per vehicle
-- Expected: Should detect user_maintenance_preferences as related
-- 
-- This tests semantic similarity (different name, similar purpose)

CREATE TABLE vehicle_service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  user_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  service_date DATE NOT NULL,
  service_notes TEXT,
  mileage_at_service INTEGER,
  cost_estimate NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_history_vehicle_id ON vehicle_service_history(vehicle_id);
CREATE INDEX idx_service_history_user_id ON vehicle_service_history(user_id);
CREATE INDEX idx_service_history_date ON vehicle_service_history(service_date);

COMMENT ON TABLE vehicle_service_history IS 
  'Tracks maintenance and service history for vehicles. Records service type, date, notes, and costs.';
