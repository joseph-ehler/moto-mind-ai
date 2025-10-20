/**
 * NHTSA Data Import Script
 * 
 * Downloads and imports NHTSA data into the database
 * - Downloads ZIP files from static.nhtsa.gov
 * - Parses TSV files
 * - Imports into PostgreSQL
 * 
 * Usage:
 *   npx tsx scripts/import-nhtsa-data.ts
 *   npx tsx scripts/import-nhtsa-data.ts --skip-download  (use existing files)
 *   npx tsx scripts/import-nhtsa-data.ts --complaints-only
 *   npx tsx scripts/import-nhtsa-data.ts --investigations-only
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { getNHTSADownloader } from '../lib/nhtsa/downloader'
import { getNHTSAParser } from '../lib/nhtsa/parser'
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 500 // Import in batches for better performance

interface ImportStats {
  complaints: {
    downloaded: number
    parsed: number
    imported: number
    skipped: number
    errors: number
  }
  investigations: {
    downloaded: number
    parsed: number
    imported: number
    skipped: number
    errors: number
  }
}

async function importNHTSAData() {
  console.log('🚀 NHTSA DATA IMPORT STARTING\n')
  console.log('='.repeat(80))
  
  // Parse command line arguments
  const args = process.argv.slice(2)
  const skipDownload = args.includes('--skip-download')
  const complaintsOnly = args.includes('--complaints-only')
  const investigationsOnly = args.includes('--investigations-only')
  
  const stats: ImportStats = {
    complaints: { downloaded: 0, parsed: 0, imported: 0, skipped: 0, errors: 0 },
    investigations: { downloaded: 0, parsed: 0, imported: 0, skipped: 0, errors: 0 }
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Step 1: Download files (unless skipped)
    const downloader = getNHTSADownloader()
    
    if (!skipDownload) {
      console.log('\n📥 STEP 1: Downloading NHTSA data files...')
      await downloader.downloadAll()
    } else {
      console.log('\n📥 STEP 1: Skipping download (using existing files)')
    }
    
    // Step 2: Import complaints (unless investigations-only)
    if (!investigationsOnly) {
      console.log('\n📋 STEP 2: Importing complaint data...')
      console.log('='.repeat(80))
      
      const parser = getNHTSAParser()
      const complaintFiles = downloader.getExtractedFiles('complaints')
      
      if (complaintFiles.length === 0) {
        console.warn('⚠️  No complaint files found. Run without --skip-download first.')
      } else {
        for (const file of complaintFiles) {
          console.log(`\nProcessing: ${file}`)
          
          try {
            // Parse file
            const records = await parser.parseComplaints(file)
            stats.complaints.parsed += records.length
            
            // Import in batches
            for (let i = 0; i < records.length; i += BATCH_SIZE) {
              const batch = records.slice(i, i + BATCH_SIZE)
              
              // Map to database schema
              const dbRecords = batch.map(r => ({
                odi_number: r.odiNumber,
                nhtsa_id: r.nhtsaId,
                make: r.make,
                model: r.model,
                year: r.year,
                vin: r.vin,
                complaint_date: r.date,
                component: r.component,
                summary: r.summary,
                description: r.description,
                crash: r.crash,
                fire: r.fire,
                injured: r.injured,
                deaths: r.deaths,
                mileage: r.mileage,
                fail_date: r.failDate,
                speed: r.speed,
                city: r.city,
                state: r.state,
                manufacturer_campaign: r.manufacturerCampaign
              }))
              
              // Upsert (insert or skip if exists)
              const { data, error } = await supabase
                .from('nhtsa_complaints')
                .upsert(dbRecords, { 
                  onConflict: 'odi_number',
                  ignoreDuplicates: true 
                })
              
              if (error) {
                console.error(`   ❌ Batch error:`, error.message)
                stats.complaints.errors += batch.length
              } else {
                const imported = data?.length || batch.length
                stats.complaints.imported += imported
                stats.complaints.skipped += (batch.length - imported)
              }
              
              // Progress
              const processed = Math.min(i + BATCH_SIZE, records.length)
              process.stdout.write(`\r   Progress: ${processed}/${records.length} (${stats.complaints.imported} imported, ${stats.complaints.skipped} skipped)`)
            }
            
            console.log(`\n   ✅ Completed: ${file}`)
            
          } catch (error: any) {
            console.error(`   ❌ File error:`, error.message)
            stats.complaints.errors += 1
          }
        }
      }
    }
    
    // Step 3: Import investigations (unless complaints-only)
    if (!complaintsOnly) {
      console.log('\n\n🔍 STEP 3: Importing investigation data...')
      console.log('='.repeat(80))
      
      const parser = getNHTSAParser()
      const investigationFiles = downloader.getExtractedFiles('investigations')
      
      if (investigationFiles.length === 0) {
        console.warn('⚠️  No investigation files found. Run without --skip-download first.')
      } else {
        for (const file of investigationFiles) {
          console.log(`\nProcessing: ${file}`)
          
          try {
            // Parse file
            const records = await parser.parseInvestigations(file)
            stats.investigations.parsed += records.length
            
            // Import in batches
            for (let i = 0; i < records.length; i += BATCH_SIZE) {
              const batch = records.slice(i, i + BATCH_SIZE)
              
              // Map to database schema
              const dbRecords = batch.map(r => ({
                nhtsa_id: r.nhtsaId,
                make: r.make,
                model: r.model,
                year: r.year,
                component: r.component,
                subject: r.subject,
                summary: r.summary,
                open_date: r.openDate,
                close_date: r.closeDate,
                action: r.action,
                potential_affected: r.potentialAffected
              }))
              
              // Upsert
              const { data, error } = await supabase
                .from('nhtsa_investigations')
                .upsert(dbRecords, { 
                  onConflict: 'nhtsa_id',
                  ignoreDuplicates: true 
                })
              
              if (error) {
                console.error(`   ❌ Batch error:`, error.message)
                stats.investigations.errors += batch.length
              } else {
                const imported = data?.length || batch.length
                stats.investigations.imported += imported
                stats.investigations.skipped += (batch.length - imported)
              }
              
              // Progress
              const processed = Math.min(i + BATCH_SIZE, records.length)
              process.stdout.write(`\r   Progress: ${processed}/${records.length} (${stats.investigations.imported} imported, ${stats.investigations.skipped} skipped)`)
            }
            
            console.log(`\n   ✅ Completed: ${file}`)
            
          } catch (error: any) {
            console.error(`   ❌ File error:`, error.message)
            stats.investigations.errors += 1
          }
        }
      }
    }
    
    // Step 4: Summary
    console.log('\n\n' + '='.repeat(80))
    console.log('✅ IMPORT COMPLETE!\n')
    console.log('📊 Summary:')
    console.log('\nComplaints:')
    console.log(`  Parsed:   ${stats.complaints.parsed.toLocaleString()}`)
    console.log(`  Imported: ${stats.complaints.imported.toLocaleString()}`)
    console.log(`  Skipped:  ${stats.complaints.skipped.toLocaleString()}`)
    console.log(`  Errors:   ${stats.complaints.errors.toLocaleString()}`)
    
    console.log('\nInvestigations:')
    console.log(`  Parsed:   ${stats.investigations.parsed.toLocaleString()}`)
    console.log(`  Imported: ${stats.investigations.imported.toLocaleString()}`)
    console.log(`  Skipped:  ${stats.investigations.skipped.toLocaleString()}`)
    console.log(`  Errors:   ${stats.investigations.errors.toLocaleString()}`)
    
    const totalImported = stats.complaints.imported + stats.investigations.imported
    console.log(`\nTotal Records Imported: ${totalImported.toLocaleString()}`)
    console.log('='.repeat(80))
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  importNHTSAData()
}

export { importNHTSAData }
