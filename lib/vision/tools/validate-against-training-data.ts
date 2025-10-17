/**
 * Validate New Schema Against Existing Training Data
 * Tests new schema with real labeled dashboards
 */

import fs from 'fs'
import path from 'path'
import { OpenAI } from 'openai'
import { buildExtractionPrompt } from '../prompts/builder'
import { processDashboardExtraction } from '../validators/dashboard'
import { DashboardFields } from '../schemas/fields'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface LabeledData {
  image_file: string
  vehicle_info: {
    make: string
    model: string
    year: number
  }
  ground_truth: {
    odometer: {
      value: number
      unit: string
      visible: boolean
      confidence: string
      notes: string
    }
    fuel_level: {
      type: string
      value: number
      display_text: string
      visible: boolean
      confidence: string
      notes: string
    }
    coolant_temp?: {
      status: string
      gauge_position: string
      visible: boolean
      confidence: string
      notes: string
    }
    outside_temp?: {
      value: number
      unit: string
      visible: boolean
      confidence: string
      notes: string
    }
    warning_lights?: {
      lights: string[]
      visible: boolean
      confidence: string
      notes: string
    }
    oil_life?: {
      percent: number | null
      visible: boolean
      confidence: string
      notes: string
    }
  }
}

interface TestResult {
  imageName: string
  vehicle: string
  passed: boolean
  errors: string[]
  warnings: string[]
  extracted: {
    odometer_miles: number | null
    fuel_eighths: number | null
    coolant_temp: string | null
    outside_temp_value: number | null
  }
  expected: {
    odometer_miles: number
    fuel_eighths: number
    coolant_temp: string | null
    outside_temp_value: number | null
  }
  validationErrors: string[]
  autoCorrect: boolean
  confidence: number
}

async function extractDashboard(imageBase64: string): Promise<DashboardFields> {
  const messages = buildExtractionPrompt('dashboard_snapshot', imageBase64)
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0
  })

  const rawData = JSON.parse(response.choices[0].message.content || '{}')
  const { data } = processDashboardExtraction(rawData)
  
  return data
}

function compareResults(extracted: DashboardFields, expected: LabeledData['ground_truth']): TestResult['errors'] {
  const errors: string[] = []

  // Check odometer
  if (expected.odometer.visible) {
    if (extracted.odometer_miles !== expected.odometer.value) {
      errors.push(`Odometer: got ${extracted.odometer_miles}, expected ${expected.odometer.value}`)
    }
  }

  // Check fuel level (convert to eighths)
  if (expected.fuel_level.visible) {
    if (extracted.fuel_eighths !== expected.fuel_level.value) {
      errors.push(`Fuel: got ${extracted.fuel_eighths}/8, expected ${expected.fuel_level.value}/8`)
    }
  }

  // Check coolant temp
  if (expected.coolant_temp?.visible) {
    if (extracted.coolant_temp !== expected.coolant_temp.status) {
      errors.push(`Coolant temp: got ${extracted.coolant_temp}, expected ${expected.coolant_temp.status}`)
    }
  }

  // Check outside temp
  if (expected.outside_temp?.visible) {
    if (extracted.outside_temp_value !== expected.outside_temp.value) {
      errors.push(`Outside temp: got ${extracted.outside_temp_value}°, expected ${expected.outside_temp.value}°`)
    }
  }

  return errors
}

async function testLabeledExample(labelFile: string, imageDir: string): Promise<TestResult> {
  console.log(`\n📸 Testing: ${labelFile}`)

  // Load labeled data
  const labelPath = path.join(__dirname, '../../../training-data/dashboards/labeled', labelFile)
  const labeledData: LabeledData = JSON.parse(fs.readFileSync(labelPath, 'utf8'))

  // Load image
  const imagePath = path.join(imageDir, labeledData.image_file)
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`)
  }

  const imageBuffer = fs.readFileSync(imagePath)
  const imageBase64 = imageBuffer.toString('base64')

  // Extract with new schema
  console.log('  🤖 Extracting with new schema...')
  const extracted = await extractDashboard(imageBase64)

  // Validate
  const { data, validation, wasAutoCorrect } = processDashboardExtraction(extracted)

  // Compare results
  const errors = compareResults(data, labeledData.ground_truth)

  const result: TestResult = {
    imageName: labeledData.image_file,
    vehicle: `${labeledData.vehicle_info.year} ${labeledData.vehicle_info.make} ${labeledData.vehicle_info.model}`,
    passed: errors.length === 0 && validation.valid,
    errors,
    warnings: validation.warnings,
    extracted: {
      odometer_miles: data.odometer_miles,
      fuel_eighths: data.fuel_eighths,
      coolant_temp: data.coolant_temp,
      outside_temp_value: data.outside_temp_value
    },
    expected: {
      odometer_miles: labeledData.ground_truth.odometer.value,
      fuel_eighths: labeledData.ground_truth.fuel_level.value,
      coolant_temp: labeledData.ground_truth.coolant_temp?.status || null,
      outside_temp_value: labeledData.ground_truth.outside_temp?.value || null
    },
    validationErrors: validation.errors,
    autoCorrect: wasAutoCorrect,
    confidence: data.confidence
  }

  // Log result
  if (result.passed) {
    console.log('  ✅ PASSED')
  } else {
    console.log('  ❌ FAILED')
    result.errors.forEach(err => console.log(`     ${err}`))
    if (result.validationErrors.length > 0) {
      console.log('  ⚠️  Validation errors:')
      result.validationErrors.forEach(err => console.log(`     ${err}`))
    }
  }

  if (result.autoCorrect) {
    console.log('  🔄 Auto-correct applied')
  }

  return result
}

export async function validateAgainstTrainingData() {
  console.log('🧪 Testing New Schema Against Labeled Training Data\n')

  const labeledDir = path.join(__dirname, '../../../training-data/dashboards/labeled')
  const imageDir = path.join(__dirname, '../../../training-data/dashboards/raw')

  // Get all labeled files
  const labelFiles = fs.readdirSync(labeledDir).filter(f => f.endsWith('.json'))

  console.log(`Found ${labelFiles.length} labeled examples\n`)

  const results: TestResult[] = []

  // Test each labeled example
  for (const labelFile of labelFiles) {
    try {
      const result = await testLabeledExample(labelFile, imageDir)
      results.push(result)
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const autoCorrect = results.filter(r => r.autoCorrect).length

  console.log(`\n✅ Passed: ${passed}/${results.length} (${(passed / results.length * 100).toFixed(1)}%)`)
  console.log(`❌ Failed: ${failed}/${results.length}`)
  console.log(`🔄 Auto-correct: ${autoCorrect}/${results.length}`)

  console.log('\nAverage confidence:', (results.reduce((sum, r) => sum + r.confidence, 0) / results.length).toFixed(2))

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`\n  ${r.vehicle} (${r.imageName})`)
      r.errors.forEach(err => console.log(`    - ${err}`))
    })
  }

  // Detailed comparison
  console.log('\n📋 Detailed Results:')
  results.forEach(r => {
    console.log(`\n${r.passed ? '✅' : '❌'} ${r.vehicle}`)
    console.log(`   Odometer: ${r.extracted.odometer_miles} (expected ${r.expected.odometer_miles})`)
    console.log(`   Fuel:     ${r.extracted.fuel_eighths}/8 (expected ${r.expected.fuel_eighths}/8)`)
    if (r.expected.coolant_temp) {
      console.log(`   Coolant:  ${r.extracted.coolant_temp} (expected ${r.expected.coolant_temp})`)
    }
    if (r.expected.outside_temp_value) {
      console.log(`   Outside:  ${r.extracted.outside_temp_value}° (expected ${r.expected.outside_temp_value}°)`)
    }
    console.log(`   Confidence: ${r.confidence.toFixed(2)}`)
  })

  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      accuracy: passed / results.length,
      autoCorrectRate: autoCorrect / results.length
    }
  }
}

// Run if called directly
if (require.main === module) {
  validateAgainstTrainingData()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err)
      process.exit(1)
    })
}
