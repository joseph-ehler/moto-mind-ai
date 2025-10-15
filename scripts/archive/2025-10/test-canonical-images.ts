#!/usr/bin/env npx tsx

/**
 * Test Canonical Vehicle Images System
 * 
 * This script tests the complete canonical image generation pipeline.
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testCanonicalImages() {
  console.log('🧪 Testing canonical vehicle image generation...')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'
  
  // Test 1: Get existing image (should return 202 - not cached)
  console.log('\n1️⃣ Testing image retrieval (Honda Civic)...')
  
  try {
    const getResponse = await fetch(`${baseUrl}/api/canonical-image?year=2020&make=honda&model=civic&bodyStyle=sedan&angle=front_3q`)
    const getData = await getResponse.json()
    
    console.log(`   Status: ${getResponse.status}`)
    console.log(`   Response:`, JSON.stringify(getData, null, 2))
    
  } catch (error) {
    console.error('❌ Get test failed:', error)
  }
  
  // Test 2: Generate new image (synchronous)
  console.log('\n2️⃣ Testing image generation (Toyota Camry)...')
  
  try {
    const generatePayload = {
      specs: {
        year: 2022,
        make: 'Toyota',
        model: 'Camry',
        bodyStyle: 'sedan',
        color: 'Pearl White'
      },
      angles: ['front_3q'],
      async: false // Synchronous for testing
    }
    
    console.log('   Sending generation request...')
    console.log('   ⚠️  This will use OpenAI API and may take 10-30 seconds')
    
    const generateResponse = await fetch(`${baseUrl}/api/canonical-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(generatePayload)
    })
    
    const generateData = await generateResponse.json()
    
    console.log(`   Status: ${generateResponse.status}`)
    console.log(`   Response:`, JSON.stringify(generateData, null, 2))
    
    if (generateData.success && generateData.images?.length > 0) {
      console.log('\n🎉 Success! Generated image URL:')
      console.log(`   ${generateData.images[0].url}`)
      console.log('\n📍 You can view this image in:')
      console.log('   1. Your browser at the URL above')
      console.log('   2. Supabase Storage dashboard')
      console.log('   3. The vehicle onboarding flow')
    }
    
  } catch (error) {
    console.error('❌ Generation test failed:', error)
  }
  
  // Test 3: Test async generation
  console.log('\n3️⃣ Testing async image generation (Ford F-150)...')
  
  try {
    const asyncPayload = {
      specs: {
        year: 2019,
        make: 'Ford',
        model: 'F-150',
        bodyStyle: 'truck',
        color: 'Oxford White'
      },
      angles: ['front_3q'],
      async: true // Async for queue testing
    }
    
    const asyncResponse = await fetch(`${baseUrl}/api/canonical-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(asyncPayload)
    })
    
    const asyncData = await asyncResponse.json()
    
    console.log(`   Status: ${asyncResponse.status}`)
    console.log(`   Response:`, JSON.stringify(asyncData, null, 2))
    
  } catch (error) {
    console.error('❌ Async test failed:', error)
  }
  
  console.log('\n✅ Testing complete!')
  console.log('\n📋 Next steps:')
  console.log('   1. Start the dev server: npm run dev')
  console.log('   2. Navigate to: http://localhost:3005/onboard-vehicle')
  console.log('   3. Scan a VIN to see canonical images in action')
  console.log('   4. Check Supabase Storage for generated images')
}

// Run the test
testCanonicalImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
