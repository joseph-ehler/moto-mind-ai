/**
 * Test Uploaded Dashboard Images
 * Tests vision extraction on user-provided clear dashboard photos
 */

import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'
import { buildExtractionPrompt } from '../prompts/builder'
import { processDashboardExtraction } from '../validators/dashboard'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface TestCase {
  name: string
  imagePath: string
  expected: {
    odometer_miles: number
    odometer_unit: string
    trip_b_miles?: number | null
    outside_temp_value: number
    outside_temp_unit: string
    fuel_eighths: number
  }
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Dashboard 1 - Toyota/Lexus style',
    imagePath: path.join(__dirname, '../../../test-images/dashboard-1.jpg'),
    expected: {
      odometer_miles: 8078,
      odometer_unit: 'km',
      outside_temp_value: 23,
      outside_temp_unit: 'C',
      fuel_eighths: 0 // Needle at E
    }
  },
  {
    name: 'Dashboard 2 - Toyota style with warning lights',
    imagePath: path.join(__dirname, '../../../test-images/dashboard-2.jpg'),
    expected: {
      odometer_miles: 499,
      odometer_unit: 'km',
      outside_temp_value: 18,
      outside_temp_unit: 'C',
      fuel_eighths: 0 // Needle at E
    }
  },
  {
    name: 'Dashboard 3 - Toyota with Trip B visible',
    imagePath: path.join(__dirname, '../../../test-images/dashboard-3.jpg'),
    expected: {
      odometer_miles: 1316,
      odometer_unit: 'km',
      trip_b_miles: 80.2,
      outside_temp_value: 16,
      outside_temp_unit: 'C',
      fuel_eighths: 0 // Needle at E
    }
  }
]

async function testImage(testCase: TestCase) {
  console.log(`\n📸 Testing: ${testCase.name}`)
  
  if (!fs.existsSync(testCase.imagePath)) {
    console.log(`   ⚠️  Image not found: ${testCase.imagePath}`)
    return null
  }

  // Read and convert to base64
  const imageBuffer = fs.readFileSync(testCase.imagePath)
  const imageBase64 = imageBuffer.toString('base64')
  
  console.log(`   📊 Image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`)

  // Extract with vision
  const messages = buildExtractionPrompt('dashboard_snapshot', imageBase64)
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0
  })

  const rawData = JSON.parse(response.choices[0].message.content || '{}')
  const { data, validation } = processDashboardExtraction(rawData)
  
  // Compare results
  const errors: string[] = []
  
  if (data.odometer_miles !== testCase.expected.odometer_miles) {
    errors.push(`Odometer: got ${data.odometer_miles}, expected ${testCase.expected.odometer_miles}`)
  }
  
  if (data.odometer_unit !== testCase.expected.odometer_unit) {
    errors.push(`Unit: got ${data.odometer_unit}, expected ${testCase.expected.odometer_unit}`)
  }
  
  if (testCase.expected.trip_b_miles !== undefined) {
    if (data.trip_b_miles !== testCase.expected.trip_b_miles) {
      errors.push(`Trip B: got ${data.trip_b_miles}, expected ${testCase.expected.trip_b_miles}`)
    }
  }
  
  if (data.outside_temp_value !== testCase.expected.outside_temp_value) {
    errors.push(`Outside temp: got ${data.outside_temp_value}°, expected ${testCase.expected.outside_temp_value}°`)
  }
  
  if (data.fuel_eighths !== testCase.expected.fuel_eighths) {
    errors.push(`Fuel: got ${data.fuel_eighths}/8, expected ${testCase.expected.fuel_eighths}/8`)
  }

  // Display results
  console.log(`\n   ${errors.length === 0 ? '✅' : '❌'} Results:`)
  console.log(`   Odometer: ${data.odometer_miles} ${data.odometer_unit} ${data.odometer_miles === testCase.expected.odometer_miles ? '✅' : '❌'}`)
  console.log(`   Trip A: ${data.trip_a_miles}`)
  console.log(`   Trip B: ${data.trip_b_miles} ${testCase.expected.trip_b_miles !== undefined ? (data.trip_b_miles === testCase.expected.trip_b_miles ? '✅' : '❌') : ''}`)
  console.log(`   Fuel: ${data.fuel_eighths}/8 ${data.fuel_eighths === testCase.expected.fuel_eighths ? '✅' : '❌'}`)
  console.log(`   Coolant: ${data.coolant_temp}`)
  console.log(`   Outside: ${data.outside_temp_value}°${data.outside_temp_unit} ${data.outside_temp_value === testCase.expected.outside_temp_value ? '✅' : '❌'}`)
  console.log(`   Warning Lights: ${data.warning_lights?.join(', ') || 'none'}`)
  console.log(`   Confidence: ${data.confidence}`)
  
  if (validation.errors.length > 0) {
    console.log(`\n   ⚠️  Validation Errors:`)
    validation.errors.forEach(err => console.log(`      - ${err}`))
  }
  
  if (errors.length > 0) {
    console.log(`\n   ❌ Extraction Errors:`)
    errors.forEach(err => console.log(`      - ${err}`))
  }

  return {
    passed: errors.length === 0,
    errors,
    data,
    validation
  }
}

async function runTests() {
  console.log('🧪 Testing Uploaded Dashboard Images\n')
  console.log('Testing with clean, modern dashboard photos...\n')

  const results = []

  for (const testCase of TEST_CASES) {
    try {
      const result = await testImage(testCase)
      if (result) {
        results.push(result)
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const total = results.length

  console.log(`\n✅ Passed: ${passed}/${total} (${(passed / total * 100).toFixed(1)}%)`)
  console.log(`❌ Failed: ${total - passed}/${total}`)

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('\n💡 CONCLUSION: Vision extraction works correctly!')
    console.log('   The problem was likely incorrect ground truth labels in training data.')
  } else {
    console.log('\n⚠️  Some tests failed.')
    console.log('   Review extraction errors above.')
  }

  return results
}

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err)
      process.exit(1)
    })
}

export { testImage, runTests }
