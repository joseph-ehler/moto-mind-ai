/**
 * Quick EPA Test - Debug the model matcher
 */

import { EPAModelMatcher } from '../lib/epa/model-matcher'
import { getFuelEconomy } from '../lib/epa/fuel-economy'

async function quickTest() {
  console.log('🔍 Quick EPA Test\n')
  
  // Test 1: Model Matcher
  console.log('Step 1: Testing Model Matcher...')
  const matchedModel = await EPAModelMatcher.findBestMatch({
    year: 2021,
    make: 'Chevrolet',
    model: 'Silverado',
    driveType: '4wd',
    cylinders: 8,
    displacement: 5.3
  })
  
  console.log(`✅ Matched Model: "${matchedModel}"\n`)
  
  // Test 2: Full Integration
  console.log('Step 2: Testing Full Integration...')
  const result = await getFuelEconomy({
    year: 2021,
    make: 'Chevrolet',
    model: 'Silverado',
    driveType: '4wd',
    cylinders: 8,
    displacement: 5.3
  })
  
  if (result.success) {
    console.log('✅ SUCCESS!')
    console.log(`Match Quality: ${result.matchQuality}`)
    console.log(`City MPG: ${result.fuelEconomy?.cityMPG}`)
    console.log(`Highway MPG: ${result.fuelEconomy?.highwayMPG}`)
    console.log(`Combined MPG: ${result.fuelEconomy?.combinedMPG}`)
  } else {
    console.log('❌ FAILED!')
    console.log(`Error: ${result.error}`)
  }
}

quickTest().catch(console.error)
