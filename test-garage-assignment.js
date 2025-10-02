#!/usr/bin/env node

// Test script to verify garage assignment functionality
// Run with: node test-garage-assignment.js

const BASE_URL = 'http://localhost:3005'

async function testGarageAssignment() {
  console.log('🧪 Testing Garage Assignment System...\n')

  try {
    // 1. Test fetching garages
    console.log('1️⃣ Testing garage API...')
    const garagesResponse = await fetch(`${BASE_URL}/api/garages`)
    const garagesData = await garagesResponse.json()
    console.log(`   ✅ Found ${garagesData.garages?.length || 0} garages`)
    
    if (!garagesData.garages || garagesData.garages.length === 0) {
      console.log('   ⚠️  No garages found - create some garages first')
      return
    }

    // 2. Test fetching vehicles
    console.log('\n2️⃣ Testing vehicles API...')
    const vehiclesResponse = await fetch(`${BASE_URL}/api/vehicles`)
    const vehiclesData = await vehiclesResponse.json()
    const vehicles = vehiclesData.data?.vehicles || vehiclesData.vehicles || []
    console.log(`   ✅ Found ${vehicles.length} vehicles`)
    
    if (vehicles.length === 0) {
      console.log('   ⚠️  No vehicles found - add some vehicles first')
      return
    }

    // 3. Test vehicle-garage relationships
    console.log('\n3️⃣ Testing vehicle-garage relationships...')
    const vehiclesWithGarages = vehicles.filter(v => v.garage_id)
    const vehiclesWithoutGarages = vehicles.filter(v => !v.garage_id)
    
    console.log(`   ✅ ${vehiclesWithGarages.length} vehicles assigned to garages`)
    console.log(`   ✅ ${vehiclesWithoutGarages.length} vehicles not assigned`)

    // 4. Test garage vehicle counts
    console.log('\n4️⃣ Testing garage vehicle counts...')
    for (const garage of garagesData.garages) {
      const vehicleCount = vehicles.filter(v => v.garage_id === garage.id).length
      const apiCount = garage.vehicleCount || 0
      
      if (vehicleCount === apiCount) {
        console.log(`   ✅ ${garage.name}: ${vehicleCount} vehicles (API matches)`)
      } else {
        console.log(`   ❌ ${garage.name}: Expected ${vehicleCount}, API returned ${apiCount}`)
      }
    }

    // 5. Test moving a vehicle (if we have vehicles and multiple garages)
    if (vehicles.length > 0 && garagesData.garages.length > 1) {
      console.log('\n5️⃣ Testing vehicle move...')
      const testVehicle = vehicles[0]
      const currentGarageId = testVehicle.garage_id
      const targetGarage = garagesData.garages.find(g => g.id !== currentGarageId)
      
      if (targetGarage) {
        console.log(`   🚗 Moving vehicle ${testVehicle.id} to ${targetGarage.name}...`)
        
        const moveResponse = await fetch(`${BASE_URL}/api/vehicles/${testVehicle.id}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ garageId: targetGarage.id })
        })
        
        if (moveResponse.ok) {
          const moveData = await moveResponse.json()
          console.log(`   ✅ Move successful: ${moveData.message}`)
          
          // Verify the move by fetching updated data
          const updatedVehicleResponse = await fetch(`${BASE_URL}/api/vehicles/${testVehicle.id}`)
          if (updatedVehicleResponse.ok) {
            const updatedVehicleData = await updatedVehicleResponse.json()
            const updatedVehicle = updatedVehicleData.vehicle
            
            if (updatedVehicle.garage_id === targetGarage.id) {
              console.log(`   ✅ Vehicle successfully moved to ${targetGarage.name}`)
            } else {
              console.log(`   ❌ Vehicle move failed - still at ${updatedVehicle.garage_id}`)
            }
          }
          
          // Move it back to original garage
          if (currentGarageId) {
            await fetch(`${BASE_URL}/api/vehicles/${testVehicle.id}/move`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ garageId: currentGarageId })
            })
            console.log(`   🔄 Moved vehicle back to original garage`)
          }
        } else {
          const error = await moveResponse.json()
          console.log(`   ❌ Move failed: ${error.error}`)
        }
      }
    }

    // 6. Test garage detail API
    console.log('\n6️⃣ Testing garage detail API...')
    const firstGarage = garagesData.garages[0]
    const garageDetailResponse = await fetch(`${BASE_URL}/api/garages/${firstGarage.id}`)
    
    if (garageDetailResponse.ok) {
      const garageDetail = await garageDetailResponse.json()
      const garageVehicles = garageDetail.garage.vehicles || []
      console.log(`   ✅ Garage "${firstGarage.name}" has ${garageVehicles.length} vehicles in detail view`)
    } else {
      console.log(`   ❌ Failed to fetch garage details`)
    }

    console.log('\n🎉 Garage assignment system test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testGarageAssignment()
