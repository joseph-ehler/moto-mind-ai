/**
 * GOD TIER EPA Test
 * Tests enhanced matching, complete data, and confidence scoring
 */

import { getEnhancedFuelEconomy } from '../lib/epa/enhanced-service'

async function testGodTierEPA() {
  console.log('🏆 GOD TIER EPA TEST\n')
  console.log('=' .repeat(80))
  
  // Test 1: 2021 Silverado (multiple engine options)
  console.log('\n📊 Test 1: 2021 Chevrolet Silverado 5.3L V8 4WD')
  console.log('=' .repeat(80))
  
  const result = await getEnhancedFuelEconomy({
    year: 2021,
    make: 'Chevrolet',
    model: 'Silverado',
    driveType: '4wd',
    cylinders: 8,
    displacement: 5.3
  })
  
  if (result.success && result.match) {
    const { primary, alternatives, rangeEstimate } = result.match
    
    console.log('\n✅ PRIMARY MATCH:')
    console.log(`Confidence: ${(primary.confidence.overall * 100).toFixed(1)}%`)
    console.log('\nReasons:')
    primary.confidence.reasons.forEach(r => console.log(`  ✓ ${r}`))
    
    if (primary.confidence.warnings.length > 0) {
      console.log('\nWarnings:')
      primary.confidence.warnings.forEach(w => console.log(`  ⚠️  ${w}`))
    }
    
    console.log('\n📈 FUEL ECONOMY:')
    console.log(`City: ${primary.fuelEconomy.cityMPG} mpg (unrounded: ${primary.fuelEconomy.unrounded.city.toFixed(2)})`)
    console.log(`Highway: ${primary.fuelEconomy.highwayMPG} mpg (unrounded: ${primary.fuelEconomy.unrounded.highway.toFixed(2)})`)
    console.log(`Combined: ${primary.fuelEconomy.combinedMPG} mpg`)
    
    console.log('\n💰 COST PROJECTIONS:')
    console.log(`Annual: $${primary.fuelEconomy.costProjections.annual}`)
    console.log(`3-Year: $${primary.fuelEconomy.costProjections.threeYear}`)
    console.log(`5-Year: $${primary.fuelEconomy.costProjections.fiveYear}`)
    console.log(`10-Year: $${primary.fuelEconomy.costProjections.tenYear}`)
    
    console.log('\n🌍 ENVIRONMENTAL:')
    console.log(`GHG Score: ${primary.fuelEconomy.ghgScore}/10`)
    console.log(`CO2: ${primary.fuelEconomy.co2Emissions} g/mi`)
    console.log(`Vehicle Class: ${primary.fuelEconomy.vehicleClass}`)
    
    if (alternatives.length > 0) {
      console.log(`\n⚡ ALTERNATIVE CONFIGURATIONS (${alternatives.length}):`)
      alternatives.forEach((alt, i) => {
        console.log(`\n  ${i + 1}. ${alt.description}`)
        console.log(`     Differentiator: ${alt.differentiator}`)
        console.log(`     MPG: ${alt.fuelEconomy.cityMPG}/${alt.fuelEconomy.highwayMPG}/${alt.fuelEconomy.combinedMPG}`)
        console.log(`     Annual Cost: $${alt.fuelEconomy.annualFuelCost}`)
        console.log(`     Confidence: ${(alt.confidence.overall * 100).toFixed(1)}%`)
      })
    }
    
    if (rangeEstimate) {
      console.log('\n📊 MPG RANGE (across all variants):')
      console.log(`City: ${rangeEstimate.cityMin}-${rangeEstimate.cityMax} mpg`)
      console.log(`Highway: ${rangeEstimate.highwayMin}-${rangeEstimate.highwayMax} mpg`)
      console.log(`Combined: ${rangeEstimate.combinedMin}-${rangeEstimate.combinedMax} mpg`)
    }
    
    console.log('\n⚙️  PERFORMANCE:')
    if (result.performance) {
      console.log(`Total Time: ${result.performance.totalTime}ms`)
      console.log(`API Calls: ${result.performance.apiCalls}`)
      console.log(`Total Options Considered: ${result.match.totalOptionsConsidered}`)
    }
  } else {
    console.log('❌ FAILED:', result.error)
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('🏆 GOD TIER EPA TEST COMPLETE!')
  console.log('=' .repeat(80))
}

testGodTierEPA().catch(console.error)
