/**
 * Test Normalized Data
 * 
 * Shows the power of clean, typed, normalized data
 */

import { VehicleDataNormalizer } from '../lib/vin/normalizer'

async function testNormalized(vin: string) {
  console.log('💎 NORMALIZED DATA TEST\n')
  console.log('='.repeat(80))
  console.log(`VIN: ${vin}\n`)
  
  // Fetch raw NHTSA data
  const response = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
  )
  const data = await response.json()
  const raw = data.Results[0]
  
  // Normalize it
  const normalized = VehicleDataNormalizer.normalize(raw)
  
  console.log('📊 NORMALIZATION RESULTS:\n')
  console.log('='.repeat(80))
  console.log(`Vehicle: ${normalized.year} ${normalized.make} ${normalized.model}`)
  console.log(`Data Quality: ${normalized.normalization.dataQuality.completeness}%`)
  console.log(`Safety Features: ${normalized.normalization.dataQuality.safetyFeaturesPopulated}`)
  console.log(`Performance Fields: ${normalized.normalization.dataQuality.performanceFieldsPopulated}`)
  
  // Safety Features
  console.log('\n🛡️  SAFETY FEATURES (Clean & Typed!):')
  console.log('='.repeat(80))
  console.log(`Adaptive Cruise Control: ${normalized.safety.adaptiveCruiseControl}`)
  console.log(`Backup Camera: ${normalized.safety.backupCamera}`)
  console.log(`Blind Spot Monitoring: ${normalized.safety.blindSpotMonitoring}`)
  console.log(`Forward Collision Warning: ${normalized.safety.forwardCollisionWarning}`)
  console.log(`Lane Departure Warning: ${normalized.safety.laneDepartureWarning}`)
  console.log(`Lane Centering Assist: ${normalized.safety.laneCenteringAssist}`)
  console.log(`Rear Cross Traffic Alert: ${normalized.safety.rearCrossTrafficAlert}`)
  console.log(`ABS: ${normalized.safety.abs}`)
  console.log(`ESC: ${normalized.safety.electronicStabilityControl}`)
  console.log(`Traction Control: ${normalized.safety.tractionControl}`)
  console.log(`TPMS: ${normalized.safety.tpms}`)
  console.log(`Air Bags - Front: ${normalized.safety.airBags.front}`)
  console.log(`Air Bags - Side: ${normalized.safety.airBags.side}`)
  console.log(`Air Bags - Curtain: ${normalized.safety.airBags.curtain}`)
  console.log(`Air Bags - Knee: ${normalized.safety.airBags.knee}`)
  console.log(`Headlamp Source: ${normalized.safety.headlampLightSource || 'unknown'}`)
  console.log(`Daytime Running Lights: ${normalized.safety.daytimeRunningLights}`)
  console.log(`Keyless Ignition: ${normalized.safety.keylessIgnition}`)
  console.log(`SAE Automation Level: ${normalized.safety.saeAutomationLevel || 'none'}`)
  
  // Performance
  console.log('\n⚡ PERFORMANCE (Numbers & Types!):')
  console.log('='.repeat(80))
  console.log(`Engine Cylinders: ${normalized.performance.engine.cylinders || 'unknown'}`)
  console.log(`Displacement: ${normalized.performance.engine.displacement.liters}L / ${normalized.performance.engine.displacement.cc}cc`)
  console.log(`Engine Model: ${normalized.performance.engine.model || 'unknown'}`)
  console.log(`Horsepower: ${normalized.performance.engine.horsepower || 'unknown'} HP`)
  console.log(`Turbo: ${normalized.performance.engine.turbo}`)
  console.log(`Top Speed: ${normalized.performance.engine.topSpeedMph || 'unknown'} mph`)
  console.log(`Drive Type: ${normalized.performance.drivetrain.type}`)
  console.log(`Transmission: ${normalized.performance.drivetrain.transmission || 'unknown'}`)
  console.log(`Transmission Speeds: ${normalized.performance.drivetrain.transmissionSpeeds || 'unknown'}`)
  
  // Dimensions
  console.log('\n📏 DIMENSIONS (Numbers!):')
  console.log('='.repeat(80))
  console.log(`Doors: ${normalized.performance.dimensions.doors}`)
  console.log(`Seats: ${normalized.performance.dimensions.seats}`)
  console.log(`Seat Rows: ${normalized.performance.dimensions.seatRows}`)
  console.log(`Curb Weight: ${normalized.performance.dimensions.curbWeightLbs || 'unknown'} lbs`)
  console.log(`GVWR: ${normalized.performance.dimensions.gvwrLbs || 'unknown'} lbs`)
  console.log(`Wheelbase: ${normalized.performance.dimensions.wheelbaseInches || 'unknown'} inches`)
  
  // Fuel
  console.log('\n⛽ FUEL:')
  console.log('='.repeat(80))
  console.log(`Primary: ${normalized.performance.fuel.primaryType || 'unknown'}`)
  console.log(`Secondary: ${normalized.performance.fuel.secondaryType || 'none'}`)
  
  // EV (if applicable)
  if (normalized.electric.isEV || normalized.electric.isHybrid) {
    console.log('\n🔋 ELECTRIC VEHICLE:')
    console.log('='.repeat(80))
    console.log(`Type: ${normalized.electric.electrificationLevel}`)
    console.log(`Is EV: ${normalized.electric.isEV}`)
    console.log(`Is Hybrid: ${normalized.electric.isHybrid}`)
    console.log(`Is Plugin Hybrid: ${normalized.electric.isPluginHybrid}`)
    console.log(`Battery: ${normalized.electric.battery.kwhFrom || 'unknown'} kWh`)
    console.log(`Charger Level: ${normalized.electric.charging.level || 'unknown'}`)
    console.log(`Charger Power: ${normalized.electric.charging.powerKw || 'unknown'} kW`)
  }
  
  // Truck (if applicable)
  if (normalized.truck.isTruck) {
    console.log('\n🚚 TRUCK FEATURES:')
    console.log('='.repeat(80))
    console.log(`Bed Type: ${normalized.truck.bed.type || 'unknown'}`)
    console.log(`Bed Length: ${normalized.truck.bed.lengthInches || 'unknown'} inches`)
    console.log(`Cab Type: ${normalized.truck.cab.type || 'unknown'}`)
    console.log(`Axles: ${normalized.truck.axles.count || 'unknown'}`)
  }
  
  // Manufacturing
  console.log('\n🏭 MANUFACTURING:')
  console.log('='.repeat(80))
  console.log(`Manufacturer: ${normalized.manufacturing.manufacturer}`)
  console.log(`Plant: ${normalized.manufacturing.plant.location || 'unknown'}`)
  console.log(`Base Price: $${normalized.manufacturing.basePrice || 'unknown'}`)
  
  // Type-safe queries!
  console.log('\n✅ TYPE-SAFE QUERIES:')
  console.log('='.repeat(80))
  
  // Example 1: Has backup camera?
  const hasBackupCamera = normalized.safety.backupCamera === 'standard'
  console.log(`Has backup camera? ${hasBackupCamera ? 'YES ✓' : 'NO ✗'}`)
  
  // Example 2: Has adaptive cruise?
  const hasACC = normalized.safety.adaptiveCruiseControl !== 'not_available'
  console.log(`Has adaptive cruise? ${hasACC ? 'YES ✓' : 'NO ✗'}`)
  
  // Example 3: Is 4WD?
  const is4WD = normalized.performance.drivetrain.type === '4wd'
  console.log(`Is 4WD? ${is4WD ? 'YES ✓' : 'NO ✗'}`)
  
  // Example 4: Has turbo?
  const hasTurbo = normalized.performance.engine.turbo === 'yes'
  console.log(`Has turbo? ${hasTurbo ? 'YES ✓' : 'NO ✗'}`)
  
  // Example 5: TPMS type
  console.log(`TPMS Type: ${normalized.safety.tpms} ${normalized.safety.tpms === 'direct' ? '✓' : ''}`)
  
  console.log('\n='.repeat(80))
  console.log('💎 NORMALIZED DATA COMPLETE!')
  console.log('✅ Clean, typed, queryable!')
  console.log('✅ No more messy strings!')
  console.log('✅ Type-safe comparisons!')
  console.log('✅ Ready for powerful features!')
  console.log('='.repeat(80))
}

// Run test
const vin = process.argv[2] || '1GCUYDED5MZ123456'
testNormalized(vin).catch(console.error)
