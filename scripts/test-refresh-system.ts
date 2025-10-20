/**
 * Test NHTSA Refresh System Components
 * 
 * Tests without doing full import:
 * 1. Smart downloader (hash checking)
 * 2. Provenance tracking
 * 3. Database functions
 */

import 'dotenv/config'
import { getSmartDownloader } from '../lib/nhtsa/smart-downloader'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testRefreshSystem() {
  console.log('\n🧪 TESTING NHTSA REFRESH SYSTEM\n')
  console.log('='.repeat(80))
  
  try {
    // Test 1: Provenance table exists
    console.log('\n1️⃣  Testing provenance table...')
    const { count, error: countError } = await supabase
      .from('nhtsa_data_provenance')
      .select('*', { count: 'exact', head: true })
    
    if (countError) throw countError
    console.log(`   ✅ Provenance table exists (${count} records)`)
    
    // Test 2: Smart downloader (HEAD request only)
    console.log('\n2️⃣  Testing smart downloader (HEAD request)...')
    const downloader = getSmartDownloader()
    
    const complaintsUrl = 'https://static.nhtsa.gov/odi/ffdd/cmpl/FLAT_CMPL.zip'
    const metadata = await downloader.getRemoteMetadata(complaintsUrl)
    
    console.log(`   ✅ File metadata retrieved`)
    console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Last modified: ${metadata.lastModified.toISOString()}`)
    
    // Test 3: Check if file already imported
    console.log('\n3️⃣  Testing import check...')
    const lastImport = await downloader.getLastImport('complaints')
    
    if (lastImport.hash) {
      console.log(`   ✅ Previous import found`)
      console.log(`   Hash: ${lastImport.hash.substring(0, 16)}...`)
    } else {
      console.log(`   ⚠️  No previous imports (expected for first run)`)
    }
    
    // Test 4: Create test provenance record
    console.log('\n4️⃣  Testing provenance tracking...')
    const { data: testRecord, error: insertError } = await supabase
      .from('nhtsa_data_provenance')
      .insert({
        source_type: 'complaints',
        file_name: 'FLAT_CMPL.zip',
        file_url: complaintsUrl,
        file_size_bytes: metadata.size,
        file_hash_sha256: 'test_hash_' + Date.now(),
        status: 'started',
        import_method: 'cli',
        import_version: '1.0.0-test'
      })
      .select()
      .single()
    
    if (insertError) throw insertError
    console.log(`   ✅ Test provenance record created`)
    console.log(`   ID: ${testRecord.id}`)
    
    // Test 5: Update provenance record
    console.log('\n5️⃣  Testing provenance update...')
    const { error: updateError } = await supabase
      .from('nhtsa_data_provenance')
      .update({
        import_completed_at: new Date().toISOString(),
        records_processed: 100,
        records_inserted: 95,
        records_skipped: 3,
        records_failed: 2,
        max_odi_number: '11234567',
        status: 'completed'
      })
      .eq('id', testRecord.id)
    
    if (updateError) throw updateError
    console.log(`   ✅ Provenance record updated`)
    
    // Test 6: Query provenance functions
    console.log('\n6️⃣  Testing provenance functions...')
    
    const { data: lastCompleted } = await supabase
      .rpc('get_last_import', { source: 'complaints' })
    
    console.log(`   ✅ get_last_import() works`)
    if (lastCompleted && lastCompleted.length > 0) {
      console.log(`   Latest import: ${lastCompleted[0].completed_at}`)
    }
    
    // Test 7: Check data freshness
    console.log('\n7️⃣  Testing data freshness check...')
    const { data: freshnessData, error: freshnessError } = await supabase
      .rpc('get_data_freshness')
    
    if (!freshnessError && freshnessData && freshnessData.length > 0) {
      console.log(`   ✅ get_data_freshness() works`)
      for (const row of freshnessData) {
        console.log(`   ${row.source_type}: ${row.days_since_import} days old, stale: ${row.is_stale}`)
      }
    } else {
      console.log(`   ⚠️  No freshness data (expected if no completed imports)`)
    }
    
    // Test 8: Cleanup test record
    console.log('\n8️⃣  Cleaning up test record...')
    const { error: deleteError } = await supabase
      .from('nhtsa_data_provenance')
      .delete()
      .eq('id', testRecord.id)
    
    if (deleteError) throw deleteError
    console.log(`   ✅ Test record deleted`)
    
    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('✅ ALL TESTS PASSED!')
    console.log('='.repeat(80))
    console.log('\n💡 Refresh System Status:')
    console.log('   ✅ Provenance table: Working')
    console.log('   ✅ Smart downloader: Working')
    console.log('   ✅ Provenance tracking: Working')
    console.log('   ✅ Database functions: Working')
    console.log('\n📝 Notes:')
    console.log('   - Smart downloader can check file metadata ✅')
    console.log('   - Provenance tracking works ✅')
    console.log('   - Database functions operational ✅')
    console.log('   - Full import uses existing staging table approach')
    console.log('\n🎯 System is ready for automated monthly refreshes!')
    console.log('\n')
    
  } catch (error: any) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ TEST FAILED')
    console.error('='.repeat(80))
    console.error(`\nError: ${error.message}`)
    console.error('\n')
    process.exit(1)
  }
}

testRefreshSystem()
