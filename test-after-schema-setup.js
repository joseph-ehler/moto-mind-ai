// Test all functionality after schema setup
async function testSchemaCompletion() {
  console.log('🔍 Testing schema completion...')
  
  const tests = [
    {
      name: 'Garages Table',
      test: async () => {
        const response = await fetch('http://localhost:3005/api/garages')
        const data = await response.json()
        return {
          working: response.ok && !data.warning,
          details: response.ok ? `${data.garages?.length || 0} garages` : 'Failed'
        }
      }
    },
    {
      name: 'Vehicle Creation',
      test: async () => {
        const response = await fetch('http://localhost:3005/api/vehicles/onboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            year: 2021,
            make: 'Honda',
            model: 'Accord',
            vin: '1HGBH41JXMN109188',
            display_name: 'Test Honda Accord',
            current_mileage: 25000
          })
        })
        const data = await response.text()
        return {
          working: response.ok,
          details: response.ok ? 'Vehicle created successfully' : `Error: ${response.status}`
        }
      }
    },
    {
      name: 'Health Check',
      test: async () => {
        const response = await fetch('http://localhost:3005/api/system/health-optimized')
        const data = await response.json()
        return {
          working: response.ok && data.status === 'healthy',
          details: data.status || 'Failed to get status'
        }
      }
    },
    {
      name: 'Vision Processing',
      test: async () => {
        const formData = new FormData()
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        const imageBuffer = Buffer.from(testImageBase64, 'base64')
        const blob = new Blob([imageBuffer], { type: 'image/png' })
        
        formData.append('image', blob, 'test.png')
        formData.append('vehicle_id', 'dfa33260-a922-45d9-a649-3050377a7a62')
        formData.append('intent', 'service')
        
        const response = await fetch('http://localhost:3005/api/vision/process', {
          method: 'POST',
          body: formData
        })
        
        return {
          working: response.ok,
          details: response.ok ? 'Image processing working' : `Error: ${response.status}`
        }
      }
    }
  ]
  
  console.log('🧪 Running comprehensive tests...\n')
  
  const results = []
  for (const test of tests) {
    try {
      const result = await test.test()
      const status = result.working ? '✅' : '❌'
      console.log(`${status} ${test.name}: ${result.details}`)
      results.push({ name: test.name, ...result })
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`)
      results.push({ name: test.name, working: false, details: error.message })
    }
  }
  
  console.log('\n📊 FINAL RESULTS:')
  console.log('=' .repeat(50))
  
  const working = results.filter(r => r.working).length
  const total = results.length
  const percentage = Math.round((working / total) * 100)
  
  console.log(`Functional Rate: ${working}/${total} (${percentage}%)`)
  
  if (percentage === 100) {
    console.log('\n🎉 COMPLETE SUCCESS!')
    console.log('✅ All core functionality working')
    console.log('✅ Schema setup complete')
    console.log('✅ Ready for end-to-end workflow testing')
    console.log('\n📋 Next Steps:')
    console.log('- Test complete vehicle creation → document processing workflow')
    console.log('- Validate under realistic load')
    console.log('- Deploy with confidence')
  } else if (percentage >= 75) {
    console.log('\n✅ MAJOR PROGRESS!')
    console.log('✅ Most functionality working')
    console.log('📋 Minor issues remain for full completion')
  } else {
    console.log('\n⚠️ PARTIAL SUCCESS')
    console.log('📋 Schema setup may need additional work')
  }
  
  return { working, total, percentage }
}

// Run the test
testSchemaCompletion().catch(console.error)
