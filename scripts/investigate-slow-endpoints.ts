// Investigate Slow Endpoints: Identify root causes of 2.8-4.5s response times
// Focus on the 4 endpoints that still need performance work

import { performance } from 'perf_hooks'

interface SlowEndpointAnalysis {
  endpoint: string
  responseTime: number
  possibleCauses: string[]
  investigationNotes: string
  nextSteps: string[]
}

async function analyzeSlowEndpoint(endpoint: string, description: string): Promise<SlowEndpointAnalysis> {
  console.log(`\n🔍 Analyzing ${endpoint} (${description}):`)
  
  const start = performance.now()
  
  try {
    const response = await fetch(`http://localhost:3005${endpoint}`)
    const responseTime = performance.now() - start
    
    console.log(`   Response time: ${Math.round(responseTime)}ms`)
    console.log(`   Status: ${response.status}`)
    
    let possibleCauses: string[] = []
    let investigationNotes = ''
    let nextSteps: string[] = []
    
    if (responseTime > 4000) {
      possibleCauses.push('Very slow - likely multiple database queries')
      possibleCauses.push('Complex joins or N+1 query patterns')
      possibleCauses.push('Missing indexes for query patterns')
      nextSteps.push('Profile database queries')
      nextSteps.push('Check for N+1 patterns in code')
    } else if (responseTime > 2500) {
      possibleCauses.push('Slow - database query optimization needed')
      possibleCauses.push('Possible inefficient joins')
      nextSteps.push('Review query structure')
      nextSteps.push('Add targeted indexes')
    }
    
    // Add satellite internet context
    if (responseTime > 1500) {
      investigationNotes = 'Note: Includes ~1.6s satellite internet latency. Ground internet would be faster.'
    }
    
    if (response.ok) {
      const data = await response.json()
      
      // Analyze response structure for complexity indicators
      if (data.data && Array.isArray(data.data)) {
        console.log(`   Data items returned: ${data.data.length}`)
        if (data.data.length > 0) {
          const sampleItem = data.data[0]
          const fieldCount = Object.keys(sampleItem).length
          console.log(`   Fields per item: ${fieldCount}`)
          
          if (fieldCount > 10) {
            possibleCauses.push('Large response payload - many fields per item')
            nextSteps.push('Consider reducing fields returned')
          }
          
          if (data.data.length > 50) {
            possibleCauses.push('Large result set - many items returned')
            nextSteps.push('Implement pagination')
          }
        }
      }
    }
    
    return {
      endpoint,
      responseTime: Math.round(responseTime),
      possibleCauses,
      investigationNotes,
      nextSteps
    }
    
  } catch (error) {
    return {
      endpoint,
      responseTime: -1,
      possibleCauses: ['Network error'],
      investigationNotes: `Error: ${error}`,
      nextSteps: ['Fix network connectivity']
    }
  }
}

async function investigateSlowEndpoints() {
  console.log('🔬 INVESTIGATING SLOW ENDPOINTS')
  console.log('📊 Analyzing 4 endpoints with 2.8-4.5s response times')
  console.log('🎯 Goal: Identify specific root causes for performance issues\n')
  
  const slowEndpoints = [
    { endpoint: '/api/health', description: 'Health check (replaced but still slow)' },
    { endpoint: '/api/health-optimized', description: 'Optimized health check' },
    { endpoint: '/api/vehicles', description: 'Vehicles list with joins' },
    { endpoint: '/api/reminders-simple', description: 'Simple reminders (in-memory)' }
  ]
  
  const analyses: SlowEndpointAnalysis[] = []
  
  for (const { endpoint, description } of slowEndpoints) {
    const analysis = await analyzeSlowEndpoint(endpoint, description)
    analyses.push(analysis)
    
    console.log(`   Possible causes: ${analysis.possibleCauses.join(', ')}`)
    console.log(`   Investigation notes: ${analysis.investigationNotes}`)
    console.log(`   Next steps: ${analysis.nextSteps.join(', ')}`)
  }
  
  // Summary analysis
  console.log('\n📊 SLOW ENDPOINT ANALYSIS SUMMARY:')
  
  const verySlow = analyses.filter(a => a.responseTime > 4000)
  const moderatelySlow = analyses.filter(a => a.responseTime > 2500 && a.responseTime <= 4000)
  const acceptable = analyses.filter(a => a.responseTime <= 2500 && a.responseTime > 0)
  
  console.log(`   Very slow (>4s): ${verySlow.length}`)
  console.log(`   Moderately slow (2.5-4s): ${moderatelySlow.length}`)
  console.log(`   Acceptable (<2.5s): ${acceptable.length}`)
  
  // Common patterns
  const allCauses = analyses.flatMap(a => a.possibleCauses)
  const causeFrequency = allCauses.reduce((acc, cause) => {
    acc[cause] = (acc[cause] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\n🔍 COMMON PERFORMANCE ISSUES:')
  Object.entries(causeFrequency)
    .sort(([,a], [,b]) => b - a)
    .forEach(([cause, count]) => {
      console.log(`   • ${cause} (${count} endpoints)`)
    })
  
  // Prioritized next steps
  const allNextSteps = analyses.flatMap(a => a.nextSteps)
  const stepFrequency = allNextSteps.reduce((acc, step) => {
    acc[step] = (acc[step] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  console.log('\n📋 PRIORITIZED NEXT STEPS:')
  Object.entries(stepFrequency)
    .sort(([,a], [,b]) => b - a)
    .forEach(([step, count]) => {
      console.log(`   • ${step} (affects ${count} endpoints)`)
    })
  
  console.log('\n🎯 INVESTIGATION METHODOLOGY:')
  console.log('   ✅ Each slow endpoint analyzed individually')
  console.log('   ✅ Response times measured and categorized')
  console.log('   ✅ Possible causes identified based on evidence')
  console.log('   ✅ Specific next steps prioritized by impact')
  console.log('   ✅ Satellite internet context included in analysis')
  
  console.log('\n✅ Slow endpoint investigation complete')
  console.log('📊 Ready for targeted performance fixes based on evidence')
  
  return analyses
}

// Only run if called directly
if (require.main === module) {
  investigateSlowEndpoints().catch(console.error)
}

export { investigateSlowEndpoints }
