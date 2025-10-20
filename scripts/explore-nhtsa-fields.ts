/**
 * NHTSA Field Explorer
 * 
 * This tool decodes a VIN and shows ALL 180+ fields that NHTSA returns
 * Helps us discover what data we're missing!
 */

interface NHTSAResult {
  Variable: string
  Value: string
  ValueId: string
  VariableId: number
}

interface NHTSAResponse {
  Count: number
  Message: string
  SearchCriteria: string
  Results: NHTSAResult[]
}

async function exploreNHTSAFields(vin: string) {
  console.log(`\n🔍 Exploring NHTSA Fields for VIN: ${vin}\n`)
  console.log('=' .repeat(80))
  
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`
    )
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }
    
    const data: NHTSAResponse = await response.json()
    
    console.log(`\n✅ Found ${data.Results.length} total fields\n`)
    
    // Group fields by category
    const categories: Record<string, NHTSAResult[]> = {
      'Basic Info': [],
      'Engine': [],
      'Transmission': [],
      'Safety': [],
      'Dimensions': [],
      'Manufacturing': [],
      'Fuel': [],
      'Other': []
    }
    
    // Categorize fields
    data.Results.forEach(result => {
      const variable = result.Variable.toLowerCase()
      
      if (variable.includes('engine') || variable.includes('cylinder') || variable.includes('displacement') || variable.includes('horsepower')) {
        categories['Engine'].push(result)
      } else if (variable.includes('transmission') || variable.includes('gear')) {
        categories['Transmission'].push(result)
      } else if (variable.includes('airbag') || variable.includes('abs') || variable.includes('stability') || variable.includes('traction') || variable.includes('collision') || variable.includes('warning') || variable.includes('brake')) {
        categories['Safety'].push(result)
      } else if (variable.includes('wheelbase') || variable.includes('weight') || variable.includes('width') || variable.includes('height') || variable.includes('length') || variable.includes('door') || variable.includes('seat')) {
        categories['Dimensions'].push(result)
      } else if (variable.includes('plant') || variable.includes('manufacturer') || variable.includes('made')) {
        categories['Manufacturing'].push(result)
      } else if (variable.includes('fuel') || variable.includes('mpg') || variable.includes('electric')) {
        categories['Fuel'].push(result)
      } else if (variable.includes('year') || variable.includes('make') || variable.includes('model') || variable.includes('trim') || variable.includes('series') || variable.includes('body')) {
        categories['Basic Info'].push(result)
      } else {
        categories['Other'].push(result)
      }
    })
    
    // Print by category
    for (const [category, fields] of Object.entries(categories)) {
      if (fields.length === 0) continue
      
      console.log(`\n${'='.repeat(80)}`)
      console.log(`📂 ${category.toUpperCase()} (${fields.length} fields)`)
      console.log('='.repeat(80))
      
      // Show fields with values
      const fieldsWithValues = fields.filter(f => f.Value && f.Value.trim() !== '' && f.Value !== 'Not Applicable')
      const fieldsWithoutValues = fields.filter(f => !f.Value || f.Value.trim() === '' || f.Value === 'Not Applicable')
      
      if (fieldsWithValues.length > 0) {
        console.log(`\n✅ Fields WITH Data (${fieldsWithValues.length}):`)
        fieldsWithValues.forEach(field => {
          console.log(`  • ${field.Variable}: "${field.Value}"`)
        })
      }
      
      if (fieldsWithoutValues.length > 0 && fieldsWithoutValues.length < 10) {
        console.log(`\n❌ Fields WITHOUT Data (${fieldsWithoutValues.length}):`)
        fieldsWithoutValues.forEach(field => {
          console.log(`  • ${field.Variable}`)
        })
      } else if (fieldsWithoutValues.length >= 10) {
        console.log(`\n❌ ${fieldsWithoutValues.length} fields with no data (hidden)`)
      }
    }
    
    // Summary
    const totalFields = data.Results.length
    const fieldsWithData = data.Results.filter(r => r.Value && r.Value.trim() !== '' && r.Value !== 'Not Applicable').length
    const emptyFields = totalFields - fieldsWithData
    
    console.log(`\n${'='.repeat(80)}`)
    console.log('📊 SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total Fields: ${totalFields}`)
    console.log(`Fields WITH Data: ${fieldsWithData} (${Math.round(fieldsWithData/totalFields*100)}%)`)
    console.log(`Fields WITHOUT Data: ${emptyFields} (${Math.round(emptyFields/totalFields*100)}%)`)
    
    // Check for potentially valuable fields we might be missing
    console.log(`\n${'='.repeat(80)}`)
    console.log('💎 POTENTIALLY VALUABLE FIELDS WE MIGHT BE MISSING')
    console.log('='.repeat(80))
    
    const valuableKeywords = [
      'entertainment', 'camera', 'adaptive', 'cruise', 'pedestrian',
      'automatic', 'parking', 'theft', 'keyless', 'tonneau',
      'bed', 'cargo', 'towing', 'payload', 'axle', 'battery',
      'charging', 'electric', 'hybrid', 'range', 'torque',
      'turbo', 'supercharge', 'valve', 'timing', 'cooling'
    ]
    
    const potentiallyValuable = data.Results.filter(r => 
      r.Value && r.Value.trim() !== '' && r.Value !== 'Not Applicable' &&
      valuableKeywords.some(keyword => r.Variable.toLowerCase().includes(keyword))
    )
    
    if (potentiallyValuable.length > 0) {
      potentiallyValuable.forEach(field => {
        console.log(`  💡 ${field.Variable}: "${field.Value}"`)
      })
    } else {
      console.log('  ✅ Already capturing most valuable fields!')
    }
    
    console.log(`\n${'='.repeat(80)}\n`)
    
    // Export full data to JSON for analysis
    const fs = require('fs')
    const filename = `nhtsa-fields-${vin}-${Date.now()}.json`
    fs.writeFileSync(filename, JSON.stringify(data, null, 2))
    console.log(`📄 Full data exported to: ${filename}\n`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  const vin = process.argv[2] || '1GCUYDED5MZ123456'
  exploreNHTSAFields(vin)
}

export { exploreNHTSAFields }
