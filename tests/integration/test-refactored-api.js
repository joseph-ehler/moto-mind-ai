// Test Script for Refactored Vision API
// Quick validation that the new modular architecture works

const FormData = require('form-data')
const fs = require('fs')
const fetch = require('node-fetch')

async function testRefactoredAPI() {
  console.log('🧪 Testing Refactored Vision API...\n')
  
  // Test 1: Basic API structure
  console.log('1️⃣ Testing API structure...')
  
  try {
    const response = await fetch('http://localhost:3000/api/vision/process', {
      method: 'GET' // Should return 405 Method Not Allowed
    })
    
    const result = await response.json()
    
    if (response.status === 405 && result.code === 'METHOD_NOT_ALLOWED') {
      console.log('✅ Method validation works')
    } else {
      console.log('❌ Method validation failed')
    }
  } catch (error) {
    console.log('⚠️ API not running or connection failed:', error.message)
  }
  
  // Test 2: Missing file validation
  console.log('\n2️⃣ Testing missing file validation...')
  
  try {
    const form = new FormData()
    form.append('mode', 'document')
    form.append('document_type', 'service_invoice')
    // No image file
    
    const response = await fetch('http://localhost:3000/api/vision/process', {
      method: 'POST',
      body: form
    })
    
    const result = await response.json()
    
    if (response.status === 400 && result.code === 'NO_FILE') {
      console.log('✅ File validation works')
    } else {
      console.log('❌ File validation failed:', result)
    }
  } catch (error) {
    console.log('⚠️ Test failed:', error.message)
  }
  
  console.log('\n🎯 Basic API structure tests completed')
  console.log('📝 To test with real images, start the dev server and use the UI')
}

// Run tests
testRefactoredAPI().catch(console.error)
