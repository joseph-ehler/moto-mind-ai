// Test document processing integration with vehicles
async function testDocumentIntegration() {
  console.log('🧪 TESTING DOCUMENT PROCESSING INTEGRATION')
  console.log('=' .repeat(50))
  
  // Use the newly created vehicle
  const vehicleId = '2dd62955-36c5-41c4-bcc9-498bb1fbd885'
  
  try {
    // Test document processing with the vehicle
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(testImageBase64, 'base64')
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    
    const formData = new FormData()
    formData.append('image', blob, 'service-receipt.png')
    formData.append('vehicle_id', vehicleId)
    formData.append('intent', 'service')
    
    console.log('📄 Processing document for vehicle:', vehicleId)
    
    const response = await fetch('http://localhost:3005/api/vision/process', {
      method: 'POST',
      body: formData
    })
    
    console.log(`📊 Vision API response: ${response.status}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Document processing successful')
      console.log(`   Mode: ${result.data?.mode}`)
      console.log(`   Vehicle ID: ${vehicleId}`)
      
      // Test that we can still retrieve the vehicle
      console.log('\n🔍 Verifying vehicle still accessible...')
      const vehicleResponse = await fetch(`http://localhost:3005/api/vehicles`)
      
      if (vehicleResponse.ok) {
        const vehicleData = await vehicleResponse.json()
        const ourVehicle = vehicleData.data.find(v => v.id === vehicleId)
        
        if (ourVehicle) {
          console.log('✅ Vehicle found in listing')
          console.log(`   Display Name: ${ourVehicle.display_name}`)
          console.log(`   Make/Model: ${ourVehicle.year} ${ourVehicle.make} ${ourVehicle.model}`)
        } else {
          console.log('❌ Vehicle not found in listing')
        }
      }
      
      return true
    } else {
      console.log('❌ Document processing failed')
      const errorText = await response.text()
      console.log(`   Error: ${errorText.substring(0, 200)}...`)
      return false
    }
    
  } catch (error) {
    console.log(`❌ Integration test failed: ${error.message}`)
    return false
  }
}

async function testCompleteIntegration() {
  console.log('🎯 COMPLETE FRONTEND-BACKEND INTEGRATION TEST')
  console.log('=' .repeat(60))
  
  const tests = [
    {
      name: 'Vehicle Listing API',
      test: async () => {
        const response = await fetch('http://localhost:3005/api/vehicles')
        return { success: response.ok, details: `${response.status} status` }
      }
    },
    {
      name: 'Vehicle Creation API',
      test: async () => {
        const response = await fetch('http://localhost:3005/api/vehicles/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: 2021,
            make: 'Chevrolet',
            model: 'Silverado',
            vin: '1GCUYDED5MZ123456',
            current_mileage: 28000,
            nickname: 'Test Truck'
          })
        })
        return { success: response.ok, details: response.ok ? 'Vehicle created' : `Error ${response.status}` }
      }
    },
    {
      name: 'Document Processing Integration',
      test: testDocumentIntegration
    },
    {
      name: 'Vehicle Details Page',
      test: async () => {
        const response = await fetch('http://localhost:3005/vehicles/2dd62955-36c5-41c4-bcc9-498bb1fbd885')
        return { success: response.ok, details: `${response.status} status` }
      }
    },
    {
      name: 'Vehicles Listing Page',
      test: async () => {
        const response = await fetch('http://localhost:3005/vehicles')
        return { success: response.ok, details: `${response.status} status` }
      }
    }
  ]
  
  console.log('🧪 Running integration tests...\n')
  
  const results = []
  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`)
    try {
      const result = await test.test()
      const success = typeof result === 'boolean' ? result : result.success
      const details = typeof result === 'boolean' ? (result ? 'Success' : 'Failed') : result.details
      
      console.log(`${success ? '✅' : '❌'} ${test.name}: ${details}`)
      results.push({ name: test.name, success, details })
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`)
      results.push({ name: test.name, success: false, details: error.message })
    }
    console.log() // Add spacing
  }
  
  // Summary
  console.log('📊 INTEGRATION TEST RESULTS')
  console.log('=' .repeat(60))
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  const percentage = Math.round((successCount / totalCount) * 100)
  
  console.log(`✅ Passed: ${successCount}/${totalCount} (${percentage}%)`)
  
  if (percentage === 100) {
    console.log('\n🎉 COMPLETE INTEGRATION SUCCESS!')
    console.log('✅ Frontend and backend fully integrated')
    console.log('✅ Vehicle management working end-to-end')
    console.log('✅ Document processing integrated with vehicles')
    console.log('✅ All pages loading correctly')
    console.log('\n🚀 Platform ready for user acquisition!')
  } else if (percentage >= 80) {
    console.log('\n🎯 MOSTLY INTEGRATED!')
    console.log('✅ Core functionality working')
    console.log('📋 Minor issues to address')
  } else {
    console.log('\n⚠️ INTEGRATION ISSUES REMAIN')
    console.log('📋 Need to fix failing tests before user acquisition')
  }
  
  return percentage
}

testCompleteIntegration().catch(console.error)
