/**
 * NHTSA Complaints and Investigations Tables
 * 
 * Stores downloaded NHTSA data for local querying
 * - Complaints from FLAT_CMPL.zip
 * - Investigations from FLAT_INV.zip
 * 
 * Data Source: https://static.nhtsa.gov/odi/ffdd/
 * Updated: Monthly (manual refresh required)
 */

-- ============================================================================
-- COMPLAINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nhtsa_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiers
  odi_number TEXT NOT NULL UNIQUE,
  nhtsa_id TEXT,
  
  -- Vehicle (indexed for fast queries)
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT NOT NULL,
  vin TEXT,
  
  -- Complaint details
  complaint_date TIMESTAMPTZ NOT NULL,
  component TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Incident details
  crash BOOLEAN DEFAULT FALSE,
  fire BOOLEAN DEFAULT FALSE,
  injured INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  
  -- Context
  mileage INTEGER,
  fail_date TIMESTAMPTZ,
  speed INTEGER,
  
  -- Location
  city TEXT,
  state TEXT,
  
  -- Follow-up
  manufacturer_campaign TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast vehicle queries
CREATE INDEX IF NOT EXISTS idx_complaints_vehicle 
  ON nhtsa_complaints(year, make, model);

CREATE INDEX IF NOT EXISTS idx_complaints_make_model 
  ON nhtsa_complaints(make, model);

CREATE INDEX IF NOT EXISTS idx_complaints_date 
  ON nhtsa_complaints(complaint_date DESC);

-- Indexes for safety incident queries
CREATE INDEX IF NOT EXISTS idx_complaints_crash 
  ON nhtsa_complaints(crash) WHERE crash = true;

CREATE INDEX IF NOT EXISTS idx_complaints_fire 
  ON nhtsa_complaints(fire) WHERE fire = true;

CREATE INDEX IF NOT EXISTS idx_complaints_injuries 
  ON nhtsa_complaints(injured) WHERE injured > 0;

CREATE INDEX IF NOT EXISTS idx_complaints_deaths 
  ON nhtsa_complaints(deaths) WHERE deaths > 0;

-- Index for component analysis
CREATE INDEX IF NOT EXISTS idx_complaints_component 
  ON nhtsa_complaints(component);

-- Full text search on summary/description
CREATE INDEX IF NOT EXISTS idx_complaints_search 
  ON nhtsa_complaints USING GIN(to_tsvector('english', summary || ' ' || description));

-- Comments
COMMENT ON TABLE nhtsa_complaints IS 'NHTSA ODI complaint data from FLAT_CMPL.zip';
COMMENT ON COLUMN nhtsa_complaints.odi_number IS 'Unique ODI complaint identifier';
COMMENT ON COLUMN nhtsa_complaints.crash IS 'Whether complaint involved a crash';
COMMENT ON COLUMN nhtsa_complaints.fire IS 'Whether complaint involved a fire';

-- ============================================================================
-- INVESTIGATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nhtsa_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiers
  nhtsa_id TEXT NOT NULL UNIQUE,
  
  -- Vehicle
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year TEXT NOT NULL,
  
  -- Investigation details
  component TEXT NOT NULL,
  subject TEXT NOT NULL,
  summary TEXT NOT NULL,
  
  -- Status
  open_date TIMESTAMPTZ NOT NULL,
  close_date TIMESTAMPTZ,
  action TEXT,
  
  -- Impact
  potential_affected INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast vehicle queries
CREATE INDEX IF NOT EXISTS idx_investigations_vehicle 
  ON nhtsa_investigations(year, make, model);

CREATE INDEX IF NOT EXISTS idx_investigations_make_model 
  ON nhtsa_investigations(make, model);

-- Index for open investigations
CREATE INDEX IF NOT EXISTS idx_investigations_status 
  ON nhtsa_investigations(close_date NULLS FIRST);

CREATE INDEX IF NOT EXISTS idx_investigations_open_date 
  ON nhtsa_investigations(open_date DESC);

-- Full text search
CREATE INDEX IF NOT EXISTS idx_investigations_search 
  ON nhtsa_investigations USING GIN(to_tsvector('english', subject || ' ' || summary));

-- Comments
COMMENT ON TABLE nhtsa_investigations IS 'NHTSA ODI investigation data from FLAT_INV.zip';
COMMENT ON COLUMN nhtsa_investigations.nhtsa_id IS 'Unique NHTSA investigation identifier';
COMMENT ON COLUMN nhtsa_investigations.close_date IS 'NULL indicates investigation is still open';

-- ============================================================================
-- RLS POLICIES (Permissive - API handles auth via NextAuth)
-- ============================================================================

ALTER TABLE nhtsa_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE nhtsa_investigations ENABLE ROW LEVEL SECURITY;

-- Complaints policies
CREATE POLICY "Allow read access to nhtsa_complaints"
  ON nhtsa_complaints FOR SELECT
  USING (true);

CREATE POLICY "Allow insert to nhtsa_complaints"
  ON nhtsa_complaints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update to nhtsa_complaints"
  ON nhtsa_complaints FOR UPDATE
  USING (true) WITH CHECK (true);

-- Investigations policies
CREATE POLICY "Allow read access to nhtsa_investigations"
  ON nhtsa_investigations FOR SELECT
  USING (true);

CREATE POLICY "Allow insert to nhtsa_investigations"
  ON nhtsa_investigations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update to nhtsa_investigations"
  ON nhtsa_investigations FOR UPDATE
  USING (true) WITH CHECK (true);

-- Policy comments
COMMENT ON POLICY "Allow read access to nhtsa_complaints" ON nhtsa_complaints IS 
  'Public safety data - no user-specific auth required';

COMMENT ON POLICY "Allow read access to nhtsa_investigations" ON nhtsa_investigations IS 
  'Public safety data - no user-specific auth required';

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for active investigations
CREATE OR REPLACE VIEW nhtsa_active_investigations AS
SELECT *
FROM nhtsa_investigations
WHERE close_date IS NULL
ORDER BY open_date DESC;

COMMENT ON VIEW nhtsa_active_investigations IS 
  'Currently open NHTSA investigations';

-- View for high-risk complaints (crash/fire/injury/death)
CREATE OR REPLACE VIEW nhtsa_high_risk_complaints AS
SELECT *
FROM nhtsa_complaints
WHERE crash = true 
   OR fire = true 
   OR injured > 0 
   OR deaths > 0
ORDER BY complaint_date DESC;

COMMENT ON VIEW nhtsa_high_risk_complaints IS 
  'Complaints involving crashes, fires, injuries, or deaths';
