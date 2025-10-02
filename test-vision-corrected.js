// Test vision endpoint with corrected data formats
async function testVisionWithCorrectFormat() {
  console.log('🔍 Testing vision endpoint with corrected format...')
  
  try {
    // Use FormData for file upload (more realistic)
    const formData = new FormData()
    
    // Create a simple test image blob
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(testImageBase64, 'base64')
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    
    formData.append('image', blob, 'test.png')
    formData.append('vehicle_id', 'dfa33260-a922-45d9-a649-3050377a7a62')
    formData.append('intent', 'service')
    
    console.log('📤 Sending POST with FormData...')
    const response = await fetch('http://localhost:3005/api/vision/process', {
      method: 'POST',
      body: formData
    })
    
    const responseText = await response.text()
    console.log(`📊 Response: ${response.status}`)
    
    if (response.ok) {
      console.log('✅ Vision endpoint working with FormData!')
      console.log('📋 Response preview:', responseText.substring(0, 200) + '...')
    } else {
      console.log('❌ Vision FormData failed:', responseText.substring(0, 200) + '...')
      
      // Try with JSON and base64 image
      console.log('\n🔄 Trying JSON with base64 image...')
      const jsonResponse = await fetch('http://localhost:3005/api/vision/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: `data:image/png;base64,${testImageBase64}`,
          vehicle_id: 'dfa33260-a922-45d9-a649-3050377a7a62',
          intent: 'service'
        })
      })
      
      const jsonText = await jsonResponse.text()
      console.log(`📊 JSON Response: ${jsonResponse.status}`)
      console.log('📋 JSON Response:', jsonText.substring(0, 200) + '...')
    }
    
  } catch (error) {
    console.log('❌ Vision test failed:', error.message)
  }
}

async function testVehicleWithCorrectVIN() {
  console.log('\n🚗 Testing vehicle creation with proper VIN...')
  
  try {
    const newVehicle = {
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      vin: '1HGBH41JXMN109187', // Proper 17-character VIN
      display_name: 'Test Toyota Camry'
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
      console.log('📋 Created vehicle:', data.vehicle?.display_name || 'Unknown')
      return data.vehicle?.id
    } else {
      console.log('❌ Vehicle creation failed:')
      console.log(responseText.substring(0, 300) + '...')
    }
    
  } catch (error) {
    console.log('❌ Vehicle creation test failed:', error.message)
  }
  
  return null
}

async function runCorrectedTests() {
  console.log('🧪 CORRECTED ENDPOINT TESTING')
  console.log('=' .repeat(50))
  
  await testVisionWithCorrectFormat()
  const vehicleId = await testVehicleWithCorrectVIN()
  
  console.log('\n📊 CORRECTED TEST SUMMARY:')
  console.log('=' .repeat(50))
  
  if (vehicleId) {
    console.log('✅ Vehicle management functional')
    console.log('📋 Ready to test document → vehicle association')
  } else {
    console.log('❌ Vehicle management needs more investigation')
  }
}

runCorrectedTests()
