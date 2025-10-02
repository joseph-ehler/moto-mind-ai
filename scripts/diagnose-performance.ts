// Performance Diagnostics: Find the actual bottleneck
// No theoretical optimizations - identify the real problem

import { performance } from 'perf_hooks'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function diagnosePerformance() {
  console.log('🔍 Performance Diagnostics: Finding the actual bottleneck')
  console.log('⏱️  Measuring real response times, not theoretical optimizations\n')
  
  const metrics: Record<string, number> = {}
  
  try {
    // Test database connection time
    console.log('Testing database connection...')
    const connStart = performance.now()
    await supabase.from('vehicles').select('id').limit(1)
    metrics.db_connection = performance.now() - connStart
    console.log(`Database connection: ${metrics.db_connection.toFixed(2)}ms`)
    
    // Test simple query
    console.log('Testing simple query...')
    const simpleStart = performance.now()
    await supabase.from('vehicles').select('id').limit(1)
    metrics.simple_query = performance.now() - simpleStart
    console.log(`Simple query: ${metrics.simple_query.toFixed(2)}ms`)
    
    // Test complex query (what /api/vehicles actually does)
    console.log('Testing complex query (vehicles with garages)...')
    const complexStart = performance.now()
    await supabase
      .from('vehicles')
      .select(`
        *,
        garage:garages(*)
      `)
      .limit(10)
    metrics.complex_query = performance.now() - complexStart
    console.log(`Complex query: ${metrics.complex_query.toFixed(2)}ms`)
    
    // Test N+1 simulation (the likely culprit)
    console.log('Testing N+1 query pattern...')
    const n1Start = performance.now()
    const { data: vehicles } = await supabase.from('vehicles').select('id, garage_id').limit(10)
    
    if (vehicles) {
      for (const vehicle of vehicles) {
        if (vehicle.garage_id) {
          await supabase.from('garages').select('*').eq('id', vehicle.garage_id).single()
        }
      }
    }
    metrics.n_plus_one = performance.now() - n1Start
    console.log(`N+1 simulation: ${metrics.n_plus_one.toFixed(2)}ms`)
    
    // Test health check endpoint timing
    console.log('Testing health check endpoint...')
    const healthStart = performance.now()
    const healthResponse = await fetch('http://localhost:3005/api/health')
    metrics.health_endpoint = performance.now() - healthStart
    console.log(`Health endpoint: ${metrics.health_endpoint.toFixed(2)}ms`)
    
    // Test vehicles API endpoint timing
    console.log('Testing vehicles API endpoint...')
    const apiStart = performance.now()
    const apiResponse = await fetch('http://localhost:3005/api/vehicles')
    metrics.vehicles_endpoint = performance.now() - apiStart
    console.log(`Vehicles endpoint: ${metrics.vehicles_endpoint.toFixed(2)}ms`)
    
    console.log('\n📊 Performance Diagnostics Results:')
    console.log(JSON.stringify(metrics, null, 2))
    
    console.log('\n🔍 Problem Analysis:')
    
    // Identify the actual problem
    if (metrics.db_connection > 100) {
      console.log('❌ PROBLEM: Database connection is slow (>100ms)')
      console.log('   Solution: Check network latency, connection pooling, or Supabase region')
    }
    
    if (metrics.n_plus_one > metrics.complex_query * 2) {
      console.log('❌ PROBLEM: N+1 queries detected in application code')
      console.log('   Solution: Use proper joins instead of sequential queries')
    }
    
    if (metrics.complex_query > 200 && metrics.db_connection < 100) {
      console.log('❌ PROBLEM: Query itself is slow - missing indexes or inefficient joins')
      console.log('   Solution: Add indexes for actual query patterns, optimize joins')
    }
    
    if (metrics.vehicles_endpoint > 1000) {
      console.log('❌ PROBLEM: API endpoint is fundamentally slow (>1s)')
      console.log('   Solution: Profile the actual endpoint code, not the database')
    }
    
    if (metrics.health_endpoint > 1000) {
      console.log('❌ PROBLEM: Health check taking >1s indicates systemic issues')
      console.log('   Solution: Simplify health check queries or fix underlying performance')
    }
    
    console.log('\n🎯 Next Steps:')
    console.log('1. Fix the specific problem identified above')
    console.log('2. Re-run this diagnostic to verify the fix')
    console.log('3. Only move to next issue after this one is resolved')
    console.log('4. No theoretical optimizations until real problems are fixed')
    
  } catch (error) {
    console.error('💥 Diagnostic failed:', error)
    console.log('❌ PROBLEM: Basic database queries are failing')
    console.log('   Solution: Fix database connection and basic functionality first')
  }
}

// Run the diagnostic
diagnosePerformance().catch(console.error)
