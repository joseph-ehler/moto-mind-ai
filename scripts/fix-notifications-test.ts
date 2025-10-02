// Fix Notifications Test: Update test expectations to match actual API response
// Root cause: API returns {notifications: []} but test expects direct array

import { performance } from 'perf_hooks'

interface NotificationTestResult {
  endpoint: string
  responseTime: number
  status: number
  dataStructure: string
  isValidFormat: boolean
  errorDetails?: string
}

async function testNotificationsEndpoint(): Promise<NotificationTestResult> {
  const start = performance.now()
  
  try {
    const response = await fetch('http://localhost:3005/api/notifications')
    const responseTime = performance.now() - start
    const data = await response.json()
    
    // Check if response matches expected format
    const hasNotificationsArray = data && typeof data === 'object' && Array.isArray(data.notifications)
    const hasCount = typeof data.count === 'number'
    const hasGeneratedAt = typeof data.generated_at === 'string'
    
    const isValidFormat = hasNotificationsArray && hasCount && hasGeneratedAt
    
    return {
      endpoint: '/api/notifications',
      responseTime: Math.round(responseTime),
      status: response.status,
      dataStructure: JSON.stringify(Object.keys(data)),
      isValidFormat,
      errorDetails: isValidFormat ? undefined : 'Missing expected properties: notifications (array), count (number), generated_at (string)'
    }
    
  } catch (error) {
    return {
      endpoint: '/api/notifications',
      responseTime: -1,
      status: -1,
      dataStructure: 'Error',
      isValidFormat: false,
      errorDetails: `Network error: ${error}`
    }
  }
}

// Corrected validation function for notifications endpoint
function validateNotificationsResponse(data: any): { valid: boolean, issues: string[] } {
  const issues: string[] = []
  
  // Check for correct object structure
  if (!data || typeof data !== 'object') {
    issues.push('Response is not an object')
    return { valid: false, issues }
  }
  
  // Check for notifications array
  if (!Array.isArray(data.notifications)) {
    issues.push('Missing notifications array')
  }
  
  // Check for count property
  if (typeof data.count !== 'number') {
    issues.push('Missing or invalid count property')
  }
  
  // Check for generated_at timestamp
  if (typeof data.generated_at !== 'string') {
    issues.push('Missing or invalid generated_at timestamp')
  }
  
  return { valid: issues.length === 0, issues }
}

async function runNotificationsTest() {
  console.log('🔧 FIXING NOTIFICATIONS TEST EXPECTATIONS')
  console.log('📊 Testing actual API response format vs corrected expectations\n')
  
  const result = await testNotificationsEndpoint()
  
  console.log('📊 TEST RESULTS:')
  console.log(`  Endpoint: ${result.endpoint}`)
  console.log(`  Response time: ${result.responseTime}ms`)
  console.log(`  Status: ${result.status}`)
  console.log(`  Data structure: ${result.dataStructure}`)
  console.log(`  Valid format: ${result.isValidFormat ? '✅' : '❌'}`)
  
  if (result.errorDetails) {
    console.log(`  Issues: ${result.errorDetails}`)
  }
  
  // Test the corrected validation
  if (result.status === 200) {
    try {
      const response = await fetch('http://localhost:3005/api/notifications')
      const data = await response.json()
      const validation = validateNotificationsResponse(data)
      
      console.log('\n🔧 CORRECTED VALIDATION:')
      console.log(`  Validation result: ${validation.valid ? '✅ PASS' : '❌ FAIL'}`)
      if (validation.issues.length > 0) {
        console.log(`  Issues: ${validation.issues.join(', ')}`)
      }
      
      console.log('\n📋 SUMMARY:')
      if (validation.valid) {
        console.log('  ✅ Notifications endpoint works correctly')
        console.log('  ✅ API returns proper {notifications: [], count: N, generated_at: timestamp} format')
        console.log('  ✅ Previous test expectation was incorrect (expected direct array)')
        console.log('  🎯 Fix: Update test to expect object with notifications property')
      } else {
        console.log('  ❌ Notifications endpoint has actual issues')
        console.log(`  ❌ Problems: ${validation.issues.join(', ')}`)
      }
      
    } catch (error) {
      console.log(`\n❌ Error testing corrected validation: ${error}`)
    }
  }
  
  console.log('\n✅ Notifications test fix complete')
}

// Only run if called directly
if (require.main === module) {
  runNotificationsTest().catch(console.error)
}

export { validateNotificationsResponse, testNotificationsEndpoint }
