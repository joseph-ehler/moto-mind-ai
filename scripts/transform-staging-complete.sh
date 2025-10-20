#!/bin/bash

###############################################################################
# NHTSA Full Data Transform - SQL Batch Processor
# 
# Transforms all 2.14M staging records to production in batches
# Uses direct SQL with increased timeouts
###############################################################################

set -e  # Exit on error

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set in .env.local"
  exit 1
fi

echo ""
echo "🚀 NHTSA FULL DATA TRANSFORM"
echo "================================================================================"
echo ""
echo "📊 This will process ALL 2,140,590 staging records"
echo "⏱️  Estimated time: 15-20 minutes"
echo ""

# Get counts
echo "📋 Checking current status..."
STAGING_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM staging_nhtsa_complaints;")
CURRENT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM nhtsa_complaints;")

echo "   Staging: $(echo $STAGING_COUNT | tr -d ' ') rows"
echo "   Production: $(echo $CURRENT_COUNT | tr -d ' ') rows"
echo ""

read -p "Press ENTER to start (or Ctrl+C to cancel)..."
echo ""

START_TIME=$(date +%s)

###############################################################################
# STEP 1: Process in 100K batches
###############################################################################

echo "🔄 STEP 1: Processing data in batches..."
echo ""

BATCH_SIZE=100000
OFFSET=0
BATCH_NUM=1
TOTAL_INSERTED=0

while [ $OFFSET -lt $STAGING_COUNT ]; do
  echo "📦 Batch $BATCH_NUM: Processing rows $OFFSET to $(($OFFSET + $BATCH_SIZE))..."
  
  BATCH_START=$(date +%s)
  
  # Execute batch with increased timeout
  INSERTED=$(psql "$DATABASE_URL" -t -c "
    SET statement_timeout = '10min';
    
    WITH batch_data AS (
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
        CASE 
          WHEN col16 ~ '^\d{8}$' THEN TO_TIMESTAMP(col16, 'YYYYMMDD')
          ELSE NOW()
        END as complaint_date,
        COALESCE(NULLIF(col12, ''), 'Unknown') as component,
        COALESCE(NULLIF(col20, ''), '') as summary,
        COALESCE(NULLIF(col20, ''), '') as description,
        COALESCE(col7 = 'Y', false) as crash,
        COALESCE(col9 = 'Y', false) as fire,
        COALESCE(NULLIF(col10, '')::INTEGER, 0) as injured,
        COALESCE(NULLIF(col11, '')::INTEGER, 0) as deaths,
        CASE WHEN col18 ~ '^\d+$' THEN col18::INTEGER ELSE NULL END as mileage,
        CASE 
          WHEN col8 ~ '^\d{8}$' THEN TO_TIMESTAMP(col8, 'YYYYMMDD')
          ELSE NULL
        END as fail_date,
        CASE WHEN col32 ~ '^\d+$' THEN col32::INTEGER ELSE NULL END as speed,
        NULLIF(col13, '') as city,
        NULLIF(col14, '') as state,
        NULL::TEXT as manufacturer_campaign
      FROM batch_data
      WHERE NULLIF(col2, '') IS NOT NULL
        AND NULLIF(col4, '') IS NOT NULL
        AND NULLIF(col5, '') IS NOT NULL
        AND NULLIF(col6, '') IS NOT NULL
    )
    INSERT INTO nhtsa_complaints (
      odi_number, nhtsa_id, make, model, year, vin,
      complaint_date, component, summary, description,
      crash, fire, injured, deaths,
      mileage, fail_date, speed,
      city, state, manufacturer_campaign
    )
    SELECT * FROM transformed
    ON CONFLICT (odi_number) DO NOTHING
    RETURNING 1;
  " | wc -l)
  
  BATCH_END=$(date +%s)
  BATCH_TIME=$(($BATCH_END - $BATCH_START))
  
  INSERTED_CLEAN=$(echo $INSERTED | tr -d ' ')
  TOTAL_INSERTED=$(($TOTAL_INSERTED + $INSERTED_CLEAN))
  
  echo "   ✅ Inserted: $INSERTED_CLEAN records in ${BATCH_TIME}s"
  echo "   📈 Total so far: $TOTAL_INSERTED records"
  echo ""
  
  OFFSET=$(($OFFSET + $BATCH_SIZE))
  BATCH_NUM=$(($BATCH_NUM + 1))
done

###############################################################################
# STEP 2: Refresh materialized views
###############################################################################

echo ""
echo "📊 STEP 2: Refreshing materialized views..."
echo ""

echo "   🔄 Complaints rollup..."
psql "$DATABASE_URL" -c "SET statement_timeout = '10min'; REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_complaints_rollup;" > /dev/null

echo "   🔄 Component rollup..."
psql "$DATABASE_URL" -c "SET statement_timeout = '10min'; REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_component_rollup;" > /dev/null

echo "   🔄 Safety rankings..."
psql "$DATABASE_URL" -c "SET statement_timeout = '10min'; REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_safety_rankings;" > /dev/null

echo "   ✅ All views refreshed"

###############################################################################
# STEP 3: VACUUM ANALYZE
###############################################################################

echo ""
echo "🧹 STEP 3: Optimizing database..."
echo ""

psql "$DATABASE_URL" -c "VACUUM ANALYZE nhtsa_complaints;" > /dev/null
echo "   ✅ Optimized"

###############################################################################
# FINAL STATS
###############################################################################

echo ""
echo "================================================================================"
echo "✅ TRANSFORM COMPLETE!"
echo "================================================================================"
echo ""

END_TIME=$(date +%s)
ELAPSED=$(($END_TIME - $START_TIME))
MINUTES=$(($ELAPSED / 60))
SECONDS=$(($ELAPSED % 60))

FINAL_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM nhtsa_complaints;")
ROLLUP_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM nhtsa_complaints_rollup;")

echo "⏱️  Total time: ${MINUTES}m ${SECONDS}s"
echo ""
echo "📊 Final Stats:"
echo "   • Total records: $(echo $FINAL_COUNT | tr -d ' ')"
echo "   • Unique vehicles: $(echo $ROLLUP_COUNT | tr -d ' ')"
echo "   • Success rate: $(echo "scale=1; $(echo $FINAL_COUNT | tr -d ' ') * 100 / $STAGING_COUNT" | bc)%"
echo ""
echo "💡 Next steps:"
echo "   1. Test queries: npm run db query \"SELECT year, make, model, safety_score FROM nhtsa_complaints_rollup ORDER BY safety_score DESC LIMIT 10\""
echo "   2. Integrate with vehicle-safety.ts"
echo "   3. Create UI components (RiskBadge, ProblemCard)"
echo ""
echo "🎉 You now have 2M+ complaints in your database!"
echo ""
