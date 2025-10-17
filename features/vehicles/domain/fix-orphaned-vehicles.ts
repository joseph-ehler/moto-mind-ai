// Fix orphaned vehicles by creating an "Unassigned" garage
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

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

async function fixOrphanedVehicles() {
  console.log('🔧 Fixing orphaned vehicles...')
  
  try {
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'
    
    // Step 1: Create "Unassigned" garage if it doesn't exist
    console.log('📝 Step 1: Creating "Unassigned" garage...')
    
    const { data: existingGarage, error: checkError } = await supabase
      .from('garages')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('name', 'Unassigned')
      .single()
    
    let unassignedGarageId: string
    
    if (checkError && checkError.code === 'PGRST116') {
      // Garage doesn't exist, create it
      const { data: newGarage, error: createError } = await supabase
        .from('garages')
        .insert({
          tenant_id: tenantId,
          name: 'Unassigned',
          address: 'Temporary holding for vehicles without garages',
          is_default: false
        })
        .select('id')
        .single()
      
      if (createError) {
        throw new Error(`Failed to create Unassigned garage: ${createError.message}`)
      }
      
      unassignedGarageId = newGarage.id
      console.log('✅ Created "Unassigned" garage:', unassignedGarageId)
    } else if (existingGarage) {
      unassignedGarageId = existingGarage.id
      console.log('✅ Found existing "Unassigned" garage:', unassignedGarageId)
    } else {
      throw new Error(`Unexpected error checking for garage: ${checkError?.message}`)
    }
    
    // Step 2: Find orphaned vehicles
    console.log('📝 Step 2: Finding orphaned vehicles...')
    
    // Find vehicles with null garage_id or non-existent garage references
    const { data: allVehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        display_name,
        garage_id,
        garage:garages(id, name)
      `)
    
    if (vehiclesError) {
      throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`)
    }
    
    // Filter for orphaned vehicles (null garage_id or garage doesn't exist)
    const orphanedVehicles = allVehicles?.filter((v: any) => 
      !v.garage_id || (v.garage && Array.isArray(v.garage) ? v.garage.length === 0 : !v.garage.id)
    ) || []
    
    if (!orphanedVehicles || orphanedVehicles.length === 0) {
      console.log('✅ No orphaned vehicles found!')
      return
    }
    
    console.log(`📊 Found ${orphanedVehicles.length} orphaned vehicles:`)
    orphanedVehicles.forEach(v => {
      console.log(`  • ${v.display_name} (${v.id})`)
    })
    
    // Step 3: Reassign orphaned vehicles
    console.log('📝 Step 3: Reassigning orphaned vehicles...')
    
    const vehicleIds = orphanedVehicles.map(v => v.id)
    
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({ garage_id: unassignedGarageId })
      .in('id', vehicleIds)
    
    if (updateError) {
      throw new Error(`Failed to reassign vehicles: ${updateError.message}`)
    }
    
    console.log(`✅ Successfully reassigned ${orphanedVehicles.length} vehicles to "Unassigned" garage`)
    
    // Step 4: Verify fix
    console.log('📝 Step 4: Verifying fix...')
    
    const healthResponse = await fetch('http://localhost:3005/api/health')
    const health = await healthResponse.json()
    
    console.log('🏥 Health Status:', health.status)
    console.log('📊 Orphaned vehicles:', health.metrics.orphaned_vehicles)
    
    if (health.metrics.orphaned_vehicles === 0) {
      console.log('🎉 All orphaned vehicles fixed! System is healthy!')
    } else {
      console.log('⚠️  Still have orphaned vehicles:', health.metrics.orphaned_vehicles)
    }
    
  } catch (error) {
    console.error('💥 Failed to fix orphaned vehicles:', error)
  }
}

fixOrphanedVehicles()
