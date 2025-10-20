/**
 * NHTSA Staging Tables & Transform Functions
 * 
 * Staging tables for fast COPY import (no constraints, all TEXT)
 * Transform functions to validate and move data to production tables
 */

-- ============================================================================
-- STAGING TABLES (Fast COPY import)
-- ============================================================================

-- Staging: Complaints (49 columns, all TEXT for fast import)
CREATE TABLE IF NOT EXISTS staging_nhtsa_complaints (
  col1 TEXT,  -- CMPLID
  col2 TEXT,  -- ODINO
  col3 TEXT,  -- MFR_NAME
  col4 TEXT,  -- MAKETXT
  col5 TEXT,  -- MODELTXT
  col6 TEXT,  -- YEARTXT
  col7 TEXT,  -- CRASH
  col8 TEXT,  -- FAILDATE
  col9 TEXT,  -- FIRE
  col10 TEXT, -- INJURED
  col11 TEXT, -- DEATHS
  col12 TEXT, -- COMPDESC
  col13 TEXT, -- CITY
  col14 TEXT, -- STATE
  col15 TEXT, -- VIN
  col16 TEXT, -- DATEA
  col17 TEXT, -- LDATE
  col18 TEXT, -- MILES
  col19 TEXT, -- OCCURENCES
  col20 TEXT, -- CDESCR
  col21 TEXT, -- CMPL_TYPE
  col22 TEXT, -- POLICE_RPT_YN
  col23 TEXT, -- PURCH_DT
  col24 TEXT, -- ORIG_OWNER_YN
  col25 TEXT, -- ANTI_BRAKES_YN
  col26 TEXT, -- CRUISE_CONT_YN
  col27 TEXT, -- NUM_CYLS
  col28 TEXT, -- DRIVE_TRAIN
  col29 TEXT, -- FUEL_SYS
  col30 TEXT, -- FUEL_TYPE
  col31 TEXT, -- TRANS_TYPE
  col32 TEXT, -- VEH_SPEED
  col33 TEXT, -- DOT
  col34 TEXT, -- TIRE_SIZE
  col35 TEXT, -- LOC_OF_TIRE
  col36 TEXT, -- TIRE_FAIL_TYPE
  col37 TEXT, -- ORIG_EQUIP_YN
  col38 TEXT, -- MANUF_DT
  col39 TEXT, -- SEAT_TYPE
  col40 TEXT, -- RESTRAINT_TYPE
  col41 TEXT, -- DEALER_NAME
  col42 TEXT, -- DEALER_TEL
  col43 TEXT, -- DEALER_CITY
  col44 TEXT, -- DEALER_STATE
  col45 TEXT, -- DEALER_ZIP
  col46 TEXT, -- PROD_TYPE
  col47 TEXT, -- REPAIRED_YN
  col48 TEXT, -- MEDICAL_ATTN
  col49 TEXT  -- VEHICLES_TOWED_YN
);

-- Staging: Investigations (11 columns, all TEXT)
CREATE TABLE IF NOT EXISTS staging_nhtsa_investigations (
  col1 TEXT,  -- NHTSA_ACTION_NUMBER
  col2 TEXT,  -- MAKE
  col3 TEXT,  -- MODEL
  col4 TEXT,  -- YEAR
  col5 TEXT,  -- COMPNAME
  col6 TEXT,  -- MFR_NAME
  col7 TEXT,  -- ODATE
  col8 TEXT,  -- CDATE
  col9 TEXT,  -- CAMPNO
  col10 TEXT, -- SUBJECT
  col11 TEXT  -- SUMMARY
);

COMMENT ON TABLE staging_nhtsa_complaints IS 'Staging table for fast COPY import - no constraints';
COMMENT ON TABLE staging_nhtsa_investigations IS 'Staging table for fast COPY import - no constraints';

-- ============================================================================
-- TRANSFORM FUNCTIONS (Staging → Production)
-- ============================================================================

/**
 * Transform complaints from staging to production
 * Validates, normalizes, and inserts valid records
 */
CREATE OR REPLACE FUNCTION transform_nhtsa_complaints() 
RETURNS TABLE(inserted BIGINT, skipped BIGINT, total BIGINT) AS $$
DECLARE
  v_inserted BIGINT;
  v_total BIGINT;
BEGIN
  -- Get total staging records
  SELECT COUNT(*) INTO v_total FROM staging_nhtsa_complaints;
  
  -- Insert valid records with transformation
  WITH valid_rows AS (
    SELECT DISTINCT ON (NULLIF(col2, ''))
      -- Identifiers
      NULLIF(col2, '') as odi_number,  -- ODINO
      NULLIF(col1, '') as nhtsa_id,    -- CMPLID
      
      -- Vehicle (normalized)
      UPPER(TRIM(NULLIF(col4, ''))) as make,    -- MAKETXT
      UPPER(TRIM(NULLIF(col5, ''))) as model,   -- MODELTXT
      NULLIF(col6, '') as year,                 -- YEARTXT
      NULLIF(col15, '') as vin,                 -- VIN
      
      -- Details
      CASE 
        WHEN col16 ~ '^\d{8}$' THEN TO_TIMESTAMP(col16, 'YYYYMMDD')
        ELSE NOW()
      END as complaint_date,  -- DATEA
      
      COALESCE(NULLIF(col12, ''), 'Unknown') as component,  -- COMPDESC
      COALESCE(NULLIF(col20, ''), '') as summary,           -- CDESCR
      COALESCE(NULLIF(col20, ''), '') as description,       -- CDESCR
      
      -- Incident
      COALESCE(col7 = 'Y', false) as crash,   -- CRASH
      COALESCE(col9 = 'Y', false) as fire,    -- FIRE
      COALESCE(col10::INTEGER, 0) as injured, -- INJURED
      COALESCE(col11::INTEGER, 0) as deaths,  -- DEATHS
      
      -- Context
      CASE WHEN col18 ~ '^\d+$' THEN col18::INTEGER ELSE NULL END as mileage, -- MILES
      CASE 
        WHEN col8 ~ '^\d{8}$' THEN TO_TIMESTAMP(col8, 'YYYYMMDD')
        ELSE NULL 
      END as fail_date,  -- FAILDATE
      CASE WHEN col32 ~ '^\d+$' THEN col32::INTEGER ELSE NULL END as speed, -- VEH_SPEED
      
      -- Location
      NULLIF(col13, '') as city,   -- CITY
      NULLIF(col14, '') as state,  -- STATE
      
      -- Follow-up
      NULL as manufacturer_campaign
      
    FROM staging_nhtsa_complaints
    WHERE NULLIF(col2, '') IS NOT NULL  -- Must have ODI number
      AND NULLIF(col4, '') IS NOT NULL  -- Must have make
      AND NULLIF(col5, '') IS NOT NULL  -- Must have model
      AND NULLIF(col6, '') IS NOT NULL  -- Must have year
  )
  INSERT INTO nhtsa_complaints (
    odi_number, nhtsa_id, make, model, year, vin,
    complaint_date, component, summary, description,
    crash, fire, injured, deaths,
    mileage, fail_date, speed,
    city, state, manufacturer_campaign
  )
  SELECT * FROM valid_rows
  ON CONFLICT (odi_number) DO NOTHING;
  
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  
  RETURN QUERY SELECT v_inserted, v_total - v_inserted, v_total;
END;
$$ LANGUAGE plpgsql;

/**
 * Transform investigations from staging to production
 */
CREATE OR REPLACE FUNCTION transform_nhtsa_investigations() 
RETURNS TABLE(inserted BIGINT, skipped BIGINT, total BIGINT) AS $$
DECLARE
  v_inserted BIGINT;
  v_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM staging_nhtsa_investigations;
  
  WITH valid_rows AS (
    SELECT DISTINCT ON (NULLIF(col1, ''))
      NULLIF(col1, '') as nhtsa_id,                     -- NHTSA_ACTION_NUMBER
      UPPER(TRIM(NULLIF(col2, ''))) as make,           -- MAKE
      UPPER(TRIM(NULLIF(col3, ''))) as model,          -- MODEL
      NULLIF(col4, '') as year,                        -- YEAR
      COALESCE(NULLIF(col5, ''), 'Unknown') as component, -- COMPNAME
      COALESCE(NULLIF(col10, ''), '') as subject,      -- SUBJECT
      COALESCE(NULLIF(col11, ''), '') as summary,      -- SUMMARY
      
      CASE 
        WHEN col7 ~ '^\d{8}$' THEN TO_TIMESTAMP(col7, 'YYYYMMDD')
        ELSE NOW()
      END as open_date,  -- ODATE
      
      CASE 
        WHEN col8 ~ '^\d{8}$' THEN TO_TIMESTAMP(col8, 'YYYYMMDD')
        ELSE NULL
      END as close_date,  -- CDATE
      
      NULLIF(col9, '') as action,  -- CAMPNO
      NULL::INTEGER as potential_affected
      
    FROM staging_nhtsa_investigations
    WHERE NULLIF(col1, '') IS NOT NULL  -- Must have ID
      AND NULLIF(col2, '') IS NOT NULL  -- Must have make
      AND NULLIF(col3, '') IS NOT NULL  -- Must have model
      AND NULLIF(col4, '') IS NOT NULL  -- Must have year
  )
  INSERT INTO nhtsa_investigations (
    nhtsa_id, make, model, year, component, subject, summary,
    open_date, close_date, action, potential_affected
  )
  SELECT * FROM valid_rows
  ON CONFLICT (nhtsa_id) DO NOTHING;
  
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  
  RETURN QUERY SELECT v_inserted, v_total - v_inserted, v_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION transform_nhtsa_complaints IS 'Transform staging complaints to production with validation';
COMMENT ON FUNCTION transform_nhtsa_investigations IS 'Transform staging investigations to production with validation';
