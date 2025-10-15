// Extended Endpoint Testing: Apply systematic methodology to all key endpoints
// Test each endpoint individually, measure performance, identify issues

import { performance } from 'perf_hooks'

interface EndpointTest {
  endpoint: string
  method: 'GET' | 'POST'
  expectedStatus: number
  testDescription: string
  requiresAuth?: boolean
  testData?: any
  dataValidation?: (data: any) => { valid: boolean, issues: string[] }
}

const keyEndpoints: EndpointTest[] = [
  // Already tested - for comparison
  {
    endpoint: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    testDescription: 'Original health check (known broken - 503 status)'
  },
  {
    endpoint: '/api/health-optimized',
    method: 'GET', 
    expectedStatus: 200,
    testDescription: 'Optimized health check (verified working)'
  },
  {
    endpoint: '/api/vehicles',
    method: 'GET',
    expectedStatus: 200,
    testDescription: 'Vehicles list (verified working)',
    dataValidation: (data) => {
      const issues = []
      if (!data.data || !Array.isArray(data.data)) {
        issues.push('Missing or invalid data array')
      }
      return { valid: issues.length === 0, issues }
    }
  },
  {
    endpoint: '/api/garages',
    method: 'GET',
    expectedStatus: 200,
    testDescription: 'Garages list (verified working)'
  },
  
  // New endpoints to test
  {
    endpoint: '/api/notifications',
    method: 'GET',
    expectedStatus: 200,
    testDescription: 'Notifications endpoint (cache issues unknown)',
    dataValidation: (data) => {
      const issues = []
      if (!Array.isArray(data)) {
        issues.push('Expected array of notifications')
      }
      return { valid: issues.length === 0, issues }
    }
  },
  {
    endpoint: '/api/reminders',
    method: 'GET',
    expectedStatus: 200,
    testDescription: 'Reminders endpoint (cache issues unknown)',
    dataValidation: (data) => {
      const issues = []
      if (!data.data || !Array.isArray(data.data)) {
        issues.push('Missing or invalid data array')
      }
      return { valid: issues.length === 0, issues }
    }
  },
  {
    endpoint: '/api/reminders-simple',
    method: 'GET',
    expectedStatus: 200,
    testDescription: 'Simple reminders endpoint (performance unknown)'
  }
]

interface TestResult {
  endpoint: string
  method: string
  responseTime: number
  status: number
  cacheHeaders: string[]
  dataIssues: string[]
  success: boolean
  errorDetails?: string
}

async function testEndpoint(test: EndpointTest): Promise<TestResult> {
  const start = performance.now()
  
  try {
    const response = await fetch(`http://localhost:3005${test.endpoint}`, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed in future
      },
      body: test.testData ? JSON.stringify(test.testData) : undefined
    })
    
    const responseTime = performance.now() - start
    
    // Check cache headers
    const cacheHeaders = []
    const cacheControl = response.headers.get('cache-control')
    const pragma = response.headers.get('pragma')
    const expires = response.headers.get('expires')
    
    if (cacheControl) cacheHeaders.push(`cache-control: ${cacheControl}`)
    if (pragma) cacheHeaders.push(`pragma: ${pragma}`)
    if (expires) cacheHeaders.push(`expires: ${expires}`)
    
    // Validate data if validator provided
    let dataIssues: string[] = []
    if (test.dataValidation && response.ok) {
      try {
        const data = await response.json()
        const validation = test.dataValidation(data)
        dataIssues = validation.issues
      } catch (error) {
        dataIssues.push(`JSON parse error: ${error}`)
      }
    }
    
    return {
      endpoint: test.endpoint,
      method: test.method,
      responseTime: Math.round(responseTime),
      status: response.status,
      cacheHeaders,
      dataIssues,
      success: response.status === test.expectedStatus && dataIssues.length === 0
    }
    
  } catch (error) {
    return {
      endpoint: test.endpoint,
      method: test.method,
      responseTime: -1,
      status: -1,
      cacheHeaders: [],
      dataIssues: [],
      success: false,
      errorDetails: `Network error: ${error}`
    }
  }
}

async function runExtendedTesting() {
  console.log('🔬 EXTENDED SYSTEMATIC ENDPOINT TESTING')
  console.log('📊 Applying verified methodology to all key endpoints')
  console.log('🎯 Goal: Complete endpoint inventory with individual assessments\n')
  
  const results: TestResult[] = []
  
  for (const test of keyEndpoints) {
    console.log(`Testing ${test.method} ${test.endpoint}...`)
    const result = await testEndpoint(test)
    results.push(result)
    
    // Individual endpoint assessment
    let score = 0
    let assessment = ''
    
    if (result.success) {
      if (result.responseTime < 2000) {
        score = 8
        assessment = 'Excellent'
      } else if (result.responseTime < 4000) {
        score = 7
        assessment = 'Good'
      } else {
        score = 6
        assessment = 'Acceptable'
      }
    } else if (result.status >= 400) {
      score = 3
      assessment = 'Broken'
    } else {
      score = 4
      assessment = 'Issues'
    }
    
    console.log(`  Response time: ${result.responseTime}ms`)
    console.log(`  Status: ${result.status}`)
    console.log(`  Cache headers: ${result.cacheHeaders.length > 0 ? result.cacheHeaders.join(', ') : 'None'}`)
    console.log(`  Data issues: ${result.dataIssues.length > 0 ? result.dataIssues.join(', ') : 'None'}`)
    console.log(`  Success: ${result.success ? '✅' : '❌'}`)
    console.log(`  Individual Score: ${score}/10 (${assessment})`)
    if (result.errorDetails) {
      console.log(`  Error: ${result.errorDetails}`)
    }
    console.log('')
  }
  
  // Summary analysis
  console.log('📊 EXTENDED TESTING SUMMARY:')
  const working = results.filter(r => r.success)
  const broken = results.filter(r => !r.success)
  const fast = results.filter(r => r.responseTime > 0 && r.responseTime < 2000)
  const slow = results.filter(r => r.responseTime > 4000)
  const withCache = results.filter(r => r.cacheHeaders.length > 0)
  
  console.log(`  Working endpoints: ${working.length}/${results.length}`)
  console.log(`  Broken endpoints: ${broken.length}/${results.length}`)
  console.log(`  Fast endpoints (<2s): ${fast.length}/${results.length}`)
  console.log(`  Slow endpoints (>4s): ${slow.length}/${results.length}`)
  console.log(`  Endpoints with cache headers: ${withCache.length}/${results.length}`)
  
  // Individual endpoint scores
  console.log('\n🎯 INDIVIDUAL ENDPOINT SCORES (Evidence-Based):')
  results.forEach(result => {
    let score = 0
    if (result.success) {
      if (result.responseTime < 2000) score = 8
      else if (result.responseTime < 4000) score = 7
      else score = 6
    } else if (result.status >= 400) {
      score = 3
    } else {
      score = 4
    }
    
    const status = result.success ? '✅' : '❌'
    console.log(`  ${status} ${result.endpoint}: ${score}/10 (${result.responseTime}ms, status ${result.status})`)
  })
  
  // Recommendations based on evidence
  console.log('\n📋 EVIDENCE-BASED NEXT STEPS:')
  if (broken.length > 0) {
    console.log(`  • Fix broken endpoints: ${broken.map(r => r.endpoint).join(', ')}`)
  }
  if (slow.length > 0) {
    console.log(`  • Optimize slow endpoints: ${slow.map(r => r.endpoint).join(', ')}`)
  }
  if (withCache.length < results.length) {
    console.log(`  • Consider cache headers for consistency`)
  }
  
  console.log('\n✅ Extended systematic testing complete')
  console.log('📊 Each endpoint assessed individually based on measured behavior')
  console.log('🚫 No overall system score - individual endpoint scores only')
}

// Only run if called directly
if (require.main === module) {
  runExtendedTesting().catch(console.error)
}

export { runExtendedTesting }
