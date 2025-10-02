// Training Data Validation System
// Tests vision system against labeled ground truth data

import fs from 'fs'
import path from 'path'
import { processDocument } from './pipeline'
import { VisionRequest } from './types'

interface GroundTruthLabel {
  image_file: string
  vehicle_info: {
    make: string
    model: string
    year: number | null
  }
  ground_truth: {
    odometer: {
      value: number | null
      unit: string | null
      visible: boolean
      confidence: string
      notes: string
    }
    fuel_level: {
      type: string | null
      value: number | null
      display_text: string | null
      visible: boolean
      confidence: string
      notes: string
    }
    coolant_temp: {
      status: string | null
      gauge_position: string | null
      visible: boolean
      confidence: string
      notes: string
    }
    outside_temp: {
      value: number | null
      unit: string | null
      visible: boolean
      confidence: string
      notes: string
    }
    warning_lights: {
      lights: string[]
      visible: boolean
      confidence: string
      notes: string
    }
    oil_life: {
      percent: number | null
      visible: boolean
      confidence: string
      notes: string
    }
  }
  image_quality: {
    lighting: string
    angle: string
    resolution: string
    clarity: string
    overall_quality: string
  }
  labeling_metadata: {
    labeled_by: string
    labeled_date: string
    review_status: string
    notes: string
  }
}

interface ValidationResult {
  image_file: string
  ground_truth: GroundTruthLabel['ground_truth']
  system_output: any
  accuracy_scores: {
    odometer: number
    fuel_level: number
    coolant_temp: number
    outside_temp: number
    warning_lights: number
    oil_life: number
    overall: number
  }
  errors: string[]
  notes: string[]
}

interface ValidationReport {
  test_date: string
  total_images: number
  labeled_images: number
  tested_images: number
  overall_accuracy: number
  field_accuracies: {
    odometer: number
    fuel_level: number
    coolant_temp: number
    outside_temp: number
    warning_lights: number
    oil_life: number
  }
  results: ValidationResult[]
  critical_failures: string[]
  recommendations: string[]
}

/**
 * Runs validation against all labeled training data
 */
export async function runTrainingValidation(): Promise<ValidationReport> {
  console.log('🧪 Starting Training Data Validation...\n')
  
  const trainingDataPath = path.join(process.cwd(), 'training-data')
  const rawImagesPath = path.join(trainingDataPath, 'dashboards', 'raw')
  const labeledPath = path.join(trainingDataPath, 'dashboards', 'labeled')
  const resultsPath = path.join(trainingDataPath, 'dashboards', 'test-results')
  
  // Ensure directories exist
  if (!fs.existsSync(resultsPath)) {
    fs.mkdirSync(resultsPath, { recursive: true })
  }
  
  // Find all labeled images
  const labelFiles = fs.readdirSync(labeledPath).filter(f => f.endsWith('.json'))
  console.log(`📋 Found ${labelFiles.length} labeled images`)
  
  if (labelFiles.length === 0) {
    console.log('❌ No labeled training data found!')
    console.log('💡 Create labels using: node scripts/create-ground-truth-label.js <image-name>')
    process.exit(1)
  }
  
  const results: ValidationResult[] = []
  
  for (const labelFile of labelFiles) {
    const imageFile = labelFile.replace('.json', '')
    const imagePath = path.join(rawImagesPath, imageFile)
    const labelPath = path.join(labeledPath, labelFile)
    
    console.log(`🔍 Testing: ${imageFile}`)
    
    if (!fs.existsSync(imagePath)) {
      console.log(`   ⚠️  Image file not found: ${imageFile}`)
      continue
    }
    
    try {
      // Load ground truth
      const groundTruth: GroundTruthLabel = JSON.parse(fs.readFileSync(labelPath, 'utf8'))
      
      // Convert image to base64
      const imageBuffer = fs.readFileSync(imagePath)
      const base64Image = imageBuffer.toString('base64')
      const mimeType = getMimeType(imageFile)
      
      // Create vision request
      const visionRequest: VisionRequest = {
        image: base64Image,
        mimeType,
        mode: 'auto',
        document_type: 'dashboard_snapshot'
      }
      
      // Process through vision system
      const systemOutput = await processDocument(visionRequest)
      
      // Save system output for review
      const outputPath = path.join(resultsPath, `${imageFile}.result.json`)
      fs.writeFileSync(outputPath, JSON.stringify(systemOutput, null, 2))
      
      // Calculate accuracy scores
      const accuracyScores = calculateAccuracyScores(groundTruth.ground_truth, systemOutput)
      
      const result: ValidationResult = {
        image_file: imageFile,
        ground_truth: groundTruth.ground_truth,
        system_output: systemOutput,
        accuracy_scores: accuracyScores,
        errors: [],
        notes: []
      }
      
      results.push(result)
      
      console.log(`   ✅ Processed (Overall: ${(accuracyScores.overall * 100).toFixed(1)}%)`)
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`)
      
      results.push({
        image_file: imageFile,
        ground_truth: JSON.parse(fs.readFileSync(labelPath, 'utf8')).ground_truth,
        system_output: null,
        accuracy_scores: {
          odometer: 0,
          fuel_level: 0,
          coolant_temp: 0,
          outside_temp: 0,
          warning_lights: 0,
          oil_life: 0,
          overall: 0
        },
        errors: [error.message],
        notes: ['System processing failed']
      })
    }
  }
  
  // Generate comprehensive report
  const report = generateValidationReport(results)
  
  // Save report
  const reportPath = path.join(trainingDataPath, 'dashboards', 'validation-reports', 
    `validation-report-${new Date().toISOString().split('T')[0]}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  console.log(`\n📊 Validation report saved: ${reportPath}`)
  
  return report
}

/**
 * Calculates accuracy scores by comparing system output to ground truth
 */
function calculateAccuracyScores(groundTruth: GroundTruthLabel['ground_truth'], systemOutput: any): ValidationResult['accuracy_scores'] {
  const scores = {
    odometer: 0,
    fuel_level: 0,
    coolant_temp: 0,
    outside_temp: 0,
    warning_lights: 0,
    oil_life: 0,
    overall: 0
  }
  
  // Extract system output data
  const systemData = systemOutput.key_facts || {}
  
  // Odometer accuracy
  if (groundTruth.odometer.visible) {
    if (systemData.odometer_miles === groundTruth.odometer.value) {
      scores.odometer = 1.0
    } else if (systemData.odometer_miles && groundTruth.odometer.value) {
      // Allow 5% tolerance for unit conversion rounding
      const tolerance = Math.abs(systemData.odometer_miles - groundTruth.odometer.value) / groundTruth.odometer.value
      scores.odometer = tolerance <= 0.05 ? 0.8 : 0.0
    }
  } else {
    // If not visible, system should return null
    scores.odometer = systemData.odometer_miles === null ? 1.0 : 0.0
  }
  
  // Fuel level accuracy
  if (groundTruth.fuel_level.visible) {
    if (groundTruth.fuel_level.type === 'eighths') {
      scores.fuel_level = systemData.fuel_level_eighths === groundTruth.fuel_level.value ? 1.0 : 0.0
    } else if (groundTruth.fuel_level.type === 'quarters') {
      // Convert quarters to eighths for comparison
      const expectedEighths = groundTruth.fuel_level.value * 2
      scores.fuel_level = systemData.fuel_level_eighths === expectedEighths ? 1.0 : 0.0
    }
  } else {
    scores.fuel_level = systemData.fuel_level_eighths === null ? 1.0 : 0.0
  }
  
  // Coolant temp accuracy
  if (groundTruth.coolant_temp.visible) {
    const systemTemp = systemData.coolant_temp
    if (systemTemp && systemTemp.status === groundTruth.coolant_temp.status) {
      scores.coolant_temp = 1.0
    }
  } else {
    scores.coolant_temp = systemData.coolant_temp === null ? 1.0 : 0.0
  }
  
  // Outside temp accuracy
  if (groundTruth.outside_temp.visible) {
    const systemOutsideTemp = systemData.outside_temp
    if (systemOutsideTemp && systemOutsideTemp.value === groundTruth.outside_temp.value) {
      scores.outside_temp = 1.0
    }
  } else {
    scores.outside_temp = systemData.outside_temp === null ? 1.0 : 0.0
  }
  
  // Warning lights accuracy
  const systemLights = systemData.warning_lights || []
  const groundTruthLights = groundTruth.warning_lights.lights || []
  
  if (groundTruthLights.length === 0 && systemLights.length === 0) {
    scores.warning_lights = 1.0
  } else if (groundTruthLights.length > 0) {
    // Calculate intersection over union
    const intersection = groundTruthLights.filter(light => systemLights.includes(light)).length
    const union = new Set([...groundTruthLights, ...systemLights]).size
    scores.warning_lights = union > 0 ? intersection / union : 0.0
  }
  
  // Oil life accuracy
  if (groundTruth.oil_life.visible) {
    scores.oil_life = systemData.oil_life_percent === groundTruth.oil_life.percent ? 1.0 : 0.0
  } else {
    scores.oil_life = systemData.oil_life_percent === null ? 1.0 : 0.0
  }
  
  // Overall accuracy (weighted average)
  const weights = {
    odometer: 0.25,
    fuel_level: 0.25,
    coolant_temp: 0.15,
    outside_temp: 0.10,
    warning_lights: 0.15,
    oil_life: 0.10
  }
  
  scores.overall = Object.entries(weights).reduce((sum, [field, weight]) => {
    return sum + (scores[field] * weight)
  }, 0)
  
  return scores
}

/**
 * Generates comprehensive validation report
 */
function generateValidationReport(results: ValidationResult[]): ValidationReport {
  const totalImages = results.length
  const testedImages = results.filter(r => r.system_output !== null).length
  
  // Calculate field accuracies
  const fieldAccuracies = {
    odometer: 0,
    fuel_level: 0,
    coolant_temp: 0,
    outside_temp: 0,
    warning_lights: 0,
    oil_life: 0
  }
  
  if (testedImages > 0) {
    Object.keys(fieldAccuracies).forEach(field => {
      const sum = results.reduce((acc, r) => acc + r.accuracy_scores[field], 0)
      fieldAccuracies[field] = sum / testedImages
    })
  }
  
  const overallAccuracy = testedImages > 0 
    ? results.reduce((acc, r) => acc + r.accuracy_scores.overall, 0) / testedImages 
    : 0
  
  // Identify critical failures
  const criticalFailures: string[] = []
  
  if (overallAccuracy < 0.7) {
    criticalFailures.push(`Overall accuracy too low: ${(overallAccuracy * 100).toFixed(1)}% (need >70%)`)
  }
  
  if (fieldAccuracies.odometer < 0.8) {
    criticalFailures.push(`Odometer accuracy too low: ${(fieldAccuracies.odometer * 100).toFixed(1)}%`)
  }
  
  if (fieldAccuracies.fuel_level < 0.8) {
    criticalFailures.push(`Fuel level accuracy too low: ${(fieldAccuracies.fuel_level * 100).toFixed(1)}%`)
  }
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (totalImages < 20) {
    recommendations.push(`Need more training data: ${totalImages}/20 images (${20 - totalImages} more needed)`)
  }
  
  if (testedImages < totalImages) {
    recommendations.push(`${totalImages - testedImages} images failed processing - investigate system errors`)
  }
  
  if (overallAccuracy < 0.9) {
    recommendations.push('Overall accuracy below 90% - system not ready for production')
  }
  
  if (criticalFailures.length > 0) {
    recommendations.push('Fix critical failures before production deployment')
  }
  
  return {
    test_date: new Date().toISOString(),
    total_images: totalImages,
    labeled_images: totalImages, // All results come from labeled images
    tested_images: testedImages,
    overall_accuracy: overallAccuracy,
    field_accuracies: fieldAccuracies,
    results,
    critical_failures: criticalFailures,
    recommendations
  }
}

/**
 * Gets MIME type from file extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  }
  return mimeTypes[ext] || 'image/jpeg'
}

/**
 * Prints validation report to console
 */
export function printValidationReport(report: ValidationReport): void {
  console.log('\n📊 TRAINING DATA VALIDATION REPORT')
  console.log('=' .repeat(60))
  console.log(`Test Date: ${report.test_date}`)
  console.log(`Total Images: ${report.total_images}`)
  console.log(`Labeled Images: ${report.labeled_images}`)
  console.log(`Successfully Tested: ${report.tested_images}`)
  console.log(`Overall Accuracy: ${(report.overall_accuracy * 100).toFixed(1)}%`)
  console.log('')
  
  console.log('📋 FIELD ACCURACIES:')
  Object.entries(report.field_accuracies).forEach(([field, accuracy]) => {
    const status = accuracy >= 0.8 ? '✅' : accuracy >= 0.6 ? '⚠️' : '❌'
    console.log(`${status} ${field.padEnd(15)}: ${(accuracy * 100).toFixed(1)}%`)
  })
  console.log('')
  
  if (report.critical_failures.length > 0) {
    console.log('🚨 CRITICAL FAILURES:')
    report.critical_failures.forEach(failure => console.log(`- ${failure}`))
    console.log('')
  }
  
  console.log('📋 RECOMMENDATIONS:')
  report.recommendations.forEach(rec => console.log(`- ${rec}`))
  console.log('')
  
  console.log('🎯 PRODUCTION READINESS:')
  if (report.overall_accuracy >= 0.9 && report.critical_failures.length === 0) {
    console.log('✅ READY for production (high accuracy achieved)')
  } else if (report.overall_accuracy >= 0.7) {
    console.log('⚠️  NEEDS IMPROVEMENT (moderate accuracy)')
  } else {
    console.log('❌ NOT READY for production (low accuracy)')
  }
}

// Export for CLI usage
if (require.main === module) {
  runTrainingValidation()
    .then(printValidationReport)
    .catch(console.error)
}
