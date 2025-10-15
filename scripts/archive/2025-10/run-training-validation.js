#!/usr/bin/env node

// Simple training validation runner
// Runs validation tests against labeled training data

const fs = require('fs');
const path = require('path');

async function runValidation() {
  console.log('🧪 Starting Training Data Validation...\n');
  
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
  console.log(`📋 Found ${labelFiles.length} labeled images`);
  
  if (labelFiles.length === 0) {
    console.log('❌ No labeled training data found!');
    console.log('💡 Create labels using: npm run training:label <image-name>');
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
    
    if (!fs.existsSync(imagePath)) {
      console.log(`   ⚠️  Image file not found: ${imageFile}`);
      continue;
    }
    
    try {
      // Load ground truth
      const groundTruth = JSON.parse(fs.readFileSync(labelPath, 'utf8'));
      
      // For now, simulate system processing since we need the full pipeline
      console.log(`   📋 Ground truth loaded:`);
      console.log(`      Vehicle: ${groundTruth.vehicle_info.year} ${groundTruth.vehicle_info.make} ${groundTruth.vehicle_info.model}`);
      console.log(`      Odometer: ${groundTruth.ground_truth.odometer.visible ? `${groundTruth.ground_truth.odometer.value} ${groundTruth.ground_truth.odometer.unit}` : 'Not visible'}`);
      console.log(`      Fuel: ${groundTruth.ground_truth.fuel_level.visible ? groundTruth.ground_truth.fuel_level.display_text : 'Not visible'}`);
      console.log(`      Warning Lights: ${groundTruth.ground_truth.warning_lights.lights.length > 0 ? groundTruth.ground_truth.warning_lights.lights.join(', ') : 'None'}`);
      console.log(`      Image Quality: ${groundTruth.image_quality.overall_quality}`);
      
      // TODO: Actually process through vision system
      console.log(`   ⏳ System processing simulation (TODO: integrate with vision pipeline)`);
      
      results.push({
        image_file: imageFile,
        ground_truth: groundTruth.ground_truth,
        status: 'labeled_ready_for_testing'
      });
      
      console.log(`   ✅ Ready for testing\n`);
      
    } catch (error) {
      console.log(`   ❌ Failed to load: ${error.message}\n`);
    }
  }
  
  // Generate summary report
  console.log('📊 VALIDATION SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total labeled images: ${results.length}`);
  console.log(`Ready for testing: ${results.filter(r => r.status === 'labeled_ready_for_testing').length}`);
  console.log('');
  
  console.log('🎯 NEXT STEPS:');
  console.log('1. Integrate vision pipeline processing');
  console.log('2. Compare system output vs ground truth');
  console.log('3. Calculate accuracy scores');
  console.log('4. Generate detailed reports');
  console.log('');
  
  console.log('📋 LABELED IMAGES READY FOR TESTING:');
  results.forEach(result => {
    console.log(`- ${result.image_file}`);
  });
  
  // Save intermediate results
  const reportPath = path.join(trainingDataPath, 'dashboards', 'validation-reports', 
    `labeled-images-${new Date().toISOString().split('T')[0]}.json`);
  
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    test_date: new Date().toISOString(),
    labeled_images: results.length,
    results: results
  }, null, 2));
  
  console.log(`\n📁 Report saved: ${reportPath}`);
}

runValidation().catch(console.error);
