/**
 * NHTSA Fast Data Loader
 * 
 * Uses PostgreSQL COPY for fast bulk import:
 * 1. COPY to staging tables (no constraints)
 * 2. Transform & validate to production tables
 * 3. Refresh materialized views
 * 4. VACUUM ANALYZE
 * 
 * Expected time: ~5-10 minutes for 2.14M records
 */

import 'dotenv/config'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs'

const execAsync = promisify(exec)

// Verify environment
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set')
  console.error('   Add it to .env.local file')
  process.exit(1)
}

// Data files
const COMPLAINTS_FILE = path.join(process.cwd(), 'data/nhtsa/complaints/FLAT_CMPL.txt')
const INVESTIGATIONS_FILE = path.join(process.cwd(), 'data/nhtsa/investigations/FLAT_INV.txt')

/**
 * Execute SQL command via psql
 */
async function execSQL(sql: string, description: string) {
  console.log(`⚙️  ${description}...`)
  const start = Date.now()
  
  try {
    const { stdout, stderr } = await execAsync(`psql "${DATABASE_URL}" -c "${sql}"`)
    const elapsed = Date.now() - start
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.error(`⚠️  ${stderr}`)
    }
    
    if (stdout) {
      console.log(`   ${stdout.trim()}`)
    }
    
    console.log(`   ✅ Complete (${elapsed}ms)`)
    return stdout
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`)
    throw error
  }
}

/**
 * Execute COPY command via psql
 */
async function copyData(filePath: string, tableName: string, description: string) {
  console.log(`📥 ${description}...`)
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  
  const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1)
  console.log(`   File: ${filePath} (${fileSize} MB)`)
  
  const start = Date.now()
  
  try {
    // Use COPY with special settings for NHTSA TSV files
    // QUOTE and ESCAPE set to backspace to effectively disable them (works for messy data)
    const copyCommand = `\\copy ${tableName} FROM '${filePath}' WITH (FORMAT csv, DELIMITER E'\\\\t', HEADER false, QUOTE E'\\\\b', ESCAPE E'\\\\b')`
    
    const { stdout, stderr } = await execAsync(`psql "${DATABASE_URL}" -c "${copyCommand}"`)
    
    const elapsed = Date.now() - start
    const seconds = (elapsed / 1000).toFixed(1)
    
    // Extract row count from output
    const match = stdout.match(/COPY (\d+)/)
    const rows = match ? parseInt(match[1]).toLocaleString() : 'unknown'
    
    console.log(`   ✅ Loaded ${rows} rows in ${seconds}s`)
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn(`   ⚠️  ${stderr}`)
    }
    
    return rows
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`)
    throw error
  }
}

/**
 * Main load function
 */
async function loadNHTSAData() {
  console.log('\n🚀 NHTSA FAST DATA LOADER\n')
  console.log('=' .repeat(80))
  console.log('\n📊 Expected import: 2.14M complaints + 153K investigations')
  console.log('⏱️  Estimated time: 5-10 minutes\n')
  
  const overallStart = Date.now()
  
  try {
    // ========================================================================
    // STEP 1: Verify files exist
    // ========================================================================
    console.log('\n📁 STEP 1: Verifying data files...\n')
    
    if (!fs.existsSync(COMPLAINTS_FILE)) {
      throw new Error(`Complaints file not found: ${COMPLAINTS_FILE}\n   Run: npx tsx scripts/download-nhtsa-data.ts`)
    }
    
    if (!fs.existsSync(INVESTIGATIONS_FILE)) {
      throw new Error(`Investigations file not found: ${INVESTIGATIONS_FILE}\n   Run: npx tsx scripts/download-nhtsa-data.ts`)
    }
    
    console.log('   ✅ Complaints file found')
    console.log('   ✅ Investigations file found')
    
    // ========================================================================
    // STEP 2: Truncate staging tables
    // ========================================================================
    console.log('\n🗑️  STEP 2: Clearing staging tables...\n')
    
    await execSQL(
      'TRUNCATE staging_nhtsa_complaints, staging_nhtsa_investigations',
      'Truncating staging tables'
    )
    
    // ========================================================================
    // STEP 3: COPY complaints to staging
    // ========================================================================
    console.log('\n📥 STEP 3: Loading complaints (bulk import)...\n')
    
    const complaintsRows = await copyData(
      COMPLAINTS_FILE,
      'staging_nhtsa_complaints',
      'Importing complaints to staging'
    )
    
    // ========================================================================
    // STEP 4: COPY investigations to staging
    // ========================================================================
    console.log('\n📥 STEP 4: Loading investigations (bulk import)...\n')
    
    const investigationsRows = await copyData(
      INVESTIGATIONS_FILE,
      'staging_nhtsa_investigations',
      'Importing investigations to staging'
    )
    
    // ========================================================================
    // STEP 5: Transform complaints (staging → production)
    // ========================================================================
    console.log('\n🔄 STEP 5: Transforming complaints data...\n')
    
    const complaintsResult = await execSQL(
      'SELECT * FROM transform_nhtsa_complaints()',
      'Validating and inserting complaints'
    )
    
    // ========================================================================
    // STEP 6: Transform investigations (staging → production)
    // ========================================================================
    console.log('\n🔄 STEP 6: Transforming investigations data...\n')
    
    const investigationsResult = await execSQL(
      'SELECT * FROM transform_nhtsa_investigations()',
      'Validating and inserting investigations'
    )
    
    // ========================================================================
    // STEP 7: Refresh materialized views
    // ========================================================================
    console.log('\n📊 STEP 7: Building rollup views...\n')
    
    await execSQL(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_complaints_rollup',
      'Refreshing complaints rollup'
    )
    
    await execSQL(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_component_rollup',
      'Refreshing component rollup'
    )
    
    await execSQL(
      'REFRESH MATERIALIZED VIEW CONCURRENTLY nhtsa_safety_rankings',
      'Refreshing safety rankings'
    )
    
    // ========================================================================
    // STEP 8: VACUUM ANALYZE
    // ========================================================================
    console.log('\n🧹 STEP 8: Optimizing database...\n')
    
    await execSQL(
      'VACUUM ANALYZE nhtsa_complaints',
      'Optimizing complaints table'
    )
    
    await execSQL(
      'VACUUM ANALYZE nhtsa_investigations',
      'Optimizing investigations table'
    )
    
    // ========================================================================
    // STEP 9: Get final stats
    // ========================================================================
    console.log('\n📈 STEP 9: Gathering statistics...\n')
    
    const stats = await execSQL(
      `SELECT 
        (SELECT COUNT(*) FROM nhtsa_complaints) as complaints,
        (SELECT COUNT(*) FROM nhtsa_investigations) as investigations,
        (SELECT COUNT(*) FROM nhtsa_complaints_rollup) as vehicles_with_complaints,
        (SELECT AVG(safety_score)::INT FROM nhtsa_complaints_rollup) as avg_safety_score`,
      'Collecting final statistics'
    )
    
    // ========================================================================
    // COMPLETE!
    // ========================================================================
    const overallElapsed = Date.now() - overallStart
    const minutes = Math.floor(overallElapsed / 60000)
    const seconds = ((overallElapsed % 60000) / 1000).toFixed(0)
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ LOAD COMPLETE!')
    console.log('='.repeat(80))
    console.log(`\n⏱️  Total time: ${minutes}m ${seconds}s`)
    console.log('\n📊 Summary:')
    console.log(`   • Complaints loaded: ${complaintsRows}`)
    console.log(`   • Investigations loaded: ${investigationsRows}`)
    console.log(`   • Rollup views: 3 materialized views refreshed`)
    console.log(`   • Database: Optimized with VACUUM ANALYZE`)
    console.log('\n💡 Next steps:')
    console.log('   1. Test queries: npm run db query "SELECT * FROM nhtsa_complaints_rollup LIMIT 5"')
    console.log('   2. Check safety scores: npm run db query "SELECT year, make, model, safety_score FROM nhtsa_complaints_rollup ORDER BY safety_score DESC LIMIT 10"')
    console.log('   3. Integrate with vehicle-safety.ts')
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ LOAD FAILED')
    console.error('='.repeat(80))
    console.error(`\nError: ${error.message}`)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Check DATABASE_URL is set in .env.local')
    console.error('   2. Ensure data files exist in data/nhtsa/')
    console.error('   3. Verify database migrations are applied')
    console.error('   4. Check psql is installed and accessible')
    console.error('\n')
    process.exit(1)
  }
}

// Run the load
loadNHTSAData()
