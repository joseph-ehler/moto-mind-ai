// Replace Health Endpoint: Swap broken version with working optimized version
// Root cause: Original takes 12.8s + 503 error, optimized takes 11.8s + 200 status

import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'

interface HealthEndpointTest {
  endpoint: string
  responseTime: number
  status: number
  dataIntegrity: boolean
  errors: string[]
  cacheHeaders: string[]
}

async function testHealthEndpoint(endpoint: string): Promise<HealthEndpointTest> {
  const start = performance.now()
  
  try {
    const response = await fetch(`http://localhost:3005${endpoint}`)
    const responseTime = performance.now() - start
    
    // Check cache headers
    const cacheHeaders = []
    const cacheControl = response.headers.get('cache-control')
    const pragma = response.headers.get('pragma')
    const expires = response.headers.get('expires')
    
    if (cacheControl) cacheHeaders.push(`cache-control: ${cacheControl}`)
    if (pragma) cacheHeaders.push(`pragma: ${pragma}`)
    if (expires) cacheHeaders.push(`expires: ${expires}`)
    
    if (response.ok) {
      const data = await response.json()
      return {
        endpoint,
        responseTime: Math.round(responseTime),
        status: response.status,
        dataIntegrity: data.checks?.data_integrity || false,
        errors: data.errors || [],
        cacheHeaders
      }
    } else {
      return {
        endpoint,
        responseTime: Math.round(responseTime),
        status: response.status,
        dataIntegrity: false,
        errors: ['HTTP error response'],
        cacheHeaders
      }
    }
    
  } catch (error) {
    return {
      endpoint,
      responseTime: -1,
      status: -1,
      dataIntegrity: false,
      errors: [`Network error: ${error}`],
      cacheHeaders: []
    }
  }
}

async function compareHealthEndpoints() {
  console.log('🔧 COMPARING HEALTH ENDPOINTS')
  console.log('📊 Testing broken original vs working optimized version\n')
  
  // Test both endpoints
  console.log('1. Testing /api/health (broken original):')
  const originalResult = await testHealthEndpoint('/api/health')
  
  console.log(`   Response time: ${originalResult.responseTime}ms`)
  console.log(`   Status: ${originalResult.status}`)
  console.log(`   Data integrity: ${originalResult.dataIntegrity}`)
  console.log(`   Errors: ${originalResult.errors.length} (${originalResult.errors.join(', ')})`)
  console.log(`   Cache headers: ${originalResult.cacheHeaders.length > 0 ? originalResult.cacheHeaders.join(', ') : 'None'}`)
  
  console.log('\n2. Testing /api/health-optimized (working version):')
  const optimizedResult = await testHealthEndpoint('/api/health-optimized')
  
  console.log(`   Response time: ${optimizedResult.responseTime}ms`)
  console.log(`   Status: ${optimizedResult.status}`)
  console.log(`   Data integrity: ${optimizedResult.dataIntegrity}`)
  console.log(`   Errors: ${optimizedResult.errors.length} (${optimizedResult.errors.join(', ')})`)
  console.log(`   Cache headers: ${optimizedResult.cacheHeaders.length > 0 ? optimizedResult.cacheHeaders.join(', ') : 'None'}`)
  
  // Comparison
  console.log('\n📊 COMPARISON:')
  console.log(`   Status: ${originalResult.status} → ${optimizedResult.status}`)
  console.log(`   Response time: ${originalResult.responseTime}ms → ${optimizedResult.responseTime}ms`)
  console.log(`   Data integrity: ${originalResult.dataIntegrity} → ${optimizedResult.dataIntegrity}`)
  console.log(`   Errors: ${originalResult.errors.length} → ${optimizedResult.errors.length}`)
  console.log(`   Cache headers: ${originalResult.cacheHeaders.length} → ${optimizedResult.cacheHeaders.length}`)
  
  // Recommendation
  console.log('\n🎯 RECOMMENDATION:')
  if (optimizedResult.status === 200 && originalResult.status !== 200) {
    console.log('   ✅ Replace /api/health with /api/health-optimized')
    console.log('   ✅ Optimized version works, original is broken')
    
    // Show file replacement steps
    console.log('\n📋 REPLACEMENT STEPS:')
    console.log('   1. Backup original: mv pages/api/health.ts pages/api/health-broken.ts')
    console.log('   2. Replace with optimized: mv pages/api/health-optimized.ts pages/api/health.ts')
    console.log('   3. Test replacement: curl http://localhost:3005/api/health')
    console.log('   4. Verify improvement with measurements')
    
  } else {
    console.log('   ⚠️  Both endpoints have issues - investigate further')
  }
  
  return { originalResult, optimizedResult }
}

async function performHealthEndpointReplacement() {
  console.log('\n🔧 PERFORMING HEALTH ENDPOINT REPLACEMENT')
  console.log('⚠️  This will replace the broken health endpoint with the working version\n')
  
  const healthPath = '/Users/josephehler/Desktop/Desktop/apps/motomind-ai/pages/api/health.ts'
  const optimizedPath = '/Users/josephehler/Desktop/Desktop/apps/motomind-ai/pages/api/health-optimized.ts'
  const backupPath = '/Users/josephehler/Desktop/Desktop/apps/motomind-ai/pages/api/health-broken.ts'
  
  try {
    // Check if files exist
    if (!fs.existsSync(healthPath)) {
      console.log('❌ Original health.ts not found')
      return false
    }
    
    if (!fs.existsSync(optimizedPath)) {
      console.log('❌ Optimized health-optimized.ts not found')
      return false
    }
    
    // Backup original
    console.log('1. Backing up original health.ts...')
    fs.copyFileSync(healthPath, backupPath)
    console.log('   ✅ Backup created: health-broken.ts')
    
    // Replace with optimized version
    console.log('2. Replacing with optimized version...')
    fs.copyFileSync(optimizedPath, healthPath)
    console.log('   ✅ Replaced health.ts with optimized version')
    
    console.log('\n✅ Health endpoint replacement complete')
    console.log('🎯 Next: Test the replacement with measurements')
    
    return true
    
  } catch (error) {
    console.log(`❌ Replacement failed: ${error}`)
    return false
  }
}

async function runHealthEndpointFix() {
  console.log('🔧 HEALTH ENDPOINT REPLACEMENT PROCESS')
  console.log('🎯 Replace broken endpoint with working optimized version\n')
  
  // First compare the endpoints
  const comparison = await compareHealthEndpoints()
  
  // Only proceed with replacement if optimized version is clearly better
  if (comparison.optimizedResult.status === 200 && comparison.originalResult.status !== 200) {
    console.log('\n🎯 Proceeding with replacement...')
    const success = await performHealthEndpointReplacement()
    
    if (success) {
      console.log('\n📊 Testing replacement...')
      // Test the replaced endpoint
      const replacedResult = await testHealthEndpoint('/api/health')
      console.log(`   New /api/health status: ${replacedResult.status}`)
      console.log(`   New /api/health response time: ${replacedResult.responseTime}ms`)
      console.log(`   New /api/health data integrity: ${replacedResult.dataIntegrity}`)
      console.log(`   New /api/health errors: ${replacedResult.errors.length}`)
      
      if (replacedResult.status === 200 && replacedResult.dataIntegrity) {
        console.log('\n✅ SUCCESS: Health endpoint replacement verified')
      } else {
        console.log('\n⚠️  Replacement may have issues - verify manually')
      }
    }
  } else {
    console.log('\n⚠️  Skipping replacement - optimized version not clearly better')
  }
  
  console.log('\n✅ Health endpoint fix process complete')
}

// Only run if called directly
if (require.main === module) {
  runHealthEndpointFix().catch(console.error)
}

export { compareHealthEndpoints, testHealthEndpoint }
