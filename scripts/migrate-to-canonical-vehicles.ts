/**
 * Migration Script: Existing Vehicles → Canonical Vehicle System
 * 
 * Run this after deploying the canonical_vehicles migration
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-canonical-vehicles.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

// ===================================================
// Migration Logic
// ===================================================

interface OldVehicle {
  id: string
  tenant_id: string
  user_id?: string
  vin?: string
  year?: number
  make?: string
  model?: string
  trim?: string
  body_type?: string
  engine?: string
  transmission?: string
  drive_type?: string
  fuel_type?: string
  nickname?: string
  color?: string
  license_plate?: string
  purchase_date?: string
  purchase_price?: number
  current_mileage?: number
  created_at: string
  updated_at?: string
}

async function migrateVehicles() {
  console.log('🚀 Starting migration to canonical vehicles...\n')
  
  try {
    // Step 1: Check if old vehicles table exists
    console.log('Step 1: Checking for old vehicles table...')
    const { data: oldVehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      if (fetchError.message.includes('does not exist')) {
        console.log('✅ No old vehicles table found. Migration not needed.')
        return
      }
      throw fetchError
    }
    
    if (!oldVehicles || oldVehicles.length === 0) {
      console.log('✅ No vehicles to migrate.')
      return
    }
    
    console.log(`Found ${oldVehicles.length} vehicles to migrate\n`)
    
    // Step 2: Group vehicles by VIN
    console.log('Step 2: Grouping vehicles by VIN...')
    const vehiclesByVIN = new Map<string, OldVehicle[]>()
    const vehiclesWithoutVIN: OldVehicle[] = []
    
    for (const vehicle of oldVehicles) {
      if (vehicle.vin) {
        const existing = vehiclesByVIN.get(vehicle.vin) || []
        existing.push(vehicle)
        vehiclesByVIN.set(vehicle.vin, existing)
      } else {
        vehiclesWithoutVIN.push(vehicle)
      }
    }
    
    console.log(`  - Vehicles with VIN: ${vehiclesByVIN.size} unique VINs`)
    console.log(`  - Vehicles without VIN: ${vehiclesWithoutVIN.length}\n`)
    
    // Step 3: Migrate vehicles with VINs
    console.log('Step 3: Migrating vehicles with VINs...')
    let migratedCount = 0
    let errorCount = 0
    
    for (const [vin, vehicles] of vehiclesByVIN.entries()) {
      try {
        // Use first vehicle as source of truth for VIN data
        const firstVehicle = vehicles[0]
        
        // Check if canonical vehicle already exists
        const { data: existing } = await supabase
          .from('canonical_vehicles')
          .select('id')
          .eq('vin', vin)
          .single()
        
        let canonicalId: string
        
        if (existing) {
          canonicalId = existing.id
          console.log(`  ✓ Using existing canonical vehicle for VIN: ${vin}`)
        } else {
          // Create canonical vehicle
          const { data: canonical, error: canonicalError } = await supabase
            .from('canonical_vehicles')
            .insert({
              vin,
              year: firstVehicle.year || new Date().getFullYear(),
              make: firstVehicle.make || 'Unknown',
              model: firstVehicle.model || 'Unknown',
              trim: firstVehicle.trim,
              display_name: `${firstVehicle.year || ''} ${firstVehicle.make || ''} ${firstVehicle.model || ''}`.trim() || 'Unknown Vehicle',
              body_type: firstVehicle.body_type,
              engine: firstVehicle.engine,
              transmission: firstVehicle.transmission,
              drive_type: firstVehicle.drive_type,
              fuel_type: firstVehicle.fuel_type,
              total_owners: vehicles.length,
              first_registered_at: firstVehicle.created_at,
              created_at: firstVehicle.created_at
            })
            .select('id')
            .single()
          
          if (canonicalError) {
            console.error(`  ✗ Error creating canonical vehicle for VIN ${vin}:`, canonicalError.message)
            errorCount++
            continue
          }
          
          canonicalId = canonical.id
          console.log(`  ✓ Created canonical vehicle for VIN: ${vin}`)
        }
        
        // Migrate each user vehicle instance
        for (const vehicle of vehicles) {
          try {
            // Create user vehicle
            const { data: userVehicle, error: userVehicleError } = await supabase
              .from('user_vehicles')
              .insert({
                canonical_vehicle_id: canonicalId,
                tenant_id: vehicle.tenant_id,
                user_id: vehicle.user_id || 'unknown',
                nickname: vehicle.nickname,
                color: vehicle.color,
                license_plate: vehicle.license_plate,
                purchase_date: vehicle.purchase_date,
                purchase_price: vehicle.purchase_price,
                current_mileage: vehicle.current_mileage,
                status: 'active',
                ownership_start_date: vehicle.created_at,
                created_at: vehicle.created_at,
                updated_at: vehicle.updated_at || vehicle.created_at
              })
              .select('id')
              .single()
            
            if (userVehicleError) {
              console.error(`    ✗ Error creating user vehicle:`, userVehicleError.message)
              errorCount++
              continue
            }
            
            // Create ownership history
            await supabase
              .from('vehicle_ownership_history')
              .insert({
                canonical_vehicle_id: canonicalId,
                tenant_id: vehicle.tenant_id,
                user_id: vehicle.user_id || 'unknown',
                user_vehicle_id: userVehicle.id,
                started_at: vehicle.created_at,
                starting_mileage: vehicle.current_mileage,
                transfer_type: 'unknown',
                created_at: vehicle.created_at
              })
            
            migratedCount++
            console.log(`    ✓ Migrated user vehicle (tenant: ${vehicle.tenant_id})`)
            
          } catch (error: any) {
            console.error(`    ✗ Error migrating user vehicle:`, error.message)
            errorCount++
          }
        }
        
      } catch (error: any) {
        console.error(`  ✗ Error processing VIN ${vin}:`, error.message)
        errorCount++
      }
    }
    
    // Step 4: Migrate vehicles without VINs
    console.log('\nStep 4: Migrating vehicles without VINs...')
    
    for (const vehicle of vehiclesWithoutVIN) {
      try {
        // Create placeholder VIN
        const placeholderVIN = `MANUAL-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
        
        // Create canonical vehicle
        const { data: canonical, error: canonicalError } = await supabase
          .from('canonical_vehicles')
          .insert({
            vin: placeholderVIN,
            year: vehicle.year || new Date().getFullYear(),
            make: vehicle.make || 'Unknown',
            model: vehicle.model || 'Unknown',
            trim: vehicle.trim,
            display_name: `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle',
            created_at: vehicle.created_at
          })
          .select('id')
          .single()
        
        if (canonicalError) {
          console.error(`  ✗ Error creating canonical vehicle:`, canonicalError.message)
          errorCount++
          continue
        }
        
        // Create user vehicle
        const { data: userVehicle, error: userVehicleError } = await supabase
          .from('user_vehicles')
          .insert({
            canonical_vehicle_id: canonical.id,
            tenant_id: vehicle.tenant_id,
            user_id: vehicle.user_id || 'unknown',
            nickname: vehicle.nickname,
            color: vehicle.color,
            license_plate: vehicle.license_plate,
            purchase_date: vehicle.purchase_date,
            purchase_price: vehicle.purchase_price,
            current_mileage: vehicle.current_mileage,
            status: 'active',
            created_at: vehicle.created_at
          })
          .select('id')
          .single()
        
        if (userVehicleError) {
          console.error(`  ✗ Error creating user vehicle:`, userVehicleError.message)
          errorCount++
          continue
        }
        
        // Create ownership history
        await supabase
          .from('vehicle_ownership_history')
          .insert({
            canonical_vehicle_id: canonical.id,
            tenant_id: vehicle.tenant_id,
            user_id: vehicle.user_id || 'unknown',
            user_vehicle_id: userVehicle.id,
            started_at: vehicle.created_at,
            starting_mileage: vehicle.current_mileage,
            created_at: vehicle.created_at
          })
        
        migratedCount++
        console.log(`  ✓ Migrated vehicle without VIN (tenant: ${vehicle.tenant_id})`)
        
      } catch (error: any) {
        console.error(`  ✗ Error migrating vehicle without VIN:`, error.message)
        errorCount++
      }
    }
    
    // Step 5: Verification
    console.log('\nStep 5: Verifying migration...')
    const { count: canonicalCount } = await supabase
      .from('canonical_vehicles')
      .select('*', { count: 'exact', head: true })
    
    const { count: userVehicleCount } = await supabase
      .from('user_vehicles')
      .select('*', { count: 'exact', head: true })
    
    const { count: historyCount } = await supabase
      .from('vehicle_ownership_history')
      .select('*', { count: 'exact', head: true })
    
    console.log(`  - Canonical vehicles: ${canonicalCount}`)
    console.log(`  - User vehicles: ${userVehicleCount}`)
    console.log(`  - Ownership history: ${historyCount}`)
    
    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(50))
    console.log(`Total vehicles in old table: ${oldVehicles.length}`)
    console.log(`Successfully migrated: ${migratedCount}`)
    console.log(`Errors: ${errorCount}`)
    console.log(`Canonical vehicles created: ${canonicalCount}`)
    console.log('='.repeat(50))
    
    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!')
      console.log('\n⚠️  IMPORTANT: Review the data before dropping the old "vehicles" table.')
      console.log('    To drop old table: DROP TABLE vehicles CASCADE;')
    } else {
      console.log(`\n⚠️  Migration completed with ${errorCount} errors. Review logs above.`)
    }
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run migration
migrateVehicles()
