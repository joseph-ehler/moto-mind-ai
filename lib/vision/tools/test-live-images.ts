/**
 * Test Live Dashboard Images
 * Quick test with user-provided fresh images
 */

import { OpenAI } from 'openai'
import { buildExtractionPrompt } from '../prompts/builder'
import { processDashboardExtraction } from '../validators/dashboard'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const TEST_IMAGES = [
  {
    name: 'Dashboard 1 - ODO 8078 km, Outside 23°C',
    base64: '' // Will be filled from uploaded images
  },
  {
    name: 'Dashboard 2 - ODO 499 km, Outside 18°C',
    base64: ''
  },
  {
    name: 'Dashboard 3 - ODO 1316 km, Trip B 80.2 km, Outside 16°C',
    base64: ''
  }
]

async function testLiveImage(name: string, imageBase64: string) {
  console.log(`\n📸 Testing: ${name}`)
  
  const messages = buildExtractionPrompt('dashboard_snapshot', imageBase64)
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0
  })

  const rawData = JSON.parse(response.choices[0].message.content || '{}')
  const { data, validation } = processDashboardExtraction(rawData)
  
  console.log('\n✅ Extracted Data:')
  console.log(`   Odometer: ${data.odometer_miles} ${data.odometer_unit}`)
  console.log(`   Trip A: ${data.trip_a_miles}`)
  console.log(`   Trip B: ${data.trip_b_miles}`)
  console.log(`   Fuel: ${data.fuel_eighths}/8`)
  console.log(`   Coolant: ${data.coolant_temp}`)
  console.log(`   Outside Temp: ${data.outside_temp_value}°${data.outside_temp_unit}`)
  console.log(`   Warning Lights: ${data.warning_lights?.join(', ') || 'none'}`)
  console.log(`   Confidence: ${data.confidence}`)
  
  if (validation.errors.length > 0) {
    console.log('\n⚠️  Validation Errors:')
    validation.errors.forEach(err => console.log(`   - ${err}`))
  }
  
  return { data, validation }
}

// Manual test - paste base64 strings from images
if (require.main === module) {
  console.log('🧪 Testing Live Dashboard Images\n')
  console.log('Paste base64 strings for each image to test...\n')
}

export { testLiveImage }
