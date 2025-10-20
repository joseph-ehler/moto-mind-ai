/**
 * Process Existing Staging Data in Batches
 * 
 * The staging table already has 2.14M rows from COPY.
 * This script transforms them in batches to production.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const BATCH_SIZE = 50000  // Process 50K at a time

interface BatchStats {
  batchNum: number
  processed: number
  inserted: number
  skipped: number
  errors: number
}

async function processBatch(offset: number, limit: number): Promise<BatchStats> {
  // Fetch batch from staging
  const { data: stagingRows, error: fetchError } = await supabase
    .from('staging_nhtsa_complaints')
    .select('*')
    .range(offset, offset + limit - 1)
  
  if (fetchError || !stagingRows) {
    throw new Error(`Failed to fetch staging data: ${fetchError?.message}`)
  }
  
  let inserted = 0
  let errors = 0
  
  // Transform and insert in sub-batches of 500
  const SUB_BATCH = 500
  for (let i = 0; i < stagingRows.length; i += SUB_BATCH) {
    const subBatch = stagingRows.slice(i, i + SUB_BATCH)
    
    // Transform rows
    const transformed = subBatch
      .filter(row => row.col2 && row.col4 && row.col5 && row.col6) // Must have ODI, make, model, year
      .map(row => ({
        odi_number: row.col2,
        nhtsa_id: row.col1 || null,
        make: row.col4?.toUpperCase().trim() || '',
        model: row.col5?.toUpperCase().trim() || '',
        year: row.col6 || '',
        vin: row.col15 || null,
        complaint_date: parseDate(row.col16) || new Date(),
        component: row.col12 || 'Unknown',
        summary: row.col20 || '',
        description: row.col20 || '',
        crash: row.col7 === 'Y',
        fire: row.col9 === 'Y',
        injured: parseInt(row.col10) || 0,
        deaths: parseInt(row.col11) || 0,
        mileage: isNumeric(row.col18) ? parseInt(row.col18) : null,
        fail_date: parseDate(row.col8) || null,
        speed: isNumeric(row.col32) ? parseInt(row.col32) : null,
        city: row.col13 || null,
        state: row.col14 || null,
        manufacturer_campaign: null
      }))
    
    // Upsert to production
    const { error: insertError } = await supabase
      .from('nhtsa_complaints')
      .upsert(transformed, { onConflict: 'odi_number', ignoreDuplicates: true })
    
    if (insertError) {
      console.error(`   ⚠️  Sub-batch error: ${insertError.message}`)
      errors += subBatch.length
    } else {
      inserted += transformed.length
    }
  }
  
  return {
    batchNum: Math.floor(offset / BATCH_SIZE) + 1,
    processed: stagingRows.length,
    inserted,
    skipped: stagingRows.length - inserted,
    errors
  }
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr || !dateStr.match(/^\d{8}$/)) return null
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

function isNumeric(str: string | null): boolean {
  return str !== null && /^\d+$/.test(str)
}

async function main() {
  console.log('\n🚀 PROCESSING STAGING DATA IN BATCHES\n')
  console.log('='.repeat(80))
  
  const start = Date.now()
  
  try {
    // Get total count
    const { count } = await supabase
      .from('staging_nhtsa_complaints')
      .select('*', { count: 'exact', head: true })
    
    const totalRows = count || 0
    console.log(`\n📊 Total staging rows: ${totalRows.toLocaleString()}`)
    console.log(`📦 Batch size: ${BATCH_SIZE.toLocaleString()}`)
    console.log(`🔢 Batches: ${Math.ceil(totalRows / BATCH_SIZE)}\n`)
    
    let totalInserted = 0
    let totalSkipped = 0
    let totalErrors = 0
    
    // Process in batches
    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
      const limit = Math.min(BATCH_SIZE, totalRows - offset)
      
      console.log(`📦 Batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(totalRows / BATCH_SIZE)}: Processing ${limit.toLocaleString()} rows...`)
      
      const stats = await processBatch(offset, limit)
      
      totalInserted += stats.inserted
      totalSkipped += stats.skipped
      totalErrors += stats.errors
      
      const percent = (((offset + limit) / totalRows) * 100).toFixed(1)
      console.log(`   ✅ Inserted: ${stats.inserted.toLocaleString()} | Skipped: ${stats.skipped.toLocaleString()} | Progress: ${percent}%\n`)
    }
    
    const elapsed = Date.now() - start
    const minutes = Math.floor(elapsed / 60000)
    const seconds = ((elapsed % 60000) / 1000).toFixed(0)
    
    console.log('='.repeat(80))
    console.log('✅ PROCESSING COMPLETE!')
    console.log('='.repeat(80))
    console.log(`\n⏱️  Total time: ${minutes}m ${seconds}s`)
    console.log(`\n📊 Summary:`)
    console.log(`   • Total rows: ${totalRows.toLocaleString()}`)
    console.log(`   • Inserted: ${totalInserted.toLocaleString()}`)
    console.log(`   • Skipped: ${totalSkipped.toLocaleString()}`)
    console.log(`   • Errors: ${totalErrors.toLocaleString()}`)
    console.log(`   • Success rate: ${((totalInserted / totalRows) * 100).toFixed(1)}%`)
    console.log('\n💡 Next: npm run safety:refresh (refresh materialized views)')
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n❌ PROCESSING FAILED:', error.message)
    process.exit(1)
  }
}

main()
