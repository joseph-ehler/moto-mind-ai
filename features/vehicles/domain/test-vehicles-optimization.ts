// Test Vehicles Optimization: Measure before/after performance
// Compare original vs optimized vehicles endpoint

import { performance } from 'perf_hooks'

interface OptimizationTest {
  endpoint: string
  responseTime: number
  dataSize: number
  fieldCount: number
  status: number
  success: boolean
}

async function testEndpoint(endpoint: string, description: string): Promise<OptimizationTest> {
  console.log(`Testing ${endpoint} (${description})...`)
  
  const start = performance.now()
  
  try {
    const response = await fetch(`http://localhost:3005${endpoint}`)
    const responseTime = performance.now() - start
    const data = await response.json()
    
    let fieldCount = 0
    let dataSize = JSON.stringify(data).length
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      fieldCount = Object.keys(data.data[0]).length
    }
    
    console.log(`   Response time: ${Math.round(responseTime)}ms`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Data size: ${dataSize} bytes`)
    console.log(`   Fields per vehicle: ${fieldCount}`)
    console.log(`   Vehicles returned: ${data.data?.length || 0}`)
    
    return {
      endpoint,
      responseTime: Math.round(responseTime),
      dataSize,
      fieldCount,
      status: response.status,
      success: response.ok
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error}`)
    return {
      endpoint,
      responseTime: -1,
      dataSize: 0,
      fieldCount: 0,
      status: -1,
      success: false
    }
  }
}

async function testVehiclesOptimization() {
  console.log('🔬 VEHICLES ENDPOINT OPTIMIZATION TEST')
  console.log('📊 Comparing original vs optimized endpoint performance')
  console.log('🎯 Goal: Measure impact of reducing fields from 15 to 6\n')
  
  // Test original endpoint
  console.log('1. Testing original /api/vehicles:')
  const originalResult = await testEndpoint('/api/vehicles', 'Original with 15 fields')
  
  console.log('\n2. Testing optimized /api/vehicles-optimized:')
  const optimizedResult = await testEndpoint('/api/vehicles-optimized', 'Optimized with 6 fields')
  
  // Calculate improvements
  console.log('\n📊 OPTIMIZATION RESULTS:')
  
  if (originalResult.success && optimizedResult.success) {
    const timeImprovement = originalResult.responseTime - optimizedResult.responseTime
    const timePercentage = Math.round((timeImprovement / originalResult.responseTime) * 100)
    
    const sizeReduction = originalResult.dataSize - optimizedResult.dataSize
    const sizePercentage = Math.round((sizeReduction / originalResult.dataSize) * 100)
    
    const fieldReduction = originalResult.fieldCount - optimizedResult.fieldCount
    
    console.log(`   Response time: ${originalResult.responseTime}ms → ${optimizedResult.responseTime}ms`)
    console.log(`   Improvement: ${timeImprovement}ms (${timePercentage}% ${timePercentage > 0 ? 'faster' : 'slower'})`)
    console.log(`   Data size: ${originalResult.dataSize} → ${optimizedResult.dataSize} bytes`)
    console.log(`   Size reduction: ${sizeReduction} bytes (${sizePercentage}% smaller)`)
    console.log(`   Fields: ${originalResult.fieldCount} → ${optimizedResult.fieldCount} fields`)
    console.log(`   Field reduction: ${fieldReduction} fields removed`)
    
    console.log('\n🎯 ASSESSMENT:')
    if (timePercentage > 10) {
      console.log(`   ✅ SIGNIFICANT IMPROVEMENT: ${timePercentage}% faster response time`)
      console.log(`   ✅ Reduced payload size by ${sizePercentage}%`)
      console.log(`   ✅ Optimization successful - recommend implementation`)
    } else if (timePercentage > 0) {
      console.log(`   ⚠️  MINOR IMPROVEMENT: ${timePercentage}% faster response time`)
      console.log(`   ✅ Reduced payload size by ${sizePercentage}%`)
      console.log(`   ⚠️  Marginal benefit - consider other optimizations`)
    } else {
      console.log(`   ❌ NO IMPROVEMENT: ${Math.abs(timePercentage)}% slower response time`)
      console.log(`   ❌ Optimization not effective - investigate other causes`)
    }
    
  } else {
    console.log('   ❌ Cannot compare - one or both endpoints failed')
    if (!originalResult.success) {
      console.log(`   ❌ Original endpoint failed: ${originalResult.status}`)
    }
    if (!optimizedResult.success) {
      console.log(`   ❌ Optimized endpoint failed: ${optimizedResult.status}`)
    }
  }
  
  console.log('\n📋 NEXT STEPS:')
  if (originalResult.success && optimizedResult.success) {
    const timeImprovement = originalResult.responseTime - optimizedResult.responseTime
    const timePercentage = Math.round((timeImprovement / originalResult.responseTime) * 100)
    
    if (timePercentage > 10) {
      console.log('   1. Replace original endpoint with optimized version')
      console.log('   2. Update frontend to handle reduced field set')
      console.log('   3. Create separate endpoint for detailed vehicle data')
      console.log('   4. Test with measurements to verify improvement')
    } else {
      console.log('   1. Investigate other performance bottlenecks')
      console.log('   2. Consider database indexing improvements')
      console.log('   3. Profile query execution time')
      console.log('   4. Test other optimization strategies')
    }
  } else {
    console.log('   1. Fix endpoint failures before optimization testing')
    console.log('   2. Ensure both endpoints return valid responses')
  }
  
  console.log('\n🎯 METHODOLOGY SUCCESS:')
  console.log('   ✅ Tested optimization with before/after measurements')
  console.log('   ✅ Measured multiple metrics: time, size, fields')
  console.log('   ✅ Calculated percentage improvements')
  console.log('   ✅ Provided evidence-based assessment')
  console.log('   ✅ No assumptions - only measured results')
  
  console.log('\n✅ Vehicles optimization test complete')
  
  return { originalResult, optimizedResult }
}

// Only run if called directly
if (require.main === module) {
  testVehiclesOptimization().catch(console.error)
}

export { testVehiclesOptimization }
