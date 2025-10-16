// Test vision endpoint with actual POST request and image data
const fs = require('fs')
const path = require('path')

async function testVisionEndpoint() {
  console.log('🔍 Testing vision endpoint with POST request...')
  
  try {
    // Create a simple test image data (base64 encoded 1x1 pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    const requestBody = {
      image: `data:image/png;base64,${testImageBase64}`,
      vehicle_id: 'dfa33260-a922-45d9-a649-3050377a7a62', // Use the actual vehicle ID from our test
      intent: 'service'
    }
    
    console.log('📤 Sending POST request to /api/vision/process...')
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:3005/api/vision/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    console.log(`📊 Response: ${response.status} (${responseTime}ms)`)
    
    const responseText = await response.text()
    
    if (response.ok) {
      console.log('✅ Vision endpoint working!')
      
      try {
        const data = JSON.parse(responseText)
        console.log('📋 Response structure:')
        console.log(`  - Keys: ${Object.keys(data).join(', ')}`)
        
        if (data.confidence !== undefined) {
          console.log(`  - Confidence: ${data.confidence}%`)
        }
        if (data.document_type) {
          console.log(`  - Document type: ${data.document_type}`)
        }
        if (data.extracted_data) {
          console.log(`  - Extracted data keys: ${Object.keys(data.extracted_data).join(', ')}`)
        }
      } catch (parseError) {
        console.log('⚠️ Response not JSON, raw response:')
        console.log(responseText.substring(0, 200) + '...')
      }
    } else {
      console.log('❌ Vision endpoint failed:')
      console.log(responseText.substring(0, 300) + '...')
      
      // Check if it's a method not allowed error
      if (response.status === 405) {
        console.log('\n🔍 Testing if endpoint accepts GET requests...')
        const getResponse = await fetch('http://localhost:3005/api/vision/process')
        console.log(`GET response: ${getResponse.status}`)
      }
    }
    
    return {
      working: response.ok,
      status: response.status,
      responseTime,
      hasImageProcessing: response.ok
    }
    
  } catch (error) {
    console.log('❌ Vision endpoint test failed:', error.message)
    return {
      working: false,
      status: 0,
      responseTime: 0,
      hasImageProcessing: false,
      error: error.message
    }
  }
}

async function testVehicleCreation() {
  console.log('\n🚗 Testing vehicle creation endpoint...')
  
  try {
    const newVehicle = {
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      vin: 'TEST123456789VIN',
      display_name: 'Test Vehicle',
      garage_id: '550e8400-e29b-41d4-a716-446655440001' // Use mock garage ID
    }
    
    const response = await fetch('http://localhost:3005/api/vehicles/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newVehicle)
    })
    
    const responseText = await response.text()
    console.log(`📊 Vehicle creation: ${response.status}`)
    
    if (response.ok) {
      console.log('✅ Vehicle creation working!')
      const data = JSON.parse(responseText)
      if (data.vehicle && data.vehicle.id) {
        console.log(`  - Created vehicle ID: ${data.vehicle.id}`)
        return data.vehicle.id
      }
    } else {
      console.log('❌ Vehicle creation failed:')
      console.log(responseText.substring(0, 200) + '...')
    }
    
    return null
  } catch (error) {
    console.log('❌ Vehicle creation test failed:', error.message)
    return null
  }
}

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE ENDPOINT TESTING')
  console.log('=' .repeat(50))
  
  // Test vision processing
  const visionResult = await testVisionEndpoint()
  
  // Test vehicle creation
  const newVehicleId = await testVehicleCreation()
  
  console.log('\n📊 COMPREHENSIVE TEST RESULTS:')
  console.log('=' .repeat(50))
  
  console.log(`Vision Processing: ${visionResult.working ? '✅' : '❌'} (${visionResult.responseTime}ms)`)
  console.log(`Vehicle Creation: ${newVehicleId ? '✅' : '❌'}`)
  
  if (visionResult.working && newVehicleId) {
    console.log('\n🎉 Core workflows functional!')
    console.log('✅ Document processing capability confirmed')
    console.log('✅ Vehicle management capability confirmed')
    console.log('\n📋 Ready for end-to-end integration testing')
  } else if (visionResult.working || newVehicleId) {
    console.log('\n⚠️ Partial functionality confirmed')
    console.log('📋 Some core capabilities working, others need fixes')
  } else {
    console.log('\n❌ Core workflows not functional')
    console.log('📋 Significant issues remain in primary capabilities')
  }
}

runComprehensiveTest()
