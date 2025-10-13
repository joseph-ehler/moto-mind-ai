// Systematic Endpoint Testing: Apply same verification methodology
// Test each endpoint for cache issues, performance problems, data accuracy

import { performance } from 'perf_hooks'

interface EndpointTest {
  endpoint: string
  expectedStatus: number
  testDescription: string
  cacheHeaders?: boolean
  dataValidation?: (data: any) => { valid: boolean, issues: string[] }
}

const endpoints: EndpointTest[] = [
  {
    endpoint: '/api/health',
    expectedStatus: 200,
    testDescription: 'Original health check (known issues)',
    cacheHeaders: false
  },
  {
    endpoint: '/api/health-optimized', 
    expectedStatus: 200,
    testDescription: 'Optimized health check (verified fix)',
    cacheHeaders: true
  },
  {
    endpoint: '/api/vehicles',
    expectedStatus: 200,
    testDescription: 'Vehicles API (check for cache issues)',
    dataValidation: (data) => {
      const issues = []
      if (!data.data || !Array.isArray(data.data)) {
        issues.push('Missing or invalid data array')
      }
      if (data.data && data.data.some((v: any) => !v.display_name)) {
        issues.push('Vehicles missing display_name')
      }
      return { valid: issues.length === 0, issues }
    }
  },
  {
    endpoint: '/api/vehicless',
    expectedStatus: 200,
    testDescription: 'Garages API (check for cache issues)'
  }
]

async function testEndpoint(test: EndpointTest): Promise<{
  endpoint: string
  responseTime: number
  status: number
  cacheHeaders: string[]
  dataIssues: string[]
  success: boolean
}> {
  const start = performance.now()
  
  try {
    const response = await fetch(`http://localhost:3005${test.endpoint}`)
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
      responseTime: Math.round(responseTime),
      status: response.status,
      cacheHeaders,
      dataIssues,
      success: response.status === test.expectedStatus && dataIssues.length === 0
    }
    
  } catch (error) {
    return {
      endpoint: test.endpoint,
      responseTime: -1,
      status: -1,
      cacheHeaders: [],
      dataIssues: [`Network error: ${error}`],
      success: false
    }
  }
}

async function runSystematicTesting() {
  console.log('🧪 SYSTEMATIC ENDPOINT TESTING')
  console.log('📊 Applying verified methodology to all endpoints')
  console.log('🎯 Goal: Identify cache issues, performance problems, data accuracy\n')
  
  const results = []
  
  for (const test of endpoints) {
    console.log(`Testing ${test.endpoint}...`)
    const result = await testEndpoint(test)
    results.push(result)
    
    console.log(`  Response time: ${result.responseTime}ms`)
    console.log(`  Status: ${result.status}`)
    console.log(`  Cache headers: ${result.cacheHeaders.length > 0 ? result.cacheHeaders.join(', ') : 'None'}`)
    console.log(`  Data issues: ${result.dataIssues.length > 0 ? result.dataIssues.join(', ') : 'None'}`)
    console.log(`  Success: ${result.success ? '✅' : '❌'}\n`)
  }
  
  // Summary
  console.log('📊 SYSTEMATIC TESTING SUMMARY:')
  const successful = results.filter(r => r.success).length
  const total = results.length
  
  console.log(`  Successful endpoints: ${successful}/${total}`)
  console.log(`  Failed endpoints: ${total - successful}/${total}`)
  
  // Identify patterns
  const withCacheHeaders = results.filter(r => r.cacheHeaders.length > 0)
  const withDataIssues = results.filter(r => r.dataIssues.length > 0)
  const slowEndpoints = results.filter(r => r.responseTime > 5000)
  
  console.log(`\n🔍 PATTERN ANALYSIS:`)
  console.log(`  Endpoints with cache headers: ${withCacheHeaders.length}`)
  console.log(`  Endpoints with data issues: ${withDataIssues.length}`)
  console.log(`  Slow endpoints (>5s): ${slowEndpoints.length}`)
  
  // Recommendations
  console.log(`\n📋 NEXT STEPS:`)
  if (withDataIssues.length > 0) {
    console.log(`  • Fix data issues in: ${withDataIssues.map(r => r.endpoint).join(', ')}`)
  }
  if (slowEndpoints.length > 0) {
    console.log(`  • Optimize performance for: ${slowEndpoints.map(r => r.endpoint).join(', ')}`)
  }
  if (withCacheHeaders.length < total) {
    console.log(`  • Consider cache headers for remaining endpoints`)
  }
  
  console.log(`\n✅ Systematic testing complete - assess each endpoint individually`)
}

// Only run if called directly
if (require.main === module) {
  runSystematicTesting().catch(console.error)
}

export { runSystematicTesting, testEndpoint }
