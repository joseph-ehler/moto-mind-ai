/**
 * Debug NHTSA Fields
 * Shows ALL fields returned by NHTSA Extended API for a VIN
 * Use this to hunt for trim and other data
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const TEST_VIN = '1FTFW1ET5BFC10312' // 2011 Ford F-150

async function debugNHTSAFields() {
  console.log(`🔍 Fetching ALL NHTSA Extended fields for VIN: ${TEST_VIN}\n`)
  
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${TEST_VIN}?format=json`
  
  const response = await fetch(url)
  const data = await response.json()
  
  console.log(`Total Variables: ${data.Results.length}\n`)
  console.log('=' .repeat(80))
  
  // Group by category
  const categories: Record<string, any[]> = {
    'Vehicle Info': [],
    'Engine': [],
    'Transmission': [],
    'Safety': [],
    'Manufacturing': [],
    'Dimensions': [],
    'Other': []
  }
  
  for (const result of data.Results) {
    const variable = result.Variable
    const value = result.Value || '(empty)'
    
    // Categorize
    if (variable.toLowerCase().includes('trim') || 
        variable.toLowerCase().includes('series') ||
        variable.toLowerCase().includes('model')) {
      categories['Vehicle Info'].push({ variable, value })
    } else if (variable.toLowerCase().includes('engine') ||
               variable.toLowerCase().includes('cylinder') ||
               variable.toLowerCase().includes('displacement') ||
               variable.toLowerCase().includes('horsepower') ||
               variable.toLowerCase().includes('fuel')) {
      categories['Engine'].push({ variable, value })
    } else if (variable.toLowerCase().includes('transmission') ||
               variable.toLowerCase().includes('drive')) {
      categories['Transmission'].push({ variable, value })
    } else if (variable.toLowerCase().includes('safety') ||
               variable.toLowerCase().includes('airbag') ||
               variable.toLowerCase().includes('abs') ||
               variable.toLowerCase().includes('esc') ||
               variable.toLowerCase().includes('warning') ||
               variable.toLowerCase().includes('collision')) {
      categories['Safety'].push({ variable, value })
    } else if (variable.toLowerCase().includes('plant') ||
               variable.toLowerCase().includes('manufacturer') ||
               variable.toLowerCase().includes('country')) {
      categories['Manufacturing'].push({ variable, value })
    } else if (variable.toLowerCase().includes('weight') ||
               variable.toLowerCase().includes('wheelbase') ||
               variable.toLowerCase().includes('door') ||
               variable.toLowerCase().includes('seat')) {
      categories['Dimensions'].push({ variable, value })
    } else if (value !== '(empty)' && value !== 'Not Applicable') {
      categories['Other'].push({ variable, value })
    }
  }
  
  // Print each category
  for (const [category, fields] of Object.entries(categories)) {
    if (fields.length === 0) continue
    
    console.log(`\n📁 ${category}:`)
    console.log('-'.repeat(80))
    
    for (const { variable, value } of fields) {
      console.log(`  ${variable.padEnd(50)} = ${value}`)
    }
  }
  
  console.log('\n' + '='.repeat(80))
  console.log(`\n🎯 TRIM-RELATED FIELDS TO CHECK:`)
  console.log('-'.repeat(80))
  
  const trimFields = data.Results.filter((r: any) => 
    r.Variable.toLowerCase().includes('trim') ||
    r.Variable.toLowerCase().includes('series') ||
    r.Variable === 'Model' ||
    r.Variable === 'Vehicle Type'
  )
  
  for (const field of trimFields) {
    console.log(`  ${field.Variable.padEnd(30)} = ${field.Value || '(empty)'}`)
  }
}

debugNHTSAFields().catch(console.error)
