/**
 * NHTSA Extraction Comparison
 * 
 * Compares what we COULD extract vs what we DO extract
 */

// Fields we currently extract (from lib/vin/decoder.ts)
// UPDATED: Oct 19, 2025 - Now extracting 100+ fields!
const FIELDS_WE_EXTRACT = [
  // Basic Info (8)
  'Model Year',
  'Make',
  'Model',
  'Trim',
  'Trim2',
  'Series',
  'Series2',
  'Body Class',
  
  // Engine & Performance (19)
  'Engine Model',
  'Engine Number of Cylinders',
  'Displacement (L)',
  'Displacement (CC)',
  'Displacement (CI)',
  'Engine Brake (hp) From',
  'Engine Brake (hp) To',
  'Engine Power (kW)',
  'Engine Configuration',
  'Valve Train Design',
  'Cooling Type',
  'Fuel Delivery / Fuel Injection Type',
  'Turbo',
  'Top Speed (MPH)',
  'Engine Manufacturer',
  
  // Transmission & Drive (3)
  'Transmission Style',
  'Transmission Speeds',
  'Drive Type',
  
  // Fuel & Electrification (3)
  'Fuel Type - Primary',
  'Fuel Type - Secondary',
  'Electrification Level',
  
  // Safety Features (30+)
  'Anti-lock Braking System (ABS)',
  'Front Air Bag Locations',
  'Side Air Bag Locations',
  'Curtain Air Bag Locations',
  'Knee Air Bag Locations',
  'Electronic Stability Control (ESC)',
  'Traction Control',
  'Blind Spot Warning (BSW)',
  'Forward Collision Warning (FCW)',
  'Lane Departure Warning (LDW)',
  'Lane Keeping Assistance (LKA)',
  'Lane Centering Assistance',
  'Parking Assist',
  'Backup Camera',
  'Adaptive Cruise Control (ACC)',
  'Brake System Type',
  'Tire Pressure Monitoring System (TPMS) Type',
  'Auto-Reverse System for Windows and Sunroofs',
  'Keyless Ignition',
  'Blind Spot Intervention (BSI)',
  'Rear Cross Traffic Alert',
  'Pedestrian Automatic Emergency Braking (PAEB)',
  'Dynamic Brake Support (DBS)',
  'Crash Imminent Braking (CIB)',
  'Rear Automatic Emergency Braking',
  'Event Data Recorder (EDR)',
  'SAE Automation Level From',
  'Automatic Crash Notification (ACN) / Advanced Automatic Crash Notification (AACN)',
  'Daytime Running Light (DRL)',
  'Headlamp Light Source',
  'Adaptive Driving Beam (ADB)',
  'Pretensioner',
  'Seat Belt Type',
  
  // Convenience (3)
  'Entertainment System',
  'Steering Location',
  
  // Dimensions & Weight (14)
  'Doors',
  'Windows',
  'Number of Seats',
  'Number of Seat Rows',
  'Wheel Base (inches) From',
  'Wheel Base Type',
  'Track Width (inches)',
  'Gross Vehicle Weight Rating From',
  'Gross Vehicle Weight Rating To',
  'Gross Combination Weight Rating From',
  'Curb Weight (pounds)',
  'Wheel Size Front (inches)',
  'Wheel Size Rear (inches)',
  'Number of Wheels',
  
  // Manufacturing (6)
  'Plant Country',
  'Plant City',
  'Plant State',
  'Plant Company Name',
  'Manufacturer Name',
  'Base Price ($)',
  
  // EV/Hybrid (13 - conditional)
  'Battery Type',
  'Battery Energy (kWh) From',
  'Battery Energy (kWh) To',
  'Battery Voltage (Volts) From',
  'Battery Voltage (Volts) To',
  'Battery Current (Amps) From',
  'Battery Current (Amps) To',
  'Charger Level',
  'Charger Power (kW)',
  'EV Drive Unit',
  'Number of Battery Modules per Pack',
  'Number of Battery Packs per Vehicle',
  
  // Truck Specific (5 - conditional)
  'Bed Type',
  'Bed Length (inches)',
  'Cab Type',
  'Axles',
  'Axle Configuration',
]

async function compareExtraction(vin: string) {
  console.log(`\n🔬 NHTSA Extraction Analysis for VIN: ${vin}\n`)
  console.log('='.repeat(80))
  
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`
    )
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }
    
    const data = await response.json()
    const allFields = data.Results
    
    // Fields with actual data
    const fieldsWithData = allFields.filter((r: any) => 
      r.Value && r.Value.trim() !== '' && r.Value !== 'Not Applicable'
    )
    
    console.log(`\n📊 OVERVIEW`)
    console.log('='.repeat(80))
    console.log(`Total NHTSA Fields: ${allFields.length}`)
    console.log(`Fields with Data: ${fieldsWithData.length}`)
    console.log(`Fields we Extract: ${FIELDS_WE_EXTRACT.length}`)
    
    // Check which fields we extract
    const extractedFields = fieldsWithData.filter((r: any) => 
      FIELDS_WE_EXTRACT.includes(r.Variable)
    )
    
    // Fields we DON'T extract but have data
    const missedFields = fieldsWithData.filter((r: any) => 
      !FIELDS_WE_EXTRACT.includes(r.Variable)
    )
    
    console.log(`\n✅ Fields we Extract WITH data: ${extractedFields.length}`)
    console.log(`❌ Fields we MISS that have data: ${missedFields.length}`)
    
    const extractionRate = Math.round((extractedFields.length / fieldsWithData.length) * 100)
    console.log(`\n📈 Extraction Rate: ${extractionRate}%`)
    
    // Show what we're extracting
    console.log(`\n${'='.repeat(80)}`)
    console.log('✅ FIELDS WE SUCCESSFULLY EXTRACT')
    console.log('='.repeat(80))
    extractedFields.forEach((field: any) => {
      console.log(`  ✓ ${field.Variable}: "${field.Value}"`)
    })
    
    // Show what we're missing
    if (missedFields.length > 0) {
      console.log(`\n${'='.repeat(80)}`)
      console.log('❌ FIELDS WE\'RE MISSING (that have data!)')
      console.log('='.repeat(80))
      
      // Categorize missed fields
      const highValue = missedFields.filter((r: any) => {
        const v = r.Variable.toLowerCase()
        return v.includes('entertainment') || v.includes('camera') || 
               v.includes('adaptive') || v.includes('cruise') ||
               v.includes('pedestrian') || v.includes('automatic') ||
               v.includes('parking') || v.includes('keyless') ||
               v.includes('battery') || v.includes('electric') ||
               v.includes('charging') || v.includes('range') ||
               v.includes('torque') || v.includes('turbo') ||
               v.includes('valve') || v.includes('axle') ||
               v.includes('towing') || v.includes('payload') ||
               v.includes('bed') || v.includes('cargo')
      })
      
      const mediumValue = missedFields.filter((r: any) => {
        const v = r.Variable.toLowerCase()
        return !highValue.includes(r) && (
          v.includes('wheel') || v.includes('tire') ||
          v.includes('brake') || v.includes('steering') ||
          v.includes('suspension') || v.includes('spring') ||
          v.includes('track') || v.includes('curb') ||
          v.includes('roof') || v.includes('ground')
        )
      })
      
      const lowValue = missedFields.filter((r: any) => 
        !highValue.includes(r) && !mediumValue.includes(r)
      )
      
      if (highValue.length > 0) {
        console.log(`\n🔥 HIGH VALUE (${highValue.length}):`)
        highValue.forEach((field: any) => {
          console.log(`  💎 ${field.Variable}: "${field.Value}"`)
        })
      }
      
      if (mediumValue.length > 0) {
        console.log(`\n⚠️  MEDIUM VALUE (${mediumValue.length}):`)
        mediumValue.forEach((field: any) => {
          console.log(`  📊 ${field.Variable}: "${field.Value}"`)
        })
      }
      
      if (lowValue.length > 0) {
        console.log(`\n📝 LOW VALUE (${lowValue.length}):`)
        if (lowValue.length <= 10) {
          lowValue.forEach((field: any) => {
            console.log(`  • ${field.Variable}: "${field.Value}"`)
          })
        } else {
          console.log(`  (${lowValue.length} fields - mostly metadata)`)
        }
      }
    }
    
    // Recommendations
    console.log(`\n${'='.repeat(80)}`)
    console.log('💡 RECOMMENDATIONS')
    console.log('='.repeat(80))
    
    if (extractionRate >= 90) {
      console.log('  ✅ Excellent! We\'re capturing 90%+ of available data.')
    } else if (extractionRate >= 75) {
      console.log('  ⚠️  Good, but we could capture more valuable fields.')
    } else {
      console.log('  ❌ We\'re missing significant data!')
    }
    
    if (highValue.length > 0) {
      console.log(`  💎 Add ${highValue.length} high-value fields to improve quality`)
    }
    if (mediumValue.length > 0) {
      console.log(`  📊 Consider adding ${mediumValue.length} medium-value fields`)
    }
    
    console.log(`\n${'='.repeat(80)}\n`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  const vin = process.argv[2] || '1GCUYDED5MZ123456'
  compareExtraction(vin)
}

export { compareExtraction }
