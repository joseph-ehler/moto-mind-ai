// Verify Orphan Fix: Check if our SQL fix actually worked
// The health check might be using cached data or different query pattern

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

async function verifyOrphanFix() {
  console.log('🔍 Verifying orphaned vehicles fix...')
  
  try {
    // Method 1: Direct SQL query (what we used to fix)
    console.log('\n1. Direct SQL query (our fix method):')
    const { data: directResult, error: directError } = await supabase
      .from('vehicles')
      .select('id, garage_id')
      .not('garage_id', 'is', null)
    
    if (directError) {
      console.log('❌ Error getting vehicles:', directError)
      return
    }
    
    // Check each vehicle's garage exists
    let orphanCount = 0
    for (const vehicle of directResult || []) {
      const { data: garage, error } = await supabase
        .from('garages')
        .select('id')
        .eq('id', vehicle.garage_id)
        .single()
      
      if (error || !garage) {
        console.log(`❌ Orphaned vehicle: ${vehicle.id} references garage ${vehicle.garage_id}`)
        orphanCount++
      }
    }
    
    console.log(`Direct check result: ${orphanCount} orphaned vehicles`)
    
    // Method 2: Health check query pattern (what's failing)
    console.log('\n2. Health check query pattern:')
    const { count, error: healthError } = await supabase
      .from('vehicles')
      .select(`
        id,
        garage:garages(id)
      `, { count: 'exact', head: true })
      .not('garage_id', 'is', null)
      .is('garage.id', null)
    
    console.log('Health check query result:', { count, error: healthError })
    
    // Method 3: Raw SQL to be absolutely sure
    console.log('\n3. Raw SQL verification:')
    const { data: rawResult, error: rawError } = await supabase
      .from('vehicles')
      .select(`
        v.id,
        v.garage_id,
        g.id as garage_exists
      `)
      .from('vehicles v')
      .leftJoin('garages g', 'v.garage_id', 'g.id')
      .where('v.garage_id', 'is not', null)
      .where('g.id', 'is', null)
    
    if (rawError) {
      console.log('Raw SQL error:', rawError)
    } else {
      console.log(`Raw SQL result: ${rawResult?.length || 0} orphaned vehicles`)
      if (rawResult && rawResult.length > 0) {
        console.log('Orphaned vehicles found:', rawResult)
      }
    }
    
    // Method 4: Check if our UPDATE actually worked
    console.log('\n4. Checking if our UPDATE worked:')
    const { data: allVehicles } = await supabase
      .from('vehicles')
      .select('id, garage_id, display_name')
      .not('garage_id', 'is', null)
      .limit(10)
    
    console.log('Sample vehicles with garage_id:', allVehicles)
    
    // Check if default garages exist
    const { data: defaultGarages } = await supabase
      .from('garages')
      .select('id, tenant_id, name, is_default')
      .eq('is_default', true)
    
    console.log('Default garages:', defaultGarages)
    
  } catch (error) {
    console.error('💥 Verification failed:', error)
  }
}

verifyOrphanFix()
