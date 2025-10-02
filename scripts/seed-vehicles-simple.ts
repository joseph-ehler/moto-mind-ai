// MotoMind: Simple Vehicle Seeder
// Creates sample vehicles for testing the Roman notification system

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Load environment variables
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

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'

async function seedVehiclesAndGarages() {
  console.log('🏠 Creating sample garages and vehicles...')

  try {
    // First, ensure we have a tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', TENANT_ID)
      .single()

    if (tenantError || !tenant) {
      console.log('📝 Creating demo tenant...')
      const { error: createTenantError } = await supabase
        .from('tenants')
        .insert({
          id: TENANT_ID,
          name: 'Demo User',
          kind: 'solo',
          plan_name: 'free'
        })

      if (createTenantError) {
        console.error('❌ Failed to create tenant:', createTenantError)
        return
      }
    }

    // Create a default garage
    console.log('🏠 Creating default garage...')
    const garageId = uuidv4()
    const { error: garageError } = await supabase
      .from('garages')
      .insert({
        id: garageId,
        tenant_id: TENANT_ID,
        name: 'My Garage',
        address: '123 Main St, Anytown, FL 32000',
        lat: 29.6516,
        lng: -82.3248,
        timezone: 'America/New_York',
        is_default: true
      })

    if (garageError) {
      console.error('❌ Failed to create garage:', garageError)
      return
    }

    // Create sample vehicles
    const sampleVehicles = [
      {
        id: uuidv4(),
        tenant_id: TENANT_ID,
        garage_id: garageId,
        vin: '1HGBH41JXMN109186',
        label: 'Daily Driver',
        make: 'Honda',
        model: 'Civic',
        baseline_fuel_mpg: 32.0,
        baseline_service_interval_miles: 5000,
        notes: '2018 Honda Civic LX - reliable daily driver',
        hero_image_url: null,
        enrichment: {},
        smart_defaults: {}
      },
      {
        id: uuidv4(),
        tenant_id: TENANT_ID,
        garage_id: garageId,
        vin: '1FTFW1ET5DFC10312',
        label: 'Work Truck',
        make: 'Ford',
        model: 'F-150',
        baseline_fuel_mpg: 22.0,
        baseline_service_interval_miles: 7500,
        notes: '2020 Ford F-150 XLT - work truck',
        hero_image_url: null,
        enrichment: {},
        smart_defaults: {}
      },
      {
        id: uuidv4(),
        tenant_id: TENANT_ID,
        garage_id: garageId,
        vin: '5YJ3E1EA4KF123456',
        label: '2019 Tesla Model 3',
        make: 'Tesla',
        model: 'Model 3',
        baseline_fuel_mpg: null, // Electric vehicle
        baseline_service_interval_miles: 12500,
        notes: '2019 Tesla Model 3 Standard Range Plus',
        hero_image_url: null,
        enrichment: {},
        smart_defaults: {}
      }
    ]

    console.log('🚗 Creating sample vehicles...')
    for (const vehicle of sampleVehicles) {
      const displayName = vehicle.display_name
      console.log(`  📝 Creating: ${displayName}`)
      
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert(vehicle)

      if (vehicleError) {
        console.error(`❌ Failed to create ${displayName}:`, vehicleError)
      } else {
        console.log(`✅ Created: ${displayName}`)
      }
    }

    console.log('\n🎉 Sample vehicles created successfully!')
    console.log('🔄 Now run the reminders script: npx tsx scripts/create-sample-reminders.ts')

  } catch (error) {
    console.error('❌ Error seeding vehicles:', error)
  }
}

seedVehiclesAndGarages()
