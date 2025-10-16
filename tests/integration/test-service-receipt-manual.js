// Manual service receipt testing tool
// Tests real documents through current vision system to establish baseline

const fs = require('fs')
const path = require('path')

// Simple tracking structure for manual validation
const testResults = []

async function testSingleReceipt(imagePath, expectedData) {
  console.log(`\n🧾 Testing: ${path.basename(imagePath)}`)
  console.log('=' .repeat(50))
  
  try {
    // Read image file
    if (!fs.existsSync(imagePath)) {
      console.log('❌ File not found')
      return null
    }
    
    const imageBuffer = fs.readFileSync(imagePath)
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
    
    // Create FormData for vision API
    const formData = new FormData()
    formData.append('image', blob, path.basename(imagePath))
    formData.append('vehicle_id', 'dfa33260-a922-45d9-a649-3050377a7a62') // Use existing test vehicle
    formData.append('intent', 'service')
    
    console.log('📤 Processing through vision API...')
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:3005/api/vision/process', {
      method: 'POST',
      body: formData
    })
    
    const processingTime = Date.now() - startTime
    console.log(`⏱️  Processing time: ${processingTime}ms`)
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`)
      return null
    }
    
    const result = await response.json()
    console.log(`📊 Confidence: ${result.confidence || 'N/A'}%`)
    
    // Extract key fields for manual comparison
    const extracted = {
      vendor: extractField(result, ['vendor', 'shop', 'business_name', 'company']),
      date: extractField(result, ['date', 'service_date', 'invoice_date']),
      total: extractField(result, ['total', 'amount', 'total_amount', 'cost']),
      service_type: extractField(result, ['service', 'work_performed', 'description'])
    }
    
    console.log('\n📋 EXTRACTED DATA:')
    console.log(`   Vendor: ${extracted.vendor || 'NOT FOUND'}`)
    console.log(`   Date: ${extracted.date || 'NOT FOUND'}`)
    console.log(`   Total: ${extracted.total || 'NOT FOUND'}`)
    console.log(`   Service: ${extracted.service_type || 'NOT FOUND'}`)
    
    if (expectedData) {
      console.log('\n✅ EXPECTED DATA:')
      console.log(`   Vendor: ${expectedData.vendor}`)
      console.log(`   Date: ${expectedData.date}`)
      console.log(`   Total: ${expectedData.total}`)
      console.log(`   Service: ${expectedData.service_type}`)
      
      // Simple accuracy check
      const accuracy = calculateAccuracy(extracted, expectedData)
      console.log(`\n🎯 Accuracy: ${accuracy.percentage}% (${accuracy.correct}/${accuracy.total} fields)`)
      
      return {
        filename: path.basename(imagePath),
        processingTime,
        confidence: result.confidence,
        extracted,
        expected: expectedData,
        accuracy: accuracy.percentage,
        rawResponse: result
      }
    }
    
    // If no expected data, just show what we extracted for manual review
    console.log('\n📝 MANUAL REVIEW NEEDED:')
    console.log('   Please verify the extracted data against the actual receipt')
    console.log('   Note any errors or missing information')
    
    return {
      filename: path.basename(imagePath),
      processingTime,
      confidence: result.confidence,
      extracted,
      rawResponse: result
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return null
  }
}

function extractField(result, fieldNames) {
  // Look for field in various places in the response
  if (!result.data) return null
  
  // Check extracted_data first
  if (result.data.extracted_data) {
    for (const fieldName of fieldNames) {
      if (result.data.extracted_data[fieldName]) {
        return result.data.extracted_data[fieldName]
      }
    }
  }
  
  // Check top level
  for (const fieldName of fieldNames) {
    if (result.data[fieldName]) {
      return result.data[fieldName]
    }
  }
  
  return null
}

function calculateAccuracy(extracted, expected) {
  let correct = 0
  let total = 0
  
  const fields = ['vendor', 'date', 'total', 'service_type']
  
  for (const field of fields) {
    if (expected[field]) {
      total++
      if (extracted[field] && 
          extracted[field].toLowerCase().includes(expected[field].toLowerCase())) {
        correct++
      }
    }
  }
  
  return {
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0
  }
}

async function runManualValidation() {
  console.log('🧪 MANUAL SERVICE RECEIPT VALIDATION')
  console.log('=' .repeat(60))
  console.log('📋 Instructions:')
  console.log('1. Place service receipt images in ./test-receipts/ folder')
  console.log('2. Name files descriptively (e.g., jiffy-lube-oil-change.jpg)')
  console.log('3. This tool will process each image and show results')
  console.log('4. Manually verify accuracy and note failure patterns')
  
  // Check if test receipts directory exists
  const testDir = './test-receipts'
  if (!fs.existsSync(testDir)) {
    console.log(`\n📁 Creating ${testDir} directory...`)
    fs.mkdirSync(testDir)
    console.log('📋 Please add service receipt images to this folder and run again')
    return
  }
  
  // Get all image files
  const files = fs.readdirSync(testDir)
    .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
    .map(file => path.join(testDir, file))
  
  if (files.length === 0) {
    console.log('\n📋 No image files found in ./test-receipts/')
    console.log('   Add some service receipt images and run again')
    return
  }
  
  console.log(`\n🔍 Found ${files.length} receipt images to test`)
  
  // Test each receipt
  for (const imagePath of files) {
    const result = await testSingleReceipt(imagePath)
    if (result) {
      testResults.push(result)
    }
    
    // Pause between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Summary
  console.log('\n📊 VALIDATION SUMMARY')
  console.log('=' .repeat(60))
  
  if (testResults.length === 0) {
    console.log('❌ No successful tests completed')
    return
  }
  
  const avgProcessingTime = testResults.reduce((sum, r) => sum + r.processingTime, 0) / testResults.length
  const avgConfidence = testResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / testResults.length
  
  console.log(`📈 Processed: ${testResults.length} receipts`)
  console.log(`⏱️  Avg processing time: ${Math.round(avgProcessingTime)}ms`)
  console.log(`📊 Avg confidence: ${Math.round(avgConfidence)}%`)
  
  // Save results for analysis
  const resultsFile = `validation-results-${Date.now()}.json`
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2))
  console.log(`💾 Results saved to: ${resultsFile}`)
  
  console.log('\n📋 NEXT STEPS:')
  console.log('1. Review each result manually')
  console.log('2. Identify the 3 most common failure patterns')
  console.log('3. Note which fields are consistently missed')
  console.log('4. Look for patterns in confidence vs actual accuracy')
}

// Run the validation
runManualValidation().catch(console.error)
