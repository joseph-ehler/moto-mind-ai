/**
 * Test Single Dashboard Image
 * Quick test for any dashboard photo
 */

import fs from 'fs'
import { OpenAI } from 'openai'
import { buildExtractionPrompt } from '../prompts/builder'
import { processDashboardExtraction } from '../validators/dashboard'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testDashboard(imagePath: string) {
  console.log(`\n📸 Testing Dashboard: ${imagePath}\n`)
  
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Image not found: ${imagePath}`)
    process.exit(1)
  }

  // Read and convert to base64
  const imageBuffer = fs.readFileSync(imagePath)
  const imageBase64 = imageBuffer.toString('base64')
  
  console.log(`📊 Image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`)
  console.log(`🤖 Extracting with GPT-4o...\n`)

  // Extract with vision
  const messages = buildExtractionPrompt('dashboard_snapshot', imageBase64)
  
  const startTime = Date.now()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0
  })
  const duration = Date.now() - startTime

  const rawData = JSON.parse(response.choices[0].message.content || '{}')
  const { data, validation, wasAutoCorrect } = processDashboardExtraction(rawData)
  
  // Display results
  console.log('✅ Extraction Complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 EXTRACTED DATA:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  console.log(`🚗 Odometer:       ${data.odometer_miles} ${data.odometer_unit}`)
  console.log(`📏 Trip A:         ${data.trip_a_miles ?? 'null'}`)
  console.log(`📏 Trip B:         ${data.trip_b_miles ?? 'null'}`)
  console.log(`⛽ Fuel:           ${data.fuel_eighths}/8 eighths`)
  console.log(`🌡️  Coolant Temp:   ${data.coolant_temp ?? 'null'}`)
  console.log(`🌤️  Outside Temp:   ${data.outside_temp_value}°${data.outside_temp_unit}`)
  console.log(`⚠️  Warning Lights: ${data.warning_lights?.length ? data.warning_lights.join(', ') : 'none'}`)
  console.log(`🔋 Oil Life:       ${data.oil_life_percent ? data.oil_life_percent + '%' : 'null'}`)
  console.log(`💬 Service Msg:    ${data.service_message ?? 'null'}`)
  console.log(`\n🎯 Confidence:     ${(data.confidence * 100).toFixed(0)}%`)
  console.log(`⏱️  Processing Time: ${duration}ms`)
  
  if (wasAutoCorrect) {
    console.log(`\n🔄 Auto-corrections were applied`)
  }
  
  if (validation.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`)
    validation.warnings.forEach(warning => console.log(`   - ${warning}`))
  }
  
  if (validation.errors.length > 0) {
    console.log(`\n❌ Validation Errors:`)
    validation.errors.forEach(error => console.log(`   - ${error}`))
  } else {
    console.log(`\n✅ Validation: PASSED`)
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n💾 Raw JSON Response:\n')
  console.log(JSON.stringify(data, null, 2))
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  return { data, validation, duration }
}

// CLI usage
if (require.main === module) {
  const imagePath = process.argv[2]
  
  if (!imagePath) {
    console.error('Usage: npm run vision:test-single <image-path>')
    console.error('Example: npm run vision:test-single ./test-images/dashboard-1.jpg')
    process.exit(1)
  }

  testDashboard(imagePath)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ Error:', err.message)
      process.exit(1)
    })
}

export { testDashboard }
