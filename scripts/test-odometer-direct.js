#!/usr/bin/env node

// Direct odometer reading test with OpenAI Vision API
// Usage: node test-odometer-direct.js <image-filename>

const fs = require('fs');
const path = require('path');

async function testOdometerReading() {
  const imageFile = process.argv[2];
  
  if (!imageFile) {
    console.log('Usage: node test-odometer-direct.js <image-filename>');
    process.exit(1);
  }
  
  const trainingDataPath = path.join(__dirname, '../training-data');
  const imagePath = path.join(trainingDataPath, 'dashboards', 'raw', imageFile);
  
  if (!fs.existsSync(imagePath)) {
    console.log(`❌ Image not found: ${imagePath}`);
    process.exit(1);
  }
  
  console.log(`🔍 Testing ODOMETER READING ONLY for: ${imageFile}`);
  console.log(`📁 Image path: ${imagePath}`);
  
  // Convert image to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = getMimeType(imageFile);
  
  // Simple, focused prompt for odometer reading
  const prompt = `Look at this dashboard image. Find the ODOMETER display (shows total miles/kilometers driven).

CRITICAL: Read the COMPLETE number - ALL digits visible. Do not truncate or read partial numbers.

Common odometer formats:
- 127856 km (read ALL 6 digits)
- 85432 miles (read ALL 5 digits) 
- 012847 miles (read ALL 6 digits including leading zero)

Respond with ONLY:
1. The complete odometer reading and unit
2. If km, also provide miles conversion (km ÷ 1.609)

Example responses:
"127856 km (79446 miles)"
"85432 miles"
"012847 miles"`;

  const requestBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 100,
    temperature: 0
  };
  
  console.log('🚀 Calling OpenAI Vision API directly...');
  
  try {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Direct API call complete');
    console.log('');
    console.log('🔍 DIRECT GPT-4O RESPONSE:');
    console.log('=' .repeat(50));
    console.log(result.choices[0].message.content);
    console.log('=' .repeat(50));
    
    // Save full response for analysis
    const resultsPath = path.join(trainingDataPath, 'dashboards', 'test-results');
    if (!fs.existsSync(resultsPath)) {
      fs.mkdirSync(resultsPath, { recursive: true });
    }
    
    const outputFile = path.join(resultsPath, `${imageFile.replace(/\.[^.]*$/, '')}_odometer_direct.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    
    console.log(`📁 Full response saved to: ${outputFile}`);
    
  } catch (error) {
    console.log(`❌ Direct API call failed: ${error.message}`);
    
    if (error.message.includes('API call failed: 401')) {
      console.log('💡 Make sure OPENAI_API_KEY environment variable is set');
    }
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

testOdometerReading().catch(console.error);
