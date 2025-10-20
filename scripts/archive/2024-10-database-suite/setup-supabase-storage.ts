#!/usr/bin/env npx tsx

/**
 * Supabase Storage Setup Script
 * 
 * This script creates the vehicle-images storage bucket and sets up proper policies.
 * Run with: npx tsx scripts/setup-supabase-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create service role client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for canonical vehicle images...')
  console.log(`📍 Project: ${supabaseUrl}`)
  
  try {
    // Check if bucket already exists
    console.log('\n📋 Checking existing buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message)
      return
    }
    
    const existingBucket = buckets?.find(bucket => bucket.name === 'vehicle-images')
    
    if (existingBucket) {
      console.log('✅ Bucket "vehicle-images" already exists!')
      console.log(`   ID: ${existingBucket.id}`)
      console.log(`   Public: ${existingBucket.public}`)
      console.log(`   Created: ${existingBucket.created_at}`)
    } else {
      // Create the bucket
      console.log('\n🗄️ Creating "vehicle-images" storage bucket...')
      
      const { data: bucket, error: createError } = await supabase.storage.createBucket('vehicle-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message)
        return
      }
      
      console.log('✅ Successfully created "vehicle-images" bucket!')
      console.log(`   ID: ${bucket.name}`)
    }
    
    // Test upload functionality
    console.log('\n🧪 Testing upload functionality...')
    
    // Create a small test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])
    
    const testPath = 'test/setup-test.png'
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(testPath, testImageBuffer, {
        contentType: 'image/png',
        upsert: true
      })
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message)
      return
    }
    
    console.log('✅ Upload test successful!')
    
    // Test public URL generation
    const { data: urlData } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(testPath)
    
    console.log(`📸 Test image URL: ${urlData.publicUrl}`)
    
    // Clean up test file
    await supabase.storage
      .from('vehicle-images')
      .remove([testPath])
    
    console.log('🧹 Cleaned up test file')
    
    // Show example folder structure
    console.log('\n📁 Your images will be organized like this:')
    console.log('   vehicle-images/')
    console.log('   ├── honda/civic/2012-2015/sedan/front_3q_pearl_white.jpg')
    console.log('   ├── ford/f-150/2015-2020/truck/front_3q_oxford_white.jpg')
    console.log('   └── toyota/camry/2018-2024/sedan/side_neutral_silver.jpg')
    
    console.log('\n🎉 Supabase Storage setup complete!')
    console.log('\n📋 Next steps:')
    console.log('   1. Test canonical image generation: npm run dev')
    console.log('   2. Navigate to /onboard-vehicle')
    console.log('   3. Scan a VIN to trigger image generation')
    console.log('   4. Check your Supabase Storage dashboard to see the images')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
setupStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
