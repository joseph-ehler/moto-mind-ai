// Test complete CRUD operations for vehicles
async function testCompleteCRUD() {
  console.log('🧪 TESTING COMPLETE VEHICLE CRUD OPERATIONS')
  console.log('=' .repeat(60))
  
  let vehicleId = null
  
  try {
    // CREATE - Test vehicle creation
    console.log('📝 Testing CREATE operation...')
    const createResponse = await fetch('http://localhost:3005/api/vehicles/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        vin: '4T1BF1FK5CU123456',
        current_mileage: 25000,
        nickname: 'Family Car'
      })
    })
    
    if (createResponse.ok) {
      const createData = await createResponse.json()
      vehicleId = createData.vehicle_id
      console.log('✅ CREATE successful')
      console.log(`   Vehicle ID: ${vehicleId}`)
      console.log(`   Display Name: ${createData.vehicle.display_name}`)
    } else {
      throw new Error(`CREATE failed: ${createResponse.status}`)
    }
    
    // READ - Test vehicle retrieval
    console.log('\n📖 Testing READ operation...')
    const readResponse = await fetch('http://localhost:3005/api/vehicles')
    
    if (readResponse.ok) {
      const readData = await readResponse.json()
      const ourVehicle = readData.data.find(v => v.id === vehicleId)
      
      if (ourVehicle) {
        console.log('✅ READ successful')
        console.log(`   Found vehicle: ${ourVehicle.display_name}`)
        console.log(`   Nickname: ${ourVehicle.nickname || 'None'}`)
      } else {
        throw new Error('Vehicle not found in listing')
      }
    } else {
      throw new Error(`READ failed: ${readResponse.status}`)
    }
    
    // UPDATE - Test vehicle modification
    console.log('\n✏️ Testing UPDATE operation...')
    const updateResponse = await fetch(`http://localhost:3005/api/vehicles/${vehicleId}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: 2021,
        make: 'Toyota',
        model: 'Camry',
        nickname: 'Updated Family Car',
        trim: 'LE'
      })
    })
    
    if (updateResponse.ok) {
      const updateData = await updateResponse.json()
      console.log('✅ UPDATE successful')
      console.log(`   Updated nickname: ${updateData.vehicle.nickname}`)
      console.log(`   Added trim: ${updateData.vehicle.trim}`)
    } else {
      const errorText = await updateResponse.text()
      throw new Error(`UPDATE failed: ${updateResponse.status} - ${errorText}`)
    }
    
    // Verify UPDATE by reading again
    console.log('\n🔍 Verifying UPDATE...')
    const verifyResponse = await fetch('http://localhost:3005/api/vehicles')
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json()
      const updatedVehicle = verifyData.data.find(v => v.id === vehicleId)
      
      if (updatedVehicle && updatedVehicle.nickname === 'Updated Family Car') {
        console.log('✅ UPDATE verification successful')
        console.log(`   Confirmed nickname: ${updatedVehicle.nickname}`)
      } else {
        throw new Error('UPDATE verification failed - changes not persisted')
      }
    }
    
    // DELETE - Test vehicle deletion
    console.log('\n🗑️ Testing DELETE operation...')
    const deleteResponse = await fetch(`http://localhost:3005/api/vehicles/${vehicleId}/delete`, {
      method: 'DELETE'
    })
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json()
      console.log('✅ DELETE successful')
      console.log(`   Message: ${deleteData.message}`)
    } else {
      const errorText = await deleteResponse.text()
      throw new Error(`DELETE failed: ${deleteResponse.status} - ${errorText}`)
    }
    
    // Verify DELETE by checking vehicle is gone
    console.log('\n🔍 Verifying DELETE...')
    const finalResponse = await fetch('http://localhost:3005/api/vehicles')
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json()
      const deletedVehicle = finalData.data.find(v => v.id === vehicleId)
      
      if (!deletedVehicle) {
        console.log('✅ DELETE verification successful')
        console.log('   Vehicle no longer appears in listing')
      } else {
        throw new Error('DELETE verification failed - vehicle still exists')
      }
    }
    
    console.log('\n🎉 COMPLETE CRUD TEST SUCCESSFUL!')
    console.log('✅ All CRUD operations working correctly')
    console.log('✅ Data persistence verified')
    console.log('✅ APIs ready for frontend integration')
    
    return true
    
  } catch (error) {
    console.log(`\n❌ CRUD TEST FAILED: ${error.message}`)
    
    // Cleanup - try to delete test vehicle if it was created
    if (vehicleId) {
      console.log('🧹 Cleaning up test vehicle...')
      try {
        await fetch(`http://localhost:3005/api/vehicles/${vehicleId}/delete`, {
          method: 'DELETE'
        })
        console.log('✅ Cleanup successful')
      } catch (cleanupError) {
        console.log('⚠️ Cleanup failed, test vehicle may still exist')
      }
    }
    
    return false
  }
}

// Run the test
testCompleteCRUD().catch(console.error)
