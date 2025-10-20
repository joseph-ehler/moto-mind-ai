#!/bin/bash

###############################################################################
# NHTSA Full Data Transform - Auto-Run (No Confirmation)
###############################################################################

set -e

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

echo ""
echo "🚀 NHTSA FULL DATA TRANSFORM - AUTO MODE"
echo "================================================================================"
echo ""

START_TIME=$(date +%s)

# Get counts
STAGING_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM staging_nhtsa_complaints;")
echo "📊 Staging records: $(echo $STAGING_COUNT | tr -d ' ')"
echo "⏱️  Estimated time: 15-20 minutes"
echo ""

###############################################################################
# Process in batches
###############################################################################

echo "🔄 Processing data in 100K batches..."
echo ""

BATCH_SIZE=100000
OFFSET=0
BATCH_NUM=1
TOTAL_INSERTED=0

while [ $OFFSET -lt $STAGING_COUNT ]; do
  echo "📦 Batch $BATCH_NUM (rows $OFFSET-$(($OFFSET + $BATCH_SIZE)))..."
  
  BATCH_START=$(date +%s)
  
  RESULT=$(psql "$DATABASE_URL" -t -c "
    SET statement_timeout = '10min';
    
    WITH batch AS (
      SELECT * FROM staging_nhtsa_complaints
      OFFSET $OFFSET LIMIT $BATCH_SIZE
    ),
    transformed AS (
      SELECT DISTINCT ON (odi_number)
        NULLIF(col2, '') as odi_number,
        NULLIF(col1, '') as nhtsa_id,
        UPPER(TRIM(NULLIF(col4, ''))) as make,
        UPPER(TRIM(NULLIF(col5, ''))) as model,
        NULLIF(col6, '') as year,
        NULLIF(col15, '') as vin,
        CASE WHEN col16 ~ '^\d{8}$' THEN TO_TIMESTAMP(col16, 'YYYYMMDD') ELSE NOW() END as complaint_date,
        COALESCE(NULLIF(col12, ''), 'Unknown') as component,
        COALESCE(NULLIF(col20, ''), '') as summary,
        COALESCE(NULLIF(col20, ''), '') as description,
        COALESCE(col7 = 'Y', false) as crash,
        COALESCE(col9 = 'Y', false) as fire,
        COALESCE(NULLIF(col10, '')::INTEGER, 0) as injured,
        COALESCE(NULLIF(col11, '')::INTEGER, 0) as deaths,
        CASE WHEN col18 ~ '^\d+$' THEN col18::INTEGER END as mileage,
        CASE WHEN col8 ~ '^\d{8}$' THEN TO_TIMESTAMP(col8, 'YYYYMMDD') END as fail_date,
        CASE WHEN col32 ~ '^\d+$' THEN col32::INTEGER END as speed,
        NULLIF(col13, '') as city,
        NULLIF(col14, '') as state,
        NULL::TEXT as manufacturer_campaign
      FROM batch
      WHERE NULLIF(col2, '') IS NOT NULL
        AND NULLIF(col4, '') IS NOT NULL
        AND NULLIF(col5, '') IS NOT NULL
        AND NULLIF(col6, '') IS NOT NULL
    ),
    inserted AS (
      INSERT INTO nhtsa_complaints (
        odi_number, nhtsa_id, make, model, year, vin,
        complaint_date, component, summary, description,
        crash, fire, injured, deaths,
        mileage, fail_date, speed,
        city, state, manufacturer_campaign
      )
      SELECT * FROM transformed
      ON CONFLICT (odi_number) DO NOTHING
      RETURNING 1
    )
    SELECT COUNT(*) FROM inserted;
  ")
  
  BATCH_END=$(date +%s)
  BATCH_TIME=$(($BATCH_END - $BATCH_START))
  
  INSERTED=$(echo $RESULT | tr -d ' ')
  TOTAL_INSERTED=$(($TOTAL_INSERTED + $INSERTED))
  
  PERCENT=$(echo "scale=1; $OFFSET * 100 / $STAGING_COUNT" | bc)
  
  echo "   ✅ +$INSERTED records in ${BATCH_TIME}s | Total: $TOTAL_INSERTED | Progress: ${PERCENT}%"
  
  OFFSET=$(($OFFSET + $BATCH_SIZE))
  BATCH_NUM=$(($BATCH_NUM + 1))
done

###############################################################################
# Refresh views
###############################################################################

echo ""
echo "📊 Refreshing materialized views..."

psql "$DATABASE_URL" -c "SET statement_timeout = '10min'; REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_complaints_rollup;" > /dev/null
echo "   ✅ Complaints rollup"

psql "$DATABASE_URL" -c "SET statement_timeout = '10min'; REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_component_rollup;" > /dev/null
echo "   ✅ Component rollup"

psql "$DATABASE_URL" -c "SET statement_timeout = '10min'; REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_safety_rankings;" > /dev/null
echo "   ✅ Safety rankings"

###############################################################################
# Optimize
###############################################################################

echo ""
echo "🧹 Optimizing database..."
psql "$DATABASE_URL" -c "VACUUM ANALYZE nhtsa_complaints;" > /dev/null
echo "   ✅ Done"

###############################################################################
# Final stats
###############################################################################

END_TIME=$(date +%s)
ELAPSED=$(($END_TIME - $START_TIME))
MINUTES=$(($ELAPSED / 60))
SECONDS=$(($ELAPSED % 60))

FINAL_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM nhtsa_complaints;")
ROLLUP_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM nhtsa_complaints_rollup;")

echo ""
echo "================================================================================"
echo "✅ TRANSFORM COMPLETE!"
echo "================================================================================"
echo ""
echo "⏱️  Total time: ${MINUTES}m ${SECONDS}s"
echo "📊 Final count: $(echo $FINAL_COUNT | tr -d ' ') records"
echo "🚗 Unique vehicles: $(echo $ROLLUP_COUNT | tr -d ' ')"
echo ""
echo "🎉 SUCCESS! You now have 2M+ complaints ready to query!"
echo ""
