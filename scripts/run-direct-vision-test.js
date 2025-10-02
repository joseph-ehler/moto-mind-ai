#!/usr/bin/env node

// Direct Vision Processing Test
// Tests vision system directly without requiring server to be running

const fs = require('fs');
const path = require('path');

async function runDirectVisionTest() {
  console.log('🧪 Starting Direct Vision Processing Test...\n');
  
  const trainingDataPath = path.join(__dirname, '../training-data');
  const rawImagesPath = path.join(trainingDataPath, 'dashboards', 'raw');
  const labeledPath = path.join(trainingDataPath, 'dashboards', 'labeled');
  const resultsPath = path.join(trainingDataPath, 'dashboards', 'test-results');
  
  // Ensure results directory exists
  if (!fs.existsSync(resultsPath)) {
    fs.mkdirSync(resultsPath, { recursive: true });
  }
  
  // Find all labeled images
  const labelFiles = fs.readdirSync(labeledPath).filter(f => f.endsWith('.json'));
  console.log(`📋 Found ${labelFiles.length} labeled images for testing\n`);
  
  if (labelFiles.length === 0) {
    console.log('❌ No labeled training data found!');
    return;
  }
  
  const results = [];
  
  for (const labelFile of labelFiles) {
    const imageBaseName = labelFile.replace('.json', '');
    
    // Find the actual image file with extension
    const allImages = fs.readdirSync(rawImagesPath);
    const imageFile = allImages.find(img => {
      const imgBaseName = img.replace(/\.[^/.]+$/, '');
      return imgBaseName === imageBaseName;
    });
    
    if (!imageFile) {
      console.log(`   ⚠️  No image file found for label: ${labelFile}`);
      continue;
    }
    
    const imagePath = path.join(rawImagesPath, imageFile);
    const labelPath = path.join(labeledPath, labelFile);
    
    console.log(`🔍 Testing: ${imageFile}`);
    console.log(`   📋 Loading ground truth...`);
    
    try {
      // Load ground truth
      const groundTruth = JSON.parse(fs.readFileSync(labelPath, 'utf8'));
      
      console.log(`   📊 Ground Truth Summary:`);
      console.log(`      Vehicle: ${groundTruth.vehicle_info.year} ${groundTruth.vehicle_info.make} ${groundTruth.vehicle_info.model}`);
      console.log(`      Odometer: ${groundTruth.ground_truth.odometer.visible ? `${groundTruth.ground_truth.odometer.value} ${groundTruth.ground_truth.odometer.unit}` : 'Not visible'}`);
      console.log(`      Fuel: ${groundTruth.ground_truth.fuel_level.visible ? groundTruth.ground_truth.fuel_level.display_text : 'Not visible'}`);
      console.log(`      Warning Lights: ${groundTruth.ground_truth.warning_lights.lights.length > 0 ? groundTruth.ground_truth.warning_lights.lights.join(', ') : 'None'}`);
      console.log(`      Image Quality: ${groundTruth.image_quality.overall_quality}`);
      
      // For now, simulate processing and show what we would test
      console.log(`   🎯 Test Scenarios:`);
      
      // Unit conversion test
      if (groundTruth.ground_truth.odometer.visible && groundTruth.ground_truth.odometer.unit === 'km') {
        const expectedMiles = Math.round(groundTruth.ground_truth.odometer.value / 1.609344);
        console.log(`      📐 Unit Conversion: ${groundTruth.ground_truth.odometer.value} km → ${expectedMiles} miles`);
      }
      
      // Fuel level test
      if (groundTruth.ground_truth.fuel_level.visible) {
        const fuelType = groundTruth.ground_truth.fuel_level.type;
        const fuelValue = groundTruth.ground_truth.fuel_level.value;
        if (fuelType === 'quarters') {
          const expectedEighths = fuelValue * 2;
          console.log(`      ⛽ Fuel Conversion: ${fuelValue}/4 quarters → ${expectedEighths}/8 eighths`);
        }
      }
      
      // Warning lights test
      if (groundTruth.ground_truth.warning_lights.lights.length > 0) {
        console.log(`      ⚠️  Warning Light Detection: ${groundTruth.ground_truth.warning_lights.lights.join(', ')}`);
      }
      
      console.log(`   ⏳ Ready for actual vision processing integration`);
      
      results.push({
        image_file: imageFile,
        ground_truth: groundTruth.ground_truth,
        test_scenarios: {
          unit_conversion: groundTruth.ground_truth.odometer.unit === 'km',
          fuel_conversion: groundTruth.ground_truth.fuel_level.type === 'quarters',
          warning_lights: groundTruth.ground_truth.warning_lights.lights.length > 0,
          outside_temp: groundTruth.ground_truth.outside_temp.visible
        },
        status: 'ready_for_processing'
      });
      
      console.log(`   ✅ Test case prepared\n`);
      
    } catch (error) {
      console.log(`   ❌ Failed to load: ${error.message}\n`);
    }
  }
  
  // Generate test summary
  console.log('📊 TEST PREPARATION SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total labeled images: ${results.length}`);
  console.log('');
  
  console.log('🧪 TEST SCENARIOS IDENTIFIED:');
  const scenarios = {
    unit_conversion: results.filter(r => r.test_scenarios.unit_conversion).length,
    fuel_conversion: results.filter(r => r.test_scenarios.fuel_conversion).length,
    warning_lights: results.filter(r => r.test_scenarios.warning_lights).length,
    outside_temp: results.filter(r => r.test_scenarios.outside_temp).length
  };
  
  Object.entries(scenarios).forEach(([scenario, count]) => {
    console.log(`- ${scenario.replace('_', ' ')}: ${count} test cases`);
  });
  console.log('');
  
  console.log('🎯 CRITICAL TEST CASES:');
  results.forEach(result => {
    const criticalTests = [];
    if (result.test_scenarios.unit_conversion) criticalTests.push('km→miles');
    if (result.test_scenarios.fuel_conversion) criticalTests.push('quarters→eighths');
    if (result.test_scenarios.warning_lights) criticalTests.push('warning detection');
    if (result.test_scenarios.outside_temp) criticalTests.push('temp extraction');
    
    if (criticalTests.length > 0) {
      console.log(`- ${result.image_file}: ${criticalTests.join(', ')}`);
    }
  });
  console.log('');
  
  console.log('🔄 NEXT STEPS:');
  console.log('1. Start development server: npm run dev');
  console.log('2. Run full accuracy test: npm run training:accuracy');
  console.log('3. Or integrate vision processing directly into this script');
  console.log('');
  
  console.log('💡 KEY INSIGHTS FROM GROUND TRUTH:');
  console.log('- We have diverse test cases covering major scenarios');
  console.log('- Unit conversion testing available (km → miles)');
  console.log('- Fuel scale conversion testing (quarters → eighths)');
  console.log('- Warning light detection validation');
  console.log('- Temperature extraction verification');
  
  // Save test preparation report
  const reportPath = path.join(trainingDataPath, 'dashboards', 'validation-reports', 
    `test-preparation-${new Date().toISOString().split('T')[0]}.json`);
  
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    test_date: new Date().toISOString(),
    total_images: results.length,
    test_scenarios: scenarios,
    results: results
  }, null, 2));
  
  console.log(`\n📁 Test preparation report saved: ${reportPath}`);
}

runDirectVisionTest().catch(console.error);
