#!/usr/bin/env node

// Validate Corrected Labels Against Vision System
// Tests our corrected ground truth labels to measure true system accuracy

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function validateCorrectedLabels() {
  console.log('🧪 Validating Corrected Labels Against Vision System');
  console.log('Testing true system accuracy with rigorous ground truth\n');
  
  const trainingDataPath = path.join(__dirname, '../training-data');
  const rawImagesPath = path.join(trainingDataPath, 'dashboards', 'raw');
  const labeledPath = path.join(trainingDataPath, 'dashboards', 'labeled');
  const resultsPath = path.join(trainingDataPath, 'dashboards', 'validation-results');
  
  // Ensure results directory exists
  if (!fs.existsSync(resultsPath)) {
    fs.mkdirSync(resultsPath, { recursive: true });
  }
  
  // Find all corrected label files
  const labelFiles = fs.readdirSync(labeledPath).filter(f => f.endsWith('.json'));
  console.log(`📋 Found ${labelFiles.length} labeled images for validation\n`);
  
  if (labelFiles.length === 0) {
    console.log('❌ No labeled training data found!');
    console.log('💡 Run: node scripts/create-rigorous-label.js to create labels');
    return;
  }
  
  // Check if server is running
  console.log('🔍 Checking if development server is running...');
  try {
    const healthResponse = await fetch('http://localhost:3005/');
    if (!healthResponse.ok) {
      throw new Error('Server not responding');
    }
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Development server not running!');
    console.log('💡 Start the server with: npm run dev');
    return;
  }
  
  const results = [];
  let totalAccuracy = 0;
  const fieldAccuracies = {
    odometer: { correct: 0, total: 0 },
    fuel_level: { correct: 0, total: 0 },
    warning_lights: { correct: 0, total: 0 },
    outside_temp: { correct: 0, total: 0 }
  };
  
  for (const labelFile of labelFiles) {
    const imageBaseName = labelFile.replace('.json', '');
    
    // Find the actual image file
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
    
    try {
      // Load corrected ground truth
      const groundTruth = JSON.parse(fs.readFileSync(labelPath, 'utf8'));
      
      console.log(`   📋 Ground Truth (${groundTruth.labeler_info.review_status}):`);
      if (groundTruth.ground_truth.odometer.visible) {
        console.log(`      Odometer: ${groundTruth.ground_truth.odometer.value} ${groundTruth.ground_truth.odometer.unit}`);
      }
      if (groundTruth.ground_truth.fuel_level.visible) {
        console.log(`      Fuel: ${groundTruth.ground_truth.fuel_level.display_text} (${groundTruth.ground_truth.fuel_level.value}/8)`);
      }
      if (groundTruth.ground_truth.warning_lights.visible) {
        console.log(`      Warning Lights: ${groundTruth.ground_truth.warning_lights.lights.join(', ') || 'None'}`);
      }
      if (groundTruth.ground_truth.outside_temp.visible) {
        console.log(`      Outside Temp: ${groundTruth.ground_truth.outside_temp.value}°${groundTruth.ground_truth.outside_temp.unit}`);
      }
      
      // Process through vision system
      console.log(`   🚀 Processing through vision system...`);
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = getMimeType(imageFile);
      
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: mimeType });
      formData.append('image', blob, imageFile);
      formData.append('document_type', 'dashboard_snapshot');
      formData.append('mode', 'auto');
      
      const response = await fetch('http://localhost:3005/api/vision/process', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Vision processing failed: ${response.status}`);
      }
      
      const visionResult = await response.json();
      const systemOutput = visionResult.data.key_facts;
      
      console.log(`   🤖 System Output:`);
      if (systemOutput.odometer_miles) {
        console.log(`      Odometer: ${systemOutput.odometer_miles} miles`);
      }
      if (systemOutput.fuel_level_eighths !== undefined) {
        console.log(`      Fuel: ${systemOutput.fuel_level_eighths}/8 eighths`);
      }
      if (systemOutput.warning_lights) {
        console.log(`      Warning Lights: ${systemOutput.warning_lights.join(', ') || 'None'}`);
      }
      if (systemOutput.outside_temp) {
        console.log(`      Outside Temp: ${systemOutput.outside_temp.value}°${systemOutput.outside_temp.unit}`);
      }
      
      // Calculate accuracy for each field
      const fieldResults = {};
      let imageAccuracy = 0;
      let fieldsCompared = 0;
      
      // Odometer accuracy
      if (groundTruth.ground_truth.odometer.visible && systemOutput.odometer_miles) {
        const groundTruthMiles = groundTruth.ground_truth.odometer.unit === 'km' 
          ? Math.round(groundTruth.ground_truth.odometer.value / 1.609)
          : groundTruth.ground_truth.odometer.value;
        
        const accuracy = calculateNumericAccuracy(systemOutput.odometer_miles, groundTruthMiles);
        fieldResults.odometer = { 
          accuracy, 
          system: systemOutput.odometer_miles, 
          ground_truth: groundTruthMiles 
        };
        
        fieldAccuracies.odometer.total++;
        if (accuracy > 0.9) fieldAccuracies.odometer.correct++;
        imageAccuracy += accuracy;
        fieldsCompared++;
      }
      
      // Fuel level accuracy
      if (groundTruth.ground_truth.fuel_level.visible && systemOutput.fuel_level_eighths !== undefined) {
        const groundTruthEighths = groundTruth.ground_truth.fuel_level.value;
        const accuracy = systemOutput.fuel_level_eighths === groundTruthEighths ? 1.0 : 0.0;
        
        fieldResults.fuel_level = {
          accuracy,
          system: systemOutput.fuel_level_eighths,
          ground_truth: groundTruthEighths
        };
        
        fieldAccuracies.fuel_level.total++;
        if (accuracy === 1.0) fieldAccuracies.fuel_level.correct++;
        imageAccuracy += accuracy;
        fieldsCompared++;
      }
      
      // Warning lights accuracy
      if (groundTruth.ground_truth.warning_lights.visible) {
        const groundTruthLights = groundTruth.ground_truth.warning_lights.lights.sort();
        const systemLights = (systemOutput.warning_lights || []).sort();
        const accuracy = JSON.stringify(groundTruthLights) === JSON.stringify(systemLights) ? 1.0 : 0.5;
        
        fieldResults.warning_lights = {
          accuracy,
          system: systemLights,
          ground_truth: groundTruthLights
        };
        
        fieldAccuracies.warning_lights.total++;
        if (accuracy >= 0.8) fieldAccuracies.warning_lights.correct++;
        imageAccuracy += accuracy;
        fieldsCompared++;
      }
      
      // Outside temperature accuracy
      if (groundTruth.ground_truth.outside_temp.visible && systemOutput.outside_temp) {
        const groundTruthTemp = groundTruth.ground_truth.outside_temp.value;
        const systemTemp = systemOutput.outside_temp.value;
        const accuracy = calculateNumericAccuracy(systemTemp, groundTruthTemp, 5); // 5 degree tolerance
        
        fieldResults.outside_temp = {
          accuracy,
          system: `${systemTemp}°${systemOutput.outside_temp.unit}`,
          ground_truth: `${groundTruthTemp}°${groundTruth.ground_truth.outside_temp.unit}`
        };
        
        fieldAccuracies.outside_temp.total++;
        if (accuracy > 0.8) fieldAccuracies.outside_temp.correct++;
        imageAccuracy += accuracy;
        fieldsCompared++;
      }
      
      const overallImageAccuracy = fieldsCompared > 0 ? imageAccuracy / fieldsCompared : 0;
      totalAccuracy += overallImageAccuracy;
      
      console.log(`   📊 Image Accuracy: ${(overallImageAccuracy * 100).toFixed(1)}%`);
      
      results.push({
        image_file: imageFile,
        ground_truth_status: groundTruth.labeler_info.review_status,
        overall_accuracy: overallImageAccuracy,
        field_results: fieldResults,
        system_output: systemOutput,
        ground_truth: groundTruth.ground_truth
      });
      
      console.log(`   ✅ Validation complete\n`);
      
    } catch (error) {
      console.log(`   ❌ Failed to validate: ${error.message}\n`);
    }
  }
  
  // Generate comprehensive report
  const overallAccuracy = results.length > 0 ? totalAccuracy / results.length : 0;
  
  console.log('📊 VALIDATION RESULTS SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Overall System Accuracy: ${(overallAccuracy * 100).toFixed(1)}%`);
  console.log(`Images Tested: ${results.length}`);
  console.log('');
  
  console.log('📈 FIELD-BY-FIELD ACCURACY:');
  Object.entries(fieldAccuracies).forEach(([field, stats]) => {
    if (stats.total > 0) {
      const accuracy = (stats.correct / stats.total * 100).toFixed(1);
      console.log(`- ${field.replace('_', ' ')}: ${accuracy}% (${stats.correct}/${stats.total})`);
    }
  });
  console.log('');
  
  console.log('🎯 DETAILED RESULTS:');
  results.forEach(result => {
    console.log(`- ${result.image_file}: ${(result.overall_accuracy * 100).toFixed(1)}% (${result.ground_truth_status})`);
  });
  console.log('');
  
  // Production readiness assessment
  console.log('🚀 PRODUCTION READINESS ASSESSMENT:');
  if (overallAccuracy >= 0.90) {
    console.log('✅ READY FOR PRODUCTION - Accuracy exceeds 90% threshold');
  } else if (overallAccuracy >= 0.80) {
    console.log('🟡 NEEDS IMPROVEMENT - Accuracy 80-90%, investigate issues');
  } else {
    console.log('❌ NOT READY - Accuracy below 80%, major fixes required');
  }
  
  if (results.length < 10) {
    console.log('⚠️  INSUFFICIENT DATA - Need 50+ validated images for production readiness');
  }
  
  // Save detailed results
  const reportPath = path.join(resultsPath, `validation-report-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    test_date: new Date().toISOString(),
    overall_accuracy: overallAccuracy,
    field_accuracies: Object.fromEntries(
      Object.entries(fieldAccuracies).map(([field, stats]) => [
        field, 
        stats.total > 0 ? stats.correct / stats.total : 0
      ])
    ),
    images_tested: results.length,
    detailed_results: results
  }, null, 2));
  
  console.log(`\n📁 Detailed report saved: ${reportPath}`);
}

function calculateNumericAccuracy(systemValue, groundTruthValue, tolerance = 0) {
  const diff = Math.abs(systemValue - groundTruthValue);
  const maxValue = Math.max(systemValue, groundTruthValue);
  
  if (diff <= tolerance) return 1.0;
  if (maxValue === 0) return systemValue === groundTruthValue ? 1.0 : 0.0;
  
  const percentError = diff / maxValue;
  return Math.max(0, 1 - percentError);
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

validateCorrectedLabels().catch(console.error);
