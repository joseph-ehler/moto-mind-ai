// Debug vehicle names to see what's causing "Test Truck" to appear
async function debugVehicleNames() {
  console.log('🔍 DEBUGGING VEHICLE NAMES')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch('http://localhost:3005/api/vehicles')
    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      console.log('❌ No vehicles found')
      return
    }
    
    console.log(`📋 Found ${data.data.length} vehicles:\n`)
    
    data.data.forEach((vehicle, index) => {
      console.log(`🚗 Vehicle ${index + 1}:`)
      console.log(`   ID: ${vehicle.id}`)
      console.log(`   Year: ${vehicle.year}`)
      console.log(`   Make: ${vehicle.make}`)
      console.log(`   Model: ${vehicle.model}`)
      console.log(`   Nickname: ${vehicle.nickname || 'None'}`)
      console.log(`   Display Name: ${vehicle.display_name || 'None'}`)
      
      // Show what the delete dialog would display
      let displayName
      if (vehicle.nickname && vehicle.nickname.trim()) {
        displayName = `${vehicle.nickname} (${vehicle.year} ${vehicle.make} ${vehicle.model})`
      } else if (vehicle.display_name && vehicle.display_name.trim()) {
        displayName = vehicle.display_name
      } else {
        displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      }
      
      console.log(`   🏷️  Delete Dialog Would Show: "${displayName}"`)
      console.log()
    })
    
    // Check for "Test Truck" specifically
    const testTruckVehicle = data.data.find(v => 
      v.nickname === 'Test Truck' || 
      v.display_name === 'Test Truck' ||
      (v.nickname && v.nickname.includes('Test')) ||
      (v.display_name && v.display_name.includes('Test'))
    )
    
    if (testTruckVehicle) {
      console.log('🎯 FOUND "Test Truck" VEHICLE:')
      console.log('   This explains why the delete dialog shows "Test Truck"')
      console.log(`   Vehicle: ${testTruckVehicle.year} ${testTruckVehicle.make} ${testTruckVehicle.model}`)
      console.log(`   Nickname: ${testTruckVehicle.nickname}`)
      console.log(`   Display Name: ${testTruckVehicle.display_name}`)
    } else {
      console.log('❓ No vehicle with "Test Truck" found - this might be a data issue')
    }
    
  } catch (error) {
    console.error('❌ Error fetching vehicles:', error)
  }
}

debugVehicleNames().catch(console.error)
