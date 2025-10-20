/**
 * NHTSA Data Refresh Script
 * 
 * Incrementally updates NHTSA data:
 * 1. Smart download (only if files changed)
 * 2. Incremental parse (skip existing records)
 * 3. Track provenance (audit trail)
 * 4. Refresh materialized views
 * 
 * Can run daily via GitHub Actions with zero maintenance
 */

import 'dotenv/config'
import { getSmartDownloader } from '../lib/nhtsa/smart-downloader'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as readline from 'readline'
import * as path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RefreshStats {
  sourceType: string
  downloaded: boolean
  recordsProcessed: number
  recordsInserted: number
  recordsSkipped: number
  recordsFailed: number
  duration: number
}

/**
 * Create provenance record for this import
 */
async function startImportTracking(
  sourceType: string,
  fileName: string,
  fileUrl: string,
  fileSize: number,
  fileHash: string
): Promise<string> {
  const { data, error } = await supabase
    .from('nhtsa_data_provenance')
    .insert({
      source_type: sourceType,
      file_name: fileName,
      file_url: fileUrl,
      file_size_bytes: fileSize,
      file_hash_sha256: fileHash,
      status: 'started',
      import_method: process.env.GITHUB_ACTIONS ? 'github_action' : 'cli',
      import_version: '1.0.0'
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

/**
 * Update provenance record on completion
 */
async function completeImportTracking(
  importId: string,
  stats: {
    recordsProcessed: number
    recordsInserted: number
    recordsSkipped: number
    recordsFailed: number
    maxOdiNumber?: string
    status: 'completed' | 'failed'
    errorMessage?: string
  }
) {
  await supabase
    .from('nhtsa_data_provenance')
    .update({
      import_completed_at: new Date().toISOString(),
      records_processed: stats.recordsProcessed,
      records_inserted: stats.recordsInserted,
      records_skipped: stats.recordsSkipped,
      records_failed: stats.recordsFailed,
      max_odi_number: stats.maxOdiNumber,
      status: stats.status,
      error_message: stats.errorMessage
    })
    .eq('id', importId)
}

/**
 * Get high-water mark (last ODI number processed)
 */
async function getHighWaterMark(): Promise<string | null> {
  const { data } = await supabase
    .from('nhtsa_data_provenance')
    .select('max_odi_number')
    .eq('source_type', 'complaints')
    .eq('status', 'completed')
    .order('import_completed_at', { ascending: false })
    .limit(1)
    .single()

  return data?.max_odi_number || null
}

/**
 * Check if ODI number already exists
 */
async function odiExists(odiNumber: string): Promise<boolean> {
  const { data } = await supabase
    .from('nhtsa_complaints')
    .select('odi_number')
    .eq('odi_number', odiNumber)
    .limit(1)
    .maybeSingle()

  return data !== null
}

/**
 * Parse and import complaints incrementally
 */
async function importComplaintsIncremental(filePath: string, importId: string): Promise<RefreshStats> {
  console.log(`\n📊 Starting incremental import...`)
  
  const stats = {
    sourceType: 'complaints',
    downloaded: true,
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    duration: 0
  }

  const startTime = Date.now()
  const highWaterMark = await getHighWaterMark()
  
  if (highWaterMark) {
    console.log(`   High-water mark: ${highWaterMark}`)
    console.log(`   Will skip records ≤ ${highWaterMark}`)
  } else {
    console.log(`   No high-water mark (first import)`)
  }

  // Create read stream
  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let isFirstLine = true
  let batch: any[] = []
  const BATCH_SIZE = 500
  let maxOdiNumber = highWaterMark || ''

  for await (const line of rl) {
    // Skip header
    if (isFirstLine) {
      isFirstLine = false
      continue
    }

    stats.recordsProcessed++

    const cols = line.split('\t')
    const odiNumber = cols[1]?.trim()

    if (!odiNumber) {
      stats.recordsFailed++
      continue
    }

    // Skip if we've already processed this ODI
    if (highWaterMark && odiNumber <= highWaterMark) {
      stats.recordsSkipped++
      continue
    }

    // Track max ODI number
    if (odiNumber > maxOdiNumber) {
      maxOdiNumber = odiNumber
    }

    // Quick check if exists (for safety)
    if (await odiExists(odiNumber)) {
      stats.recordsSkipped++
      continue
    }

    // Transform record
    const record = {
      odi_number: odiNumber,
      nhtsa_id: cols[0] || null,
      make: cols[3]?.toUpperCase().trim() || '',
      model: cols[4]?.toUpperCase().trim() || '',
      year: cols[5] || '',
      vin: cols[14] || null,
      complaint_date: parseDate(cols[15]) || new Date(),
      component: cols[11] || 'Unknown',
      summary: cols[19] || '',
      description: cols[19] || '',
      crash: cols[6] === 'Y',
      fire: cols[8] === 'Y',
      injured: parseInt(cols[9]) || 0,
      deaths: parseInt(cols[10]) || 0,
      mileage: isNumeric(cols[17]) ? parseInt(cols[17]) : null,
      fail_date: parseDate(cols[7]) || null,
      speed: isNumeric(cols[31]) ? parseInt(cols[31]) : null,
      city: cols[12] || null,
      state: cols[13] || null
    }

    batch.push(record)

    // Insert batch
    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('nhtsa_complaints')
        .upsert(batch, { onConflict: 'odi_number', ignoreDuplicates: true })

      if (error) {
        console.error(`   ⚠️  Batch error: ${error.message}`)
        stats.recordsFailed += batch.length
      } else {
        stats.recordsInserted += batch.length
      }

      batch = []

      // Progress update
      if (stats.recordsProcessed % 10000 === 0) {
        console.log(`   📦 Processed ${stats.recordsProcessed.toLocaleString()} | Inserted: ${stats.recordsInserted.toLocaleString()} | Skipped: ${stats.recordsSkipped.toLocaleString()}`)
      }
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    const { error } = await supabase
      .from('nhtsa_complaints')
      .upsert(batch, { onConflict: 'odi_number', ignoreDuplicates: true })

    if (!error) {
      stats.recordsInserted += batch.length
    }
  }

  stats.duration = Date.now() - startTime

  // Update provenance
  await completeImportTracking(importId, {
    recordsProcessed: stats.recordsProcessed,
    recordsInserted: stats.recordsInserted,
    recordsSkipped: stats.recordsSkipped,
    recordsFailed: stats.recordsFailed,
    maxOdiNumber: maxOdiNumber,
    status: 'completed'
  })

  return stats
}

/**
 * Main refresh function
 */
async function refreshNHTSAData() {
  console.log('\n🔄 NHTSA DATA REFRESH\n')
  console.log('='.repeat(80))

  try {
    // Step 1: Smart download
    console.log('\n📥 STEP 1: Checking for file updates...\n')
    const downloader = getSmartDownloader()
    const downloadResults = await downloader.downloadAll()

    const complaintsResult = downloadResults.get('complaints')
    
    if (!complaintsResult) {
      throw new Error('Failed to download complaints file')
    }

    if (!complaintsResult.downloaded) {
      console.log(`\n✅ Data is up to date (${complaintsResult.reason})`)
      console.log(`   No refresh needed\n`)
      return
    }

    console.log(`\n✅ New data available (${complaintsResult.reason})`)

    // Step 2: Start import tracking
    console.log('\n📊 STEP 2: Starting import tracking...\n')
    const importId = await startImportTracking(
      'complaints',
      complaintsResult.metadata!.fileName,
      complaintsResult.metadata!.url,
      complaintsResult.metadata!.size,
      complaintsResult.metadata!.hash!
    )
    console.log(`   Import ID: ${importId}`)

    // Step 3: Incremental import
    console.log('\n📦 STEP 3: Importing new records...\n')
    const stats = await importComplaintsIncremental(complaintsResult.filePath!, importId)

    // Step 4: Refresh materialized views
    console.log('\n🔄 STEP 4: Refreshing materialized views...\n')
    const viewRefreshStart = Date.now()
    
    await supabase.rpc('refresh_nhtsa_rollups')
    
    const viewRefreshTime = Date.now() - viewRefreshStart
    console.log(`   ✅ Views refreshed in ${(viewRefreshTime / 1000).toFixed(1)}s`)

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('✅ REFRESH COMPLETE!')
    console.log('='.repeat(80))
    console.log(`\n📊 Statistics:`)
    console.log(`   Records processed: ${stats.recordsProcessed.toLocaleString()}`)
    console.log(`   Records inserted:  ${stats.recordsInserted.toLocaleString()}`)
    console.log(`   Records skipped:   ${stats.recordsSkipped.toLocaleString()}`)
    console.log(`   Records failed:    ${stats.recordsFailed.toLocaleString()}`)
    console.log(`   Duration:          ${(stats.duration / 1000).toFixed(1)}s`)
    console.log(`\n💾 Total in database:`)
    
    const { count } = await supabase
      .from('nhtsa_complaints')
      .select('*', { count: 'exact', head: true })
    
    console.log(`   ${count?.toLocaleString()} complaints`)
    console.log(`\n`)

  } catch (error: any) {
    console.error('\n❌ Refresh failed:', error.message)
    process.exit(1)
  }
}

// Helper functions
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  if (!/^\d{8}$/.test(dateStr)) return null
  
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  
  return new Date(`${year}-${month}-${day}`)
}

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value?.trim())
}

// Run
refreshNHTSAData()
