/**
 * NHTSA Batch Loader (Handles Large Datasets)
 * 
 * Processes data in batches to avoid timeouts:
 * 1. COPY to staging (fast bulk import)
 * 2. Process staging → production in 100K batches
 * 3. Refresh materialized views
 * 
 * Handles 2.14M records without timeout issues
 */

import 'dotenv/config'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs'

const execAsync = promisify(exec)

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set')
  process.exit(1)
}

const COMPLAINTS_FILE = path.join(process.cwd(), 'data/nhtsa/complaints/FLAT_CMPL.txt')
const INVESTIGATIONS_FILE = path.join(process.cwd(), 'data/nhtsa/investigations/FLAT_INV.txt')
const BATCH_SIZE = 100000

async function execSQL(sql: string, description?: string) {
  if (description) console.log(`⚙️  ${description}...`)
  const start = Date.now()
  
  try {
    // Increase statement timeout for this session
    const fullSQL = `SET statement_timeout = '10min'; ${sql}`
    const { stdout } = await execAsync(`psql "${DATABASE_URL}" -c "${fullSQL}"`)
    const elapsed = Date.now() - start
    
    if (description) {
      console.log(`   ✅ Complete (${(elapsed/1000).toFixed(1)}s)`)
    }
    return stdout
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`)
    throw error
  }
}

async function copyData(filePath: string, tableName: string, description: string) {
  console.log(`📥 ${description}...`)
  const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1)
  console.log(`   File: ${path.basename(filePath)} (${fileSize} MB)`)
  
  const start = Date.now()
  const copyCommand = `\\copy ${tableName} FROM '${filePath}' WITH (FORMAT csv, DELIMITER E'\\\\t', HEADER false, QUOTE E'\\\\b', ESCAPE E'\\\\b')`
  
  const { stdout } = await execAsync(`psql "${DATABASE_URL}" -c "${copyCommand}"`)
  const elapsed = Date.now() - start
  const match = stdout.match(/COPY (\d+)/)
  const rows = match ? parseInt(match[1]).toLocaleString() : 'unknown'
  
  console.log(`   ✅ Loaded ${rows} rows in ${(elapsed/1000).toFixed(1)}s`)
  return rows
}

/**
 * Process staging data in batches to avoid timeouts
 */
async function processBatches(sourceTable: string, targetTable: string, transformFunc: string, totalRows: number) {
  let processed = 0
  let inserted = 0
  let batch = 0
  
  console.log(`\n📦 Processing ${totalRows.toLocaleString()} rows in batches of ${BATCH_SIZE.toLocaleString()}...\n`)
  
  while (processed < totalRows) {
    batch++
    const offset = processed
    const limit = Math.min(BATCH_SIZE, totalRows - processed)
    
    const sql = `
      WITH batch AS (
        SELECT * FROM ${sourceTable}
        OFFSET ${offset} LIMIT ${limit}
      ),
      valid_rows AS (
        SELECT DISTINCT ON (odi_number) *
        FROM (
          SELECT
            NULLIF(col2, '') as odi_number,
            NULLIF(col1, '') as nhtsa_id,
            UPPER(TRIM(NULLIF(col4, ''))) as make,
            UPPER(TRIM(NULLIF(col5, ''))) as model,
            NULLIF(col6, '') as year,
            NULLIF(col15, '') as vin,
            CASE WHEN col16 ~ '^\\d{8}$' THEN TO_TIMESTAMP(col16, 'YYYYMMDD') ELSE NOW() END as complaint_date,
            COALESCE(NULLIF(col12, ''), 'Unknown') as component,
            COALESCE(NULLIF(col20, ''), '') as summary,
            COALESCE(NULLIF(col20, ''), '') as description,
            COALESCE(col7 = 'Y', false) as crash,
            COALESCE(col9 = 'Y', false) as fire,
            COALESCE(col10::INTEGER, 0) as injured,
            COALESCE(col11::INTEGER, 0) as deaths,
            CASE WHEN col18 ~ '^\\d+$' THEN col18::INTEGER ELSE NULL END as mileage,
            CASE WHEN col8 ~ '^\\d{8}$' THEN TO_TIMESTAMP(col8, 'YYYYMMDD') ELSE NULL END as fail_date,
            CASE WHEN col32 ~ '^\\d+$' THEN col32::INTEGER ELSE NULL END as speed,
            NULLIF(col13, '') as city,
            NULLIF(col14, '') as state,
            NULL as manufacturer_campaign
          FROM batch
          WHERE NULLIF(col2, '') IS NOT NULL
            AND NULLIF(col4, '') IS NOT NULL
            AND NULLIF(col5, '') IS NOT NULL
            AND NULLIF(col6, '') IS NOT NULL
        ) sub
      )
      INSERT INTO ${targetTable} (
        odi_number, nhtsa_id, make, model, year, vin,
        complaint_date, component, summary, description,
        crash, fire, injured, deaths,
        mileage, fail_date, speed,
        city, state, manufacturer_campaign
      )
      SELECT * FROM valid_rows
      ON CONFLICT (odi_number) DO NOTHING
    `
    
    const result = await execSQL(sql)
    const match = result.match(/INSERT \d+ (\d+)/)
    const batchInserted = match ? parseInt(match[1]) : 0
    
    inserted += batchInserted
    processed += limit
    
    const percent = ((processed / totalRows) * 100).toFixed(1)
    console.log(`   Batch ${batch}: Inserted ${batchInserted.toLocaleString()} | Total: ${inserted.toLocaleString()} (${percent}%)`)
  }
  
  return { inserted, skipped: totalRows - inserted }
}

async function main() {
  console.log('\n🚀 NHTSA BATCH LOADER\n')
  console.log('=' .repeat(80))
  console.log('\n⚡ Optimized for 2.14M+ records\n')
  
  const overallStart = Date.now()
  
  try {
    // Step 1: Verify files
    console.log('📁 STEP 1: Verifying data files...\n')
    if (!fs.existsSync(COMPLAINTS_FILE)) {
      throw new Error(`File not found: ${COMPLAINTS_FILE}`)
    }
    console.log('   ✅ Files verified')
    
    // Step 2: Truncate staging
    console.log('\n🗑️  STEP 2: Clearing staging tables...\n')
    await execSQL('TRUNCATE staging_nhtsa_complaints', 'Truncating')
    
    // Step 3: COPY to staging
    console.log('\n📥 STEP 3: Loading to staging (bulk import)...\n')
    const rows = await copyData(
      COMPLAINTS_FILE,
      'staging_nhtsa_complaints',
      'Importing complaints'
    )
    
    const totalRows = parseInt(rows.replace(/,/g, ''))
    
    // Step 4: Process in batches
    console.log('\n🔄 STEP 4: Transforming data (batch processing)...')
    const { inserted, skipped } = await processBatches(
      'staging_nhtsa_complaints',
      'nhtsa_complaints',
      'transform_nhtsa_complaints',
      totalRows
    )
    
    // Step 5: Refresh rollups
    console.log('\n\n📊 STEP 5: Building rollup views...\n')
    await execSQL('REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_complaints_rollup', 'Complaints rollup')
    await execSQL('REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_component_rollup', 'Component rollup')
    await execSQL('REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_safety_rankings', 'Safety rankings')
    
    // Step 6: VACUUM
    console.log('\n🧹 STEP 6: Optimizing database...\n')
    await execSQL('VACUUM ANALYZE nhtsa_complaints', 'Optimizing')
    
    // Summary
    const elapsed = Date.now() - overallStart
    const minutes = Math.floor(elapsed / 60000)
    const seconds = ((elapsed % 60000) / 1000).toFixed(0)
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ LOAD COMPLETE!')
    console.log('='.repeat(80))
    console.log(`\n⏱️  Total time: ${minutes}m ${seconds}s`)
    console.log(`\n📊 Summary:`)
    console.log(`   • Loaded: ${rows} rows`)
    console.log(`   • Inserted: ${inserted.toLocaleString()} unique complaints`)
    console.log(`   • Skipped: ${skipped.toLocaleString()} duplicates/invalid`)
    console.log(`   • Success rate: ${((inserted/totalRows)*100).toFixed(1)}%`)
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n❌ LOAD FAILED:', error.message)
    process.exit(1)
  }
}

main()
