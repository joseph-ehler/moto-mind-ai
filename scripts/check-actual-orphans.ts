// Check Actual Orphaned Vehicles: Direct verification
// Determine if health check is reading stale data or real orphans exist

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkActualOrphans() {
  console.log('🔍 Checking for actual orphaned vehicles...')
  
  try {
    // Direct query as you suggested
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, display_name, garage_id')
      .not('garage_id', 'is', null)
    
    if (error) {
      console.log('❌ Error fetching vehicles:', error)
      return
    }
    
    console.log(`📊 Total vehicles with garage_id: ${data?.length || 0}`)
    
    // Check each vehicle's garage exists
    let orphanCount = 0
    const orphans = []
    
    for (const vehicle of data || []) {
      const { data: garage, error: garageError } = await supabase
        .from('garages')
        .select('id')
        .eq('id', vehicle.garage_id)
        .single()
      
      if (garageError || !garage) {
        orphanCount++
        orphans.push(vehicle)
        console.log(`❌ ORPHANED: ${vehicle.id} (${vehicle.display_name}) references garage ${vehicle.garage_id}`)
      }
    }
    
    console.log(`\n📊 RESULT: ${orphanCount} orphaned vehicles found`)
    
    if (orphanCount === 0) {
      console.log('✅ No orphaned vehicles exist - health check is using stale data or caching')
      console.log('   The health check needs to be fixed or cache cleared')
    } else {
      console.log('❌ Real orphaned vehicles exist - need to fix the data')
      console.log('   Our previous UPDATE statements may not have worked correctly')
      
      // Show which garages they reference
      const referencedGarages = [...new Set(orphans.map(v => v.garage_id))]
      console.log(`\n🔍 Orphaned vehicles reference these garage IDs:`)
      for (const garageId of referencedGarages) {
        console.log(`   ${garageId}`)
      }
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error)
  }
}

checkActualOrphans()
