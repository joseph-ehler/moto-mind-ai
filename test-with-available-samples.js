// Realistic testing with publicly available sample images
// Tests vision system with accessible samples to establish baseline

async function testWithOnlineSamples() {
  console.log('🧪 TESTING WITH AVAILABLE SAMPLES')
  console.log('=' .repeat(50))
  
  // Test with a few different approaches to establish baseline
  const testCases = [
    {
      name: 'Simple Text Receipt',
      description: 'Basic text-based receipt format',
      createTestImage: () => createSimpleReceiptImage(),
      expectedFields: {
        vendor: 'Quick Lube',
        total: '45.99',
        service: 'Oil Change'
      }
    },
    {
      name: 'Complex Layout Receipt', 
      description: 'Multi-column receipt with line items',
      createTestImage: () => createComplexReceiptImage(),
      expectedFields: {
        vendor: 'Auto Service Center',
        total: '127.50',
        service: 'Brake Inspection'
      }
    }
  ]
  
  console.log('📋 Testing approach: Create minimal test images with known content')
  console.log('🎯 Goal: Establish if vision system can extract basic fields reliably\n')
  
  const results = []
  
  for (const testCase of testCases) {
    console.log(`\n🧾 Testing: ${testCase.name}`)
    console.log(`📝 ${testCase.description}`)
    
    try {
      // Create test image (simple canvas-based receipt)
      const imageBlob = testCase.createTestImage()
      
      // Test through vision API
      const formData = new FormData()
      formData.append('image', imageBlob, `${testCase.name.toLowerCase().replace(/\s+/g, '-')}.png`)
      formData.append('vehicle_id', 'dfa33260-a922-45d9-a649-3050377a7a62')
      formData.append('intent', 'service')
      
      console.log('📤 Processing through vision API...')
      const startTime = Date.now()
      
      const response = await fetch('http://localhost:3005/api/vision/process', {
        method: 'POST',
        body: formData
      })
      
      const processingTime = Date.now() - startTime
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status}`)
        continue
      }
      
      const result = await response.json()
      console.log(`⏱️  Processing time: ${processingTime}ms`)
      console.log(`📊 Confidence: ${result.confidence || 'N/A'}%`)
      
      // Check what was extracted
      const extractedText = result.data?.extracted_text || result.data?.text || 'No text extracted'
      console.log(`📄 Extracted text preview: ${extractedText.substring(0, 100)}...`)
      
      // Simple field extraction check
      const foundVendor = extractedText.toLowerCase().includes(testCase.expectedFields.vendor.toLowerCase())
      const foundTotal = extractedText.includes(testCase.expectedFields.total)
      const foundService = extractedText.toLowerCase().includes(testCase.expectedFields.service.toLowerCase())
      
      console.log(`✅ Found vendor (${testCase.expectedFields.vendor}): ${foundVendor}`)
      console.log(`✅ Found total (${testCase.expectedFields.total}): ${foundTotal}`)
      console.log(`✅ Found service (${testCase.expectedFields.service}): ${foundService}`)
      
      const accuracy = [foundVendor, foundTotal, foundService].filter(Boolean).length / 3 * 100
      console.log(`🎯 Basic accuracy: ${Math.round(accuracy)}%`)
      
      results.push({
        testCase: testCase.name,
        processingTime,
        confidence: result.confidence,
        accuracy: Math.round(accuracy),
        foundFields: { vendor: foundVendor, total: foundTotal, service: foundService },
        extractedText: extractedText.substring(0, 200)
      })
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Summary
  console.log('\n📊 BASELINE ASSESSMENT')
  console.log('=' .repeat(50))
  
  if (results.length === 0) {
    console.log('❌ No successful tests - vision system may have fundamental issues')
    return
  }
  
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length
  const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
  
  console.log(`📈 Tests completed: ${results.length}`)
  console.log(`🎯 Average accuracy: ${Math.round(avgAccuracy)}%`)
  console.log(`⏱️  Average processing time: ${Math.round(avgProcessingTime)}ms`)
  
  console.log('\n📋 INDIVIDUAL RESULTS:')
  results.forEach(result => {
    console.log(`  ${result.testCase}: ${result.accuracy}% accuracy`)
  })
  
  // Assessment
  console.log('\n🔍 BASELINE ASSESSMENT:')
  if (avgAccuracy >= 70) {
    console.log('✅ Vision system shows promise (≥70% accuracy)')
    console.log('📋 Next step: Test with more complex/realistic documents')
    console.log('🚀 Foundation justifies building more sophisticated testing')
  } else if (avgAccuracy >= 50) {
    console.log('⚠️ Vision system needs improvement (50-70% accuracy)')
    console.log('📋 Next step: Identify specific failure patterns')
    console.log('🔧 Focus on prompt optimization before expanding scope')
  } else {
    console.log('❌ Vision system has fundamental issues (<50% accuracy)')
    console.log('📋 Next step: Review vision processing architecture')
    console.log('🔧 May need different approach or model')
  }
  
  return results
}

function createSimpleReceiptImage() {
  // Create a simple canvas-based receipt image
  const canvas = new OffscreenCanvas(400, 300)
  const ctx = canvas.getContext('2d')
  
  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 400, 300)
  
  // Black text
  ctx.fillStyle = 'black'
  ctx.font = '16px Arial'
  
  // Receipt content
  ctx.fillText('QUICK LUBE', 150, 40)
  ctx.fillText('123 Main Street', 130, 60)
  ctx.fillText('Oil Change Service', 120, 100)
  ctx.fillText('Date: 2024-01-15', 130, 140)
  ctx.fillText('Total: $45.99', 140, 180)
  ctx.fillText('Thank you!', 150, 220)
  
  return canvas.convertToBlob({ type: 'image/png' })
}

function createComplexReceiptImage() {
  // Create a more complex receipt layout
  const canvas = new OffscreenCanvas(500, 400)
  const ctx = canvas.getContext('2d')
  
  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 500, 400)
  
  // Black text
  ctx.fillStyle = 'black'
  ctx.font = '14px Arial'
  
  // Header
  ctx.font = 'bold 18px Arial'
  ctx.fillText('AUTO SERVICE CENTER', 120, 30)
  ctx.font = '12px Arial'
  ctx.fillText('456 Service Road, City ST 12345', 110, 50)
  
  // Service details
  ctx.font = '14px Arial'
  ctx.fillText('Service Date: 2024-01-20', 50, 90)
  ctx.fillText('Vehicle: 2020 Honda Civic', 50, 110)
  
  // Line items
  ctx.fillText('Brake Inspection', 50, 150)
  ctx.fillText('$75.00', 400, 150)
  ctx.fillText('Labor (1.5 hrs)', 50, 170)
  ctx.fillText('$52.50', 400, 170)
  
  // Total
  ctx.font = 'bold 16px Arial'
  ctx.fillText('TOTAL: $127.50', 50, 220)
  
  return canvas.convertToBlob({ type: 'image/png' })
}

// Run the test
testWithOnlineSamples().catch(console.error)
