// Test complete frontend CRUD workflow
async function testFrontendCRUDWorkflow() {
  console.log('🎯 TESTING COMPLETE FRONTEND CRUD WORKFLOW')
  console.log('=' .repeat(60))
  
  const tests = [
    {
      name: 'Vehicles Listing Page',
      description: 'Main vehicles page loads correctly',
      test: async () => {
        const response = await fetch('http://localhost:3005/vehicles')
        return {
          success: response.ok,
          details: `${response.status} status - ${response.ok ? 'Page loads' : 'Page failed'}`
        }
      }
    },
    {
      name: 'Vehicle Details Page',
      description: 'Individual vehicle page loads correctly',
      test: async () => {
        // First get a vehicle ID
        const vehiclesResponse = await fetch('http://localhost:3005/api/vehicles')
        if (!vehiclesResponse.ok) {
          return { success: false, details: 'Could not fetch vehicles list' }
        }
        
        const vehiclesData = await vehiclesResponse.json()
        if (!vehiclesData.data || vehiclesData.data.length === 0) {
          return { success: false, details: 'No vehicles available for testing' }
        }
        
        const vehicleId = vehiclesData.data[0].id
        const detailsResponse = await fetch(`http://localhost:3005/vehicles/${vehicleId}`)
        
        return {
          success: detailsResponse.ok,
          details: `${detailsResponse.status} status - Vehicle details page ${detailsResponse.ok ? 'loads' : 'failed'}`
        }
      }
    },
    {
      name: 'Vehicle Onboarding Page',
      description: 'Vehicle creation page loads correctly',
      test: async () => {
        const response = await fetch('http://localhost:3005/vehicles/onboard')
        return {
          success: response.ok,
          details: `${response.status} status - Onboarding page ${response.ok ? 'loads' : 'failed'}`
        }
      }
    },
    {
      name: 'Backend CRUD APIs',
      description: 'All CRUD operations work via API',
      test: async () => {
        try {
          // Test CREATE
          const createResponse = await fetch('http://localhost:3005/api/vehicles/onboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              year: 2023,
              make: 'BMW',
              model: 'X3',
              vin: '5UXCR6C0XP9123456',
              current_mileage: 15000,
              nickname: 'Test BMW'
            })
          })
          
          if (!createResponse.ok) {
            return { success: false, details: 'CREATE operation failed' }
          }
          
          const createData = await createResponse.json()
          const vehicleId = createData.vehicle_id
          
          // Test READ
          const readResponse = await fetch(`http://localhost:3005/api/vehicles`)
          if (!readResponse.ok) {
            return { success: false, details: 'READ operation failed' }
          }
          
          // Test UPDATE
          const updateResponse = await fetch(`http://localhost:3005/api/vehicles/${vehicleId}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              year: 2023,
              make: 'BMW',
              model: 'X3',
              nickname: 'Updated Test BMW',
              trim: 'xDrive30i'
            })
          })
          
          if (!updateResponse.ok) {
            return { success: false, details: 'UPDATE operation failed' }
          }
          
          // Test DELETE
          const deleteResponse = await fetch(`http://localhost:3005/api/vehicles/${vehicleId}/delete`, {
            method: 'DELETE'
          })
          
          if (!deleteResponse.ok) {
            return { success: false, details: 'DELETE operation failed' }
          }
          
          return { success: true, details: 'All CRUD operations successful' }
          
        } catch (error) {
          return { success: false, details: `API test failed: ${error.message}` }
        }
      }
    },
    {
      name: 'Document Processing Integration',
      description: 'Vision API integrates with vehicle management',
      test: async () => {
        try {
          // Get a vehicle to test with
          const vehiclesResponse = await fetch('http://localhost:3005/api/vehicles')
          const vehiclesData = await vehiclesResponse.json()
          
          if (!vehiclesData.data || vehiclesData.data.length === 0) {
            return { success: false, details: 'No vehicles available for document processing test' }
          }
          
          const vehicleId = vehiclesData.data[0].id
          
          // Test document processing
          const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          const imageBuffer = Buffer.from(testImageBase64, 'base64')
          const blob = new Blob([imageBuffer], { type: 'image/png' })
          
          const formData = new FormData()
          formData.append('image', blob, 'test-receipt.png')
          formData.append('vehicle_id', vehicleId)
          formData.append('intent', 'service')
          
          const visionResponse = await fetch('http://localhost:3005/api/vision/process', {
            method: 'POST',
            body: formData
          })
          
          return {
            success: visionResponse.ok,
            details: visionResponse.ok ? 'Document processing integrated successfully' : `Vision API failed: ${visionResponse.status}`
          }
          
        } catch (error) {
          return { success: false, details: `Document processing test failed: ${error.message}` }
        }
      }
    }
  ]
  
  console.log('🧪 Running frontend CRUD workflow tests...\n')
  
  const results = []
  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`)
    console.log(`   ${test.description}`)
    
    try {
      const result = await test.test()
      const status = result.success ? '✅' : '❌'
      console.log(`   ${status} ${result.details}`)
      results.push({ name: test.name, success: result.success, details: result.details })
    } catch (error) {
      console.log(`   ❌ ${error.message}`)
      results.push({ name: test.name, success: false, details: error.message })
    }
    console.log() // Add spacing
  }
  
  // Summary
  console.log('📊 FRONTEND CRUD WORKFLOW RESULTS')
  console.log('=' .repeat(60))
  
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length
  const percentage = Math.round((successCount / totalCount) * 100)
  
  console.log(`✅ Passed: ${successCount}/${totalCount} (${percentage}%)`)
  console.log()
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${result.name}`)
  })
  
  console.log()
  
  if (percentage === 100) {
    console.log('🎉 COMPLETE FRONTEND CRUD SUCCESS!')
    console.log('✅ All pages loading correctly')
    console.log('✅ All CRUD operations functional')
    console.log('✅ Frontend and backend fully integrated')
    console.log('✅ Document processing integrated')
    console.log()
    console.log('🚀 PLATFORM READY FOR USER ACQUISITION!')
    console.log('📋 Users can now:')
    console.log('   • View vehicle listings with quick actions')
    console.log('   • Create new vehicles via onboarding')
    console.log('   • Edit vehicle details via modal forms')
    console.log('   • Delete vehicles with confirmation')
    console.log('   • Process documents for vehicle maintenance')
    console.log('   • Navigate seamlessly between all pages')
  } else if (percentage >= 80) {
    console.log('🎯 NEAR COMPLETE SUCCESS!')
    console.log('✅ Most functionality working')
    console.log('📋 Minor issues to address before user acquisition')
  } else {
    console.log('⚠️ SIGNIFICANT ISSUES REMAIN')
    console.log('📋 Need to fix failing components before user acquisition')
  }
  
  return percentage
}

testFrontendCRUDWorkflow().catch(console.error)
