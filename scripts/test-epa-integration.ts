/**
 * Test EPA Integration
 * 
 * Tests the sequential menu navigation approach
 */

import { getFuelEconomy } from '../lib/epa/fuel-economy'

async function testEPAIntegration() {
  console.log('🧪 EPA INTEGRATION TEST\n')
  console.log('='.repeat(80))
  
  // Test with 2021 Silverado (our example)
  console.log('\n📊 Test 1: 2021 Chevrolet Silverado')
  console.log('='.repeat(80))
  
  const silverado = await getFuelEconomy({
    year: 2021,
    make: 'Chevrolet',
    model: 'Silverado',
    trim: 'LT',
    cylinders: 8,
    displacement: 5.3,
    driveType: '4wd'
  })
  
  if (silverado.success && silverado.fuelEconomy) {
    console.log('✅ Success!')
    console.log(`Match Quality: ${silverado.matchQuality}`)
    console.log(`\nFuel Economy:`)
    console.log(`  City: ${silverado.fuelEconomy.cityMPG} MPG`)
    console.log(`  Highway: ${silverado.fuelEconomy.highwayMPG} MPG`)
    console.log(`  Combined: ${silverado.fuelEconomy.combinedMPG} MPG`)
    console.log(`\nCosts:`)
    console.log(`  Annual Fuel Cost: $${silverado.fuelEconomy.annualFuelCost}`)
    console.log(`  Save/Spend vs Average: $${silverado.fuelEconomy.youSaveSpend}`)
    console.log(`  Barrels/Year: ${silverado.fuelEconomy.barrels}`)
    console.log(`\nEnvironmental:`)
    console.log(`  CO2 Emissions: ${silverado.fuelEconomy.co2Emissions} g/mi`)
    console.log(`  Fuel Type: ${silverado.fuelEconomy.fuelType}`)
  } else {
    console.log('❌ Failed!')
    console.log(`Error: ${silverado.error}`)
  }
  
  // Test with different vehicle
  console.log('\n\n📊 Test 2: 2022 Honda Civic')
  console.log('='.repeat(80))
  
  const civic = await getFuelEconomy({
    year: 2022,
    make: 'Honda',
    model: 'Civic',
    cylinders: 4,
    displacement: 1.5,
    driveType: 'fwd'
  })
  
  if (civic.success && civic.fuelEconomy) {
    console.log('✅ Success!')
    console.log(`Match Quality: ${civic.matchQuality}`)
    console.log(`\nFuel Economy:`)
    console.log(`  City: ${civic.fuelEconomy.cityMPG} MPG`)
    console.log(`  Highway: ${civic.fuelEconomy.highwayMPG} MPG`)
    console.log(`  Combined: ${civic.fuelEconomy.combinedMPG} MPG`)
    console.log(`\nAnnual Fuel Cost: $${civic.fuelEconomy.annualFuelCost}`)
  } else {
    console.log('❌ Failed!')
    console.log(`Error: ${civic.error}`)
  }
  
  // Test with Tesla (EV)
  console.log('\n\n📊 Test 3: 2023 Tesla Model 3')
  console.log('='.repeat(80))
  
  const tesla = await getFuelEconomy({
    year: 2023,
    make: 'Tesla',
    model: 'Model 3'
  })
  
  if (tesla.success && tesla.fuelEconomy) {
    console.log('✅ Success!')
    console.log(`Match Quality: ${tesla.matchQuality}`)
    console.log(`\nElectric Range: ${tesla.fuelEconomy.evRange || 'N/A'} miles`)
    console.log(`MPGe Combined: ${tesla.fuelEconomy.combinedMPG}`)
    console.log(`Annual Electricity Cost: $${tesla.fuelEconomy.annualFuelCost}`)
    console.log(`Save vs Gas: $${Math.abs(tesla.fuelEconomy.youSaveSpend)}`)
  } else {
    console.log('❌ Failed!')
    console.log(`Error: ${tesla.error}`)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🎉 EPA INTEGRATION TEST COMPLETE!')
  console.log('='.repeat(80))
}

// Run test
testEPAIntegration().catch(console.error)
