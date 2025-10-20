-- TEST SCENARIO: Duplicate Table Detection
-- 
-- Scenario: Developer wants to create a vehicle_notes table
-- Expected: Should detect user_maintenance_preferences as potential duplicate
-- 
-- This is the REAL use case for vector search!

-- Proposed new table (DUPLICATE!)
CREATE TABLE vehicle_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_notes_vehicle_id ON vehicle_notes(vehicle_id);
CREATE INDEX idx_vehicle_notes_created_by ON vehicle_notes(created_by);

COMMENT ON TABLE vehicle_notes IS 
  'User-created notes and observations about their vehicles. For tracking maintenance, issues, modifications, etc.';

-- RLS
ALTER TABLE vehicle_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on vehicle_notes"
  ON vehicle_notes FOR ALL
  USING (true) WITH CHECK (true);

COMMENT ON POLICY "Allow all operations on vehicle_notes" ON vehicle_notes IS 
  'Permissive - auth handled in API via NextAuth';
