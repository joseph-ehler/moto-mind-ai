#!/bin/bash

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "🔧 Fixing materialized view indexes..."

psql "$DATABASE_URL" -c "
-- Drop and recreate component rollup with proper unique index
DROP MATERIALIZED VIEW IF EXISTS nhtsa_component_rollup CASCADE;

CREATE MATERIALIZED VIEW nhtsa_component_rollup AS
SELECT
  year,
  make,
  model,
  component,
  COUNT(*) as complaint_count,
  SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT as crashes,
  SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT as fires,
  SUM(injured)::INT as injuries,
  SUM(deaths)::INT as deaths,
  nhtsa_safety_score(
    COUNT(*)::INT,
    SUM(CASE WHEN crash THEN 1 ELSE 0 END)::INT,
    SUM(CASE WHEN fire THEN 1 ELSE 0 END)::INT,
    SUM(injured)::INT,
    SUM(deaths)::INT
  ) as severity_score,
  AVG(mileage) FILTER (WHERE mileage IS NOT NULL)::INT as avg_failure_mileage,
  MIN(complaint_date) as first_complaint,
  MAX(complaint_date) as most_recent_complaint,
  NOW() as refreshed_at
FROM nhtsa_complaints
WHERE component IS NOT NULL
  AND year IS NOT NULL
  AND make IS NOT NULL
  AND model IS NOT NULL
  AND year != '9999'
GROUP BY year, make, model, component;

CREATE UNIQUE INDEX idx_component_rollup_unique 
  ON nhtsa_component_rollup(year, make, model, component);

CREATE INDEX idx_component_rollup_vehicle 
  ON nhtsa_component_rollup(year, make, model, complaint_count DESC);

CREATE INDEX idx_component_rollup_severity 
  ON nhtsa_component_rollup(severity_score DESC);

-- Also fix safety rankings
DROP MATERIALIZED VIEW IF EXISTS nhtsa_safety_rankings CASCADE;

CREATE MATERIALIZED VIEW nhtsa_safety_rankings AS
SELECT
  make,
  model,
  COUNT(DISTINCT year) as years_covered,
  SUM(total_complaints) as total_complaints,
  SUM(crashes) as total_crashes,
  SUM(fires) as total_fires,
  SUM(total_injured) as total_injured,
  SUM(total_deaths) as total_deaths,
  AVG(safety_score)::INT as avg_safety_score,
  MAX(safety_score) as worst_year_score,
  (ARRAY_AGG(year ORDER BY safety_score DESC))[1] as worst_year,
  NOW() as refreshed_at
FROM nhtsa_complaints_rollup
GROUP BY make, model;

CREATE UNIQUE INDEX idx_safety_rankings_unique 
  ON nhtsa_safety_rankings(make, model);

CREATE INDEX idx_safety_rankings_score 
  ON nhtsa_safety_rankings(avg_safety_score DESC);
"

echo "✅ Indexes fixed! Now run: ./scripts/transform-staging-auto.sh to refresh views"
