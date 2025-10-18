/**
 * Test VIN Decoder
 * Quick script to test VIN decoding functionality
 */

// Load environment variables FIRST (before any imports)
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

// Now import decoder (which needs env vars)
import { decodeVIN } from '../lib/vin'

// Test VINs (real examples)
const TEST_VINS = [
  '1HGBH41JXMN109186', // 2019 Honda Civic
  '1FTFW1ET5BFC10312', // 2011 Ford F-150
  '5YJSA1E14HF123456', // 2017 Tesla Model S (example)
  'WVWZZZ1JZYW123456', // 2000 VW Jetta (example)
]

async function testVINDecoder() {
  console.log('🚀 Testing VIN Decoder\n')

  for (const vin of TEST_VINS) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing VIN: ${vin}`)
    console.log('='.repeat(60))

    try {
      const result = await decodeVIN(vin)

      console.log('\n✅ SUCCESS!')
      console.log('\nVehicle:')
      console.log(`  Display Name: ${result.vehicle.displayName}`)
      console.log(`  Year: ${result.vehicle.year}`)
      console.log(`  Make: ${result.vehicle.make}`)
      console.log(`  Model: ${result.vehicle.model}`)
      console.log(`  Trim: ${result.vehicle.trim || 'N/A'}`)

      console.log('\nSpecs:')
      console.log(`  Body Type: ${result.specs.bodyType || 'N/A'}`)
      console.log(`  Engine: ${result.specs.engine || 'N/A'}`)
      console.log(`  Transmission: ${result.specs.transmission || 'N/A'}`)
      console.log(`  Drive Type: ${result.specs.driveType || 'N/A'}`)
      console.log(`  Fuel Type: ${result.specs.fuelType || 'N/A'}`)
      
      // Show extended data if available
      if ((result as any).extendedSpecs) {
        const ext = (result as any).extendedSpecs
        console.log('\n🔥 Extended Data (NEW!):')
        if (ext.engineCylinders) console.log(`  Engine Cylinders: ${ext.engineCylinders}`)
        if (ext.engineDisplacement) console.log(`  Engine Displacement: ${ext.engineDisplacement}L`)
        if (ext.engineHP) console.log(`  Horsepower: ${ext.engineHP} HP`)
        if (ext.transmissionSpeeds) console.log(`  Transmission Speeds: ${ext.transmissionSpeeds}`)
        if (ext.doors) console.log(`  Doors: ${ext.doors}`)
        if (ext.seats) console.log(`  Seat Rows: ${ext.seats}`)
        if (ext.wheelbase) console.log(`  Wheelbase: ${ext.wheelbase}"`)
        
        console.log('\n🛡️ Safety Features:')
        if (ext.absType) console.log(`  ABS: ${ext.absType}`)
        if (ext.electronicStabilityControl) console.log(`  ESC: ${ext.electronicStabilityControl}`)
        if (ext.tractionControl) console.log(`  Traction Control: ${ext.tractionControl}`)
        if (ext.airBagLocations) console.log(`  Airbags: ${ext.airBagLocations}`)
        if (ext.blindSpotWarning) console.log(`  Blind Spot Warning: ${ext.blindSpotWarning}`)
        if (ext.forwardCollisionWarning) console.log(`  Forward Collision: ${ext.forwardCollisionWarning}`)
        if (ext.laneDepartureWarning) console.log(`  Lane Departure: ${ext.laneDepartureWarning}`)
        if (ext.rearVisibilitySystem) console.log(`  Backup Camera: ${ext.rearVisibilitySystem}`)
        
        console.log('\n🏭 Manufacturing:')
        if (ext.manufacturer) console.log(`  Manufacturer: ${ext.manufacturer}`)
        if (ext.plantCity || ext.plantState) {
          console.log(`  Built in: ${ext.plantCity || ''}${ext.plantCity && ext.plantState ? ', ' : ''}${ext.plantState || ''}, ${ext.plantCountry || 'USA'}`)
        }
      }

      console.log('\nMock Data (estimates):')
      console.log(`  MPG: ${result.mockData.mpgCity} city / ${result.mockData.mpgHighway} hwy`)
      console.log(`  Service Interval: Every ${result.mockData.maintenanceInterval} miles`)
      console.log(`  Annual Cost: $${result.mockData.annualCost}`)

      console.log('\nAI Insights:')
      console.log(`  Reliability Score: ${(result.aiInsights.reliabilityScore * 100).toFixed(0)}%`)
      console.log(`  Summary: ${result.aiInsights.summary}`)
      console.log(`  Maintenance Tip: ${result.aiInsights.maintenanceTip}`)
      console.log(`  Cost Tip: ${result.aiInsights.costTip}`)

    } catch (error: any) {
      console.log('\n❌ ERROR!')
      console.log(`  Message: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 Test complete!')
  console.log('='.repeat(60) + '\n')
}

// Run tests
testVINDecoder().catch(console.error)
