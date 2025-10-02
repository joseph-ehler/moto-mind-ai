// Test the delete dialog display logic
function testDeleteDialogDisplay() {
  console.log('🧪 TESTING DELETE DIALOG DISPLAY LOGIC')
  console.log('=' .repeat(50))
  
  // Test vehicles with different scenarios
  const testVehicles = [
    {
      id: '1',
      year: 2021,
      make: 'Chevrolet',
      model: 'Silverado',
      nickname: 'Test Truck',
      display_name: 'Test Truck'
    },
    {
      id: '2', 
      year: 2022,
      make: 'Ford',
      model: 'F-150',
      nickname: '',
      display_name: '2022 Ford F-150'
    },
    {
      id: '3',
      year: 2023,
      make: 'Tesla', 
      model: 'Model 3',
      nickname: null,
      display_name: null
    }
  ]
  
  testVehicles.forEach((vehicle, index) => {
    console.log(`\n🚗 Test Vehicle ${index + 1}:`)
    console.log(`   ${vehicle.year} ${vehicle.make} ${vehicle.model}`)
    console.log(`   Nickname: "${vehicle.nickname || 'None'}"`)
    console.log(`   Display Name: "${vehicle.display_name || 'None'}"`)
    
    // Apply the same logic as the DeleteVehicleDialog
    let displayName
    if (vehicle.nickname && vehicle.nickname.trim()) {
      displayName = `${vehicle.nickname} (${vehicle.year} ${vehicle.make} ${vehicle.model})`
    } else if (vehicle.display_name && vehicle.display_name.trim()) {
      displayName = vehicle.display_name
    } else {
      displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    
    console.log(`   🏷️  Dialog Shows: "${displayName}"`)
  })
  
  console.log('\n✅ EXPECTED BEHAVIOR:')
  console.log('• Chevrolet Silverado: "Test Truck (2021 Chevrolet Silverado)"')
  console.log('• Ford F-150: "2022 Ford F-150" (uses display_name)')  
  console.log('• Tesla Model 3: "2023 Tesla Model 3" (fallback)')
  
  console.log('\n📋 The "Test Truck" display is CORRECT because:')
  console.log('• The Silverado actually has "Test Truck" as its nickname')
  console.log('• The updated dialog now shows nickname + vehicle details')
  console.log('• This provides better context for users')
}

testDeleteDialogDisplay()
