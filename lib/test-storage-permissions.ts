/**
 * Storage Bucket Permissions Test
 * 
 * Tests that vehicle-events bucket has correct permissions for:
 * - Upload
 * - Read (get public URL)
 * - Delete
 * 
 * Run this AFTER running the storage bucket migration
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Test storage bucket permissions
 */
export async function testStoragePermissions() {
  console.log('🧪 Testing Storage Bucket Permissions...\n')
  
  const testResults: Array<{ test: string; passed: boolean; error?: string }> = []
  
  // Test file details
  const testPath = `vehicles/test-vehicle/events/test-event/test_compressed_${Date.now()}.txt`
  const testContent = new Blob(['Test file content'], { type: 'text/plain' })
  
  // ============================================================================
  // TEST 1: UPLOAD
  // ============================================================================
  console.log('📤 Test 1: Upload file...')
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vehicle-events')
      .upload(testPath, testContent)
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message)
      testResults.push({ 
        test: 'Upload', 
        passed: false, 
        error: uploadError.message 
      })
      return testResults // Can't continue without successful upload
    }
    
    console.log('✅ Upload succeeded')
    console.log('   Path:', uploadData.path)
    testResults.push({ test: 'Upload', passed: true })
  } catch (error: any) {
    console.error('❌ Upload exception:', error.message)
    testResults.push({ 
      test: 'Upload', 
      passed: false, 
      error: error.message 
    })
    return testResults
  }
  
  // ============================================================================
  // TEST 2: GET PUBLIC URL
  // ============================================================================
  console.log('\n📖 Test 2: Get public URL...')
  try {
    const { data: urlData } = supabase.storage
      .from('vehicle-events')
      .getPublicUrl(testPath)
    
    if (!urlData.publicUrl) {
      console.error('❌ Failed to get public URL')
      testResults.push({ 
        test: 'Get Public URL', 
        passed: false, 
        error: 'No public URL returned' 
      })
    } else {
      console.log('✅ Public URL retrieved')
      console.log('   URL:', urlData.publicUrl)
      testResults.push({ test: 'Get Public URL', passed: true })
    }
  } catch (error: any) {
    console.error('❌ Get URL exception:', error.message)
    testResults.push({ 
      test: 'Get Public URL', 
      passed: false, 
      error: error.message 
    })
  }
  
  // ============================================================================
  // TEST 3: LIST FILES
  // ============================================================================
  console.log('\n📋 Test 3: List files...')
  try {
    const { data: listData, error: listError } = await supabase.storage
      .from('vehicle-events')
      .list('vehicles/test-vehicle/events/test-event')
    
    if (listError) {
      console.error('❌ List failed:', listError.message)
      testResults.push({ 
        test: 'List Files', 
        passed: false, 
        error: listError.message 
      })
    } else {
      console.log('✅ List succeeded')
      console.log(`   Found ${listData.length} file(s)`)
      testResults.push({ test: 'List Files', passed: true })
    }
  } catch (error: any) {
    console.error('❌ List exception:', error.message)
    testResults.push({ 
      test: 'List Files', 
      passed: false, 
      error: error.message 
    })
  }
  
  // ============================================================================
  // TEST 4: DELETE
  // ============================================================================
  console.log('\n🗑️  Test 4: Delete file...')
  try {
    const { error: deleteError } = await supabase.storage
      .from('vehicle-events')
      .remove([testPath])
    
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError.message)
      testResults.push({ 
        test: 'Delete', 
        passed: false, 
        error: deleteError.message 
      })
    } else {
      console.log('✅ Delete succeeded')
      testResults.push({ test: 'Delete', passed: true })
    }
  } catch (error: any) {
    console.error('❌ Delete exception:', error.message)
    testResults.push({ 
      test: 'Delete', 
      passed: false, 
      error: error.message 
    })
  }
  
  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(50))
  console.log('TEST SUMMARY')
  console.log('='.repeat(50))
  
  const passedCount = testResults.filter(r => r.passed).length
  const failedCount = testResults.filter(r => !r.passed).length
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌'
    const errorMsg = result.error ? ` (${result.error})` : ''
    console.log(`${status} ${result.test}${errorMsg}`)
  })
  
  console.log('='.repeat(50))
  console.log(`Total: ${testResults.length} tests`)
  console.log(`Passed: ${passedCount}`)
  console.log(`Failed: ${failedCount}`)
  console.log('='.repeat(50))
  
  if (failedCount === 0) {
    console.log('\n🎉 All tests passed! Storage bucket is configured correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check bucket policies and permissions.')
    console.log('\nTo fix, run: supabase/migrations/20250113_verify_storage_bucket.sql')
  }
  
  return testResults
}

// Run if called directly
if (require.main === module) {
  testStoragePermissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
