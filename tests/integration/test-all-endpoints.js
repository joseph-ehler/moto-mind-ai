// Test all key endpoints after database fixes
const endpoints = [
  { name: 'Garages', url: 'http://localhost:3005/api/garages' },
  { name: 'Vehicles', url: 'http://localhost:3005/api/vehicles' },
  { name: 'Health Optimized', url: 'http://localhost:3005/api/system/health-optimized' },
  { name: 'Vision Process', url: 'http://localhost:3005/api/vision/process' }
]

async function testEndpoint(endpoint) {
  const startTime = Date.now()
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    const data = await response.text()
    
    const status = response.ok ? '✅' : '❌'
    console.log(`${status} ${endpoint.name}: ${response.status} (${responseTime}ms)`)
    
    if (!response.ok) {
      console.log(`   Error: ${data.substring(0, 100)}...`)
    } else {
      const jsonData = JSON.parse(data)
      if (jsonData.data && Array.isArray(jsonData.data)) {
        console.log(`   Data: ${jsonData.data.length} records`)
      } else if (jsonData.garages && Array.isArray(jsonData.garages)) {
        console.log(`   Data: ${jsonData.garages.length} garages`)
      } else if (jsonData.status) {
        console.log(`   Status: ${jsonData.status}`)
      }
    }
    
    return {
      name: endpoint.name,
      status: response.status,
      ok: response.ok,
      responseTime,
      working: response.ok
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name}: Connection failed - ${error.message}`)
    return {
      name: endpoint.name,
      status: 0,
      ok: false,
      responseTime: 0,
      working: false,
      error: error.message
    }
  }
}

async function runTests() {
  console.log('🧪 Testing all key endpoints after database fixes...\n')
  
  const results = []
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    results.push(result)
    console.log() // Add spacing
  }
  
  console.log('📊 SUMMARY:')
  console.log('=' .repeat(50))
  
  const working = results.filter(r => r.working).length
  const total = results.length
  const percentage = Math.round((working / total) * 100)
  
  console.log(`Working endpoints: ${working}/${total} (${percentage}%)`)
  console.log()
  
  results.forEach(result => {
    const status = result.working ? '✅' : '❌'
    const time = result.responseTime > 0 ? `${result.responseTime}ms` : 'failed'
    console.log(`${status} ${result.name}: ${time}`)
  })
  
  console.log()
  if (percentage === 100) {
    console.log('🎉 All endpoints working!')
  } else if (percentage >= 75) {
    console.log('✅ Most endpoints working - good progress!')
  } else if (percentage >= 50) {
    console.log('⚠️ Some endpoints working - needs more fixes')
  } else {
    console.log('❌ Most endpoints broken - significant issues remain')
  }
}

runTests()
