#!/usr/bin/env tsx
/**
 * Test Vehicle API Routes
 * 
 * Tests the newly created vehicle API routes:
 * - Authentication check
 * - List vehicles
 * - Create vehicle
 * - Get single vehicle
 * - Update vehicle
 * - Delete vehicle
 */

const BASE_URL = 'http://localhost:3005'

interface TestResult {
  test: string
  passed: boolean
  message: string
  data?: any
}

const results: TestResult[] = []

function log(test: string, passed: boolean, message: string, data?: any) {
  results.push({ test, passed, message, data })
  const emoji = passed ? '✅' : '❌'
  console.log(`${emoji} ${test}: ${message}`)
  if (data && !passed) {
    console.log('   Data:', JSON.stringify(data, null, 2))
  }
}

async function testAuth() {
  console.log('\n🔐 Testing Authentication...\n')
  
  try {
    const response = await fetch(`${BASE_URL}/api/vehicles`)
    const data = await response.json()
    
    if (response.status === 401 && data.error?.code === 'UNAUTHORIZED') {
      log('Auth Required', true, 'Correctly requires authentication')
    } else {
      log('Auth Required', false, 'Should return 401 without auth', data)
    }
  } catch (error) {
    log('Auth Required', false, `Request failed: ${error}`)
  }
}

async function testWithAuth(sessionCookie: string) {
  console.log('\n🚗 Testing Vehicles API...\n')
  
  let createdVehicleId: string | null = null
  
  // Test 1: List vehicles
  try {
    const response = await fetch(`${BASE_URL}/api/vehicles`, {
      headers: { 'Cookie': sessionCookie }
    })
    const data = await response.json()
    
    if (response.ok && data.ok && Array.isArray(data.data?.vehicles)) {
      log('List Vehicles', true, `Found ${data.data.vehicles.length} vehicles`)
    } else {
      log('List Vehicles', false, 'Failed to list vehicles', data)
    }
  } catch (error) {
    log('List Vehicles', false, `Request failed: ${error}`)
  }
  
  // Test 2: Create vehicle
  try {
    const response = await fetch(`${BASE_URL}/api/vehicles`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        year: 2024,
        make: 'Tesla',
        model: 'Model 3',
        trim: 'Long Range',
        nickname: 'API Test Car'
      })
    })
    const data = await response.json()
    
    if (response.ok && data.ok && data.data?.vehicle?.id) {
      createdVehicleId = data.data.vehicle.id
      log('Create Vehicle', true, `Created vehicle: ${createdVehicleId}`)
    } else {
      log('Create Vehicle', false, 'Failed to create vehicle', data)
    }
  } catch (error) {
    log('Create Vehicle', false, `Request failed: ${error}`)
  }
  
  if (!createdVehicleId) {
    console.log('\n⚠️  Cannot continue - vehicle creation failed')
    return
  }
  
  // Test 3: Get single vehicle
  try {
    const response = await fetch(`${BASE_URL}/api/vehicles/${createdVehicleId}`, {
      headers: { 'Cookie': sessionCookie }
    })
    const data = await response.json()
    
    if (response.ok && data.ok && data.data?.vehicle?.id === createdVehicleId) {
      log('Get Vehicle', true, `Fetched vehicle: ${data.data.vehicle.nickname}`)
    } else {
      log('Get Vehicle', false, 'Failed to get vehicle', data)
    }
  } catch (error) {
    log('Get Vehicle', false, `Request failed: ${error}`)
  }
  
  // Test 4: Update vehicle
  try {
    const response = await fetch(`${BASE_URL}/api/vehicles/${createdVehicleId}`, {
      method: 'PATCH',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: 'Updated Test Car'
      })
    })
    const data = await response.json()
    
    if (response.ok && data.ok && data.data?.vehicle?.nickname === 'Updated Test Car') {
      log('Update Vehicle', true, 'Successfully updated vehicle')
    } else {
      log('Update Vehicle', false, 'Failed to update vehicle', data)
    }
  } catch (error) {
    log('Update Vehicle', false, `Request failed: ${error}`)
  }
  
  // Test 5: Delete vehicle
  try {
    const response = await fetch(`${BASE_URL}/api/vehicles/${createdVehicleId}`, {
      method: 'DELETE',
      headers: { 'Cookie': sessionCookie }
    })
    const data = await response.json()
    
    if (response.ok && data.ok) {
      log('Delete Vehicle', true, 'Successfully deleted vehicle')
    } else {
      log('Delete Vehicle', false, 'Failed to delete vehicle', data)
    }
  } catch (error) {
    log('Delete Vehicle', false, `Request failed: ${error}`)
  }
}

async function main() {
  console.log('🚀 MotoMind API Test Suite\n')
  console.log('Testing endpoints at:', BASE_URL)
  
  // Test without auth
  await testAuth()
  
  // Check if server is authenticated
  console.log('\n📝 To test authenticated routes:')
  console.log('1. Sign in at: http://localhost:3005/auth/signin')
  console.log('2. Copy session cookie from browser DevTools')
  console.log('3. Run: SESSION_COOKIE="your-cookie" npm run test:api')
  
  const sessionCookie = process.env.SESSION_COOKIE
  if (sessionCookie) {
    await testWithAuth(sessionCookie)
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  console.log(`\nTotal Tests: ${total}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${total - passed}`)
  console.log(`\nSuccess Rate: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (passed === total) {
    console.log('\n✅ ALL TESTS PASSED! 🎉')
  } else {
    console.log('\n⚠️  Some tests failed. Check output above.')
  }
}

main().catch(console.error)
