/**
 * NHTSA Materialized Views & Functions
 * 
 * Pre-computed aggregations for fast queries:
 * - Vehicle complaint rollups
 * - Component problem patterns
 * - Safety score calculations
 */

-- ============================================================================
-- SAFETY SCORE FUNCTION
-- ============================================================================

/**
 * Calculate safety risk score (0-100)
 * 
 * Algorithm:
 *   - 0.5 pts per complaint (max 30)
 *   - 5 pts per crash
 *   - 10 pts per fire
 *   - 3 pts per injury
 *   - 15 pts per death
 *   - Capped at 100
 * 
 * Risk Levels:
 *   0-29: LOW
 *   30-59: MEDIUM
 *   60-79: HIGH
 *   80-100: CRITICAL
 */
CREATE OR REPLACE FUNCTION nhtsa_safety_score(
  total INT,
  crashes INT,
  fires INT,
  injuries INT,
  deaths INT
) RETURNS INT AS $$
BEGIN
  RETURN LEAST(
    (LEAST(total * 0.5, 30))::INT +  -- 0.5 pts per complaint, max 30
    (crashes * 5) +                   -- 5 pts per crash
    (fires * 10) +                    -- 10 pts per fire
    (injuries * 3) +                  -- 3 pts per injury
    (deaths * 15),                    -- 15 pts per death
    100                               -- Cap at 100
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION nhtsa_safety_score IS 'Calculate safety risk score (0-100) from complaint stats';

-- ============================================================================
-- MATERIALIZED VIEW: Complaints by Vehicle
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS nhtsa_complaints_rollup AS
SELECT
  year,
  make,
  model,
  
  -- Counts
  COUNT(*) as total_complaints,
  COUNT(DISTINCT odi_number) as unique_complaints,
  
  -- Incidents
  SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT as crashes,
  SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT as fires,
  SUM(injured)::INT as total_injured,
  SUM(deaths)::INT as total_deaths,
  
  -- Dates
  MIN(complaint_date) as first_complaint,
  MAX(complaint_date) as most_recent_complaint,
  
  -- Context
  AVG(mileage) FILTER (WHERE mileage IS NOT NULL)::INT as avg_mileage,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY mileage) FILTER (WHERE mileage IS NOT NULL)::INT as median_mileage,
  
  -- Safety Score
  nhtsa_safety_score(
    COUNT(*)::INT,
    SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT,
    SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT,
    SUM(injured)::INT,
    SUM(deaths)::INT
  ) as safety_score,
  
  -- Risk Level
  CASE 
    WHEN nhtsa_safety_score(
      COUNT(*)::INT,
      SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT,
      SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT,
      SUM(injured)::INT,
      SUM(deaths)::INT
    ) >= 80 THEN 'CRITICAL'
    WHEN nhtsa_safety_score(
      COUNT(*)::INT,
      SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT,
      SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT,
      SUM(injured)::INT,
      SUM(deaths)::INT
    ) >= 60 THEN 'HIGH'
    WHEN nhtsa_safety_score(
      COUNT(*)::INT,
      SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT,
      SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT,
      SUM(injured)::INT,
      SUM(deaths)::INT
    ) >= 30 THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_level,
  
  NOW() as refreshed_at
  
FROM nhtsa_complaints
WHERE year IS NOT NULL 
  AND make IS NOT NULL 
  AND model IS NOT NULL
  AND year != '9999'  -- Exclude unknown years
GROUP BY year, make, model;

-- Unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_rollup_vehicle 
  ON nhtsa_complaints_rollup(year, make, model);

-- Index for high-risk queries
CREATE INDEX IF NOT EXISTS idx_complaints_rollup_risk 
  ON nhtsa_complaints_rollup(safety_score DESC) 
  WHERE safety_score >= 60;

COMMENT ON MATERIALIZED VIEW nhtsa_complaints_rollup IS 
  'Pre-computed complaint statistics by vehicle (year/make/model)';

-- ============================================================================
-- MATERIALIZED VIEW: Component Problems by Vehicle
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS nhtsa_component_rollup AS
SELECT
  year,
  make,
  model,
  component,
  
  -- Counts
  COUNT(*) as complaint_count,
  
  -- Incidents for this component
  SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT as crashes,
  SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT as fires,
  SUM(injured)::INT as injuries,
  SUM(deaths)::INT as deaths,
  
  -- Severity score (component-specific)
  nhtsa_safety_score(
    COUNT(*)::INT,
    SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT,
    SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT,
    SUM(injured)::INT,
    SUM(deaths)::INT
  ) as severity_score,
  
  -- Context
  AVG(mileage) FILTER (WHERE mileage IS NOT NULL)::INT as avg_failure_mileage,
  
  -- Dates
  MIN(complaint_date) as first_complaint,
  MAX(complaint_date) as most_recent_complaint,
  
  -- Sample descriptions (first 3)
  ARRAY(
    SELECT summary 
    FROM nhtsa_complaints c
    WHERE c.year = nhtsa_complaints.year
      AND c.make = nhtsa_complaints.make
      AND c.model = nhtsa_complaints.model
      AND c.component = nhtsa_complaints.component
    ORDER BY complaint_date DESC
    LIMIT 3
  ) as sample_descriptions,
  
  NOW() as refreshed_at
  
FROM nhtsa_complaints
WHERE component IS NOT NULL
  AND year IS NOT NULL
  AND make IS NOT NULL
  AND model IS NOT NULL
  AND year != '9999'
GROUP BY year, make, model, component;

-- Index for vehicle + component lookups
CREATE INDEX IF NOT EXISTS idx_component_rollup_vehicle 
  ON nhtsa_component_rollup(year, make, model, complaint_count DESC);

-- Index for top problems
CREATE INDEX IF NOT EXISTS idx_component_rollup_severity 
  ON nhtsa_component_rollup(severity_score DESC);

COMMENT ON MATERIALIZED VIEW nhtsa_component_rollup IS 
  'Pre-computed component problem patterns by vehicle';

-- ============================================================================
-- MATERIALIZED VIEW: Make/Model Safety Rankings
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS nhtsa_safety_rankings AS
SELECT
  make,
  model,
  
  -- Aggregate across all years
  COUNT(DISTINCT year) as years_covered,
  SUM(total_complaints) as total_complaints,
  SUM(crashes) as total_crashes,
  SUM(fires) as total_fires,
  SUM(total_injured) as total_injured,
  SUM(total_deaths) as total_deaths,
  
  -- Average safety score across years
  AVG(safety_score)::INT as avg_safety_score,
  MAX(safety_score) as worst_year_score,
  
  -- Most problematic year
  (ARRAY_AGG(year ORDER BY safety_score DESC))[1] as worst_year,
  
  NOW() as refreshed_at
  
FROM nhtsa_complaints_rollup
GROUP BY make, model;

CREATE INDEX IF NOT EXISTS idx_safety_rankings_score 
  ON nhtsa_safety_rankings(avg_safety_score DESC);

CREATE INDEX IF NOT EXISTS idx_safety_rankings_make 
  ON nhtsa_safety_rankings(make, model);

COMMENT ON MATERIALIZED VIEW nhtsa_safety_rankings IS 
  'Safety rankings aggregated across all model years';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Refresh all NHTSA rollups
 * Call after importing new data
 */
CREATE OR REPLACE FUNCTION refresh_nhtsa_rollups()
RETURNS TEXT AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_complaints_rollup;
  REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_component_rollup;
  REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_safety_rankings;
  
  RETURN 'All rollups refreshed successfully';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_nhtsa_rollups IS 
  'Refresh all NHTSA materialized views (call after data import)';
