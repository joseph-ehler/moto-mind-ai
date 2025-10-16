#!/usr/bin/env node

// Vision System Accuracy Test
// Runs labeled training images through actual vision pipeline and measures accuracy

const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function runAccuracyTest() {
  console.log('🧪 Starting Vision System Accuracy Test...\n');
  
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
      
      console.log(`   🚀 Processing through vision system...`);
      
      // Convert image to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Create form data for vision API
      const formData = new FormData();
      
      // Create a blob from base64 data
      const imageBlob = new Blob([imageBuffer], { type: getMimeType(imageFile) });
      formData.append('image', imageBlob, imageFile);
      formData.append('document_type', 'dashboard_snapshot');
      formData.append('mode', 'auto');
      
      // Call vision processing API
      const response = await fetch('http://localhost:3005/api/vision/process', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Vision API failed: ${response.status} ${response.statusText}`);
      }
      
      const systemOutput = await response.json();
      
      console.log(`   ✅ Vision processing complete`);
      
      // Save system output for review
      const outputPath = path.join(resultsPath, `${imageBaseName}.system-output.json`);
      fs.writeFileSync(outputPath, JSON.stringify(systemOutput, null, 2));
      
      // Calculate accuracy scores
      const accuracyScores = calculateAccuracyScores(groundTruth.ground_truth, systemOutput.data);
      
      const result = {
        image_file: imageFile,
        ground_truth: groundTruth.ground_truth,
        system_output: systemOutput.data,
        accuracy_scores: accuracyScores,
        processing_metadata: systemOutput.metadata,
        errors: [],
        notes: []
      };
      
      results.push(result);
      
      console.log(`   📊 Accuracy Scores:`);
      console.log(`      Odometer: ${(accuracyScores.odometer * 100).toFixed(1)}%`);
      console.log(`      Fuel Level: ${(accuracyScores.fuel_level * 100).toFixed(1)}%`);
      console.log(`      Warning Lights: ${(accuracyScores.warning_lights * 100).toFixed(1)}%`);
      console.log(`      Overall: ${(accuracyScores.overall * 100).toFixed(1)}%`);
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      
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
        processing_metadata: null,
        errors: [error.message],
        notes: ['System processing failed']
      });
      console.log('');
    }
  }
  
  // Generate comprehensive report
  const report = generateAccuracyReport(results);
  
  // Save detailed report
  const reportPath = path.join(trainingDataPath, 'dashboards', 'validation-reports', 
    `accuracy-test-${new Date().toISOString().split('T')[0]}.json`);
  
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary report
  printAccuracyReport(report);
  
  console.log(`\n📁 Detailed report saved: ${reportPath}`);
}

/**
 * Calculates accuracy scores by comparing system output to ground truth
 */
function calculateAccuracyScores(groundTruth, systemOutput) {
  const scores = {
    odometer: 0,
    fuel_level: 0,
    coolant_temp: 0,
    outside_temp: 0,
    warning_lights: 0,
    oil_life: 0,
    overall: 0
  };
  
  if (!systemOutput || !systemOutput.key_facts) {
    return scores;
  }
  
  const systemData = systemOutput.key_facts;
  
  // Odometer accuracy
  if (groundTruth.odometer.visible) {
    const expectedValue = groundTruth.odometer.value;
    const actualValue = systemData.odometer_miles;
    
    if (actualValue === expectedValue) {
      scores.odometer = 1.0;
    } else if (actualValue && expectedValue) {
      // Handle unit conversion - if ground truth is in km, convert to miles for comparison
      let expectedMiles = expectedValue;
      if (groundTruth.odometer.unit === 'km') {
        expectedMiles = Math.round(expectedValue / 1.609344);
      }
      
      if (actualValue === expectedMiles) {
        scores.odometer = 1.0;
      } else {
        // Allow 5% tolerance for rounding
        const tolerance = Math.abs(actualValue - expectedMiles) / expectedMiles;
        scores.odometer = tolerance <= 0.05 ? 0.8 : 0.0;
      }
    }
  } else {
    // If not visible, system should return null
    scores.odometer = systemData.odometer_miles === null ? 1.0 : 0.0;
  }
  
  // Fuel level accuracy
  if (groundTruth.fuel_level.visible) {
    const expectedValue = groundTruth.fuel_level.value;
    const actualValue = systemData.fuel_level_eighths;
    
    if (groundTruth.fuel_level.type === 'eighths') {
      scores.fuel_level = actualValue === expectedValue ? 1.0 : 0.0;
    } else if (groundTruth.fuel_level.type === 'quarters') {
      // Convert quarters to eighths for comparison
      const expectedEighths = expectedValue * 2;
      scores.fuel_level = actualValue === expectedEighths ? 1.0 : 0.0;
    }
  } else {
    scores.fuel_level = systemData.fuel_level_eighths === null ? 1.0 : 0.0;
  }
  
  // Coolant temp accuracy
  if (groundTruth.coolant_temp.visible) {
    const systemTemp = systemData.coolant_temp;
    if (systemTemp && systemTemp.status === groundTruth.coolant_temp.status) {
      scores.coolant_temp = 1.0;
    }
  } else {
    scores.coolant_temp = systemData.coolant_temp === null ? 1.0 : 0.0;
  }
  
  // Outside temp accuracy
  if (groundTruth.outside_temp.visible) {
    const systemOutsideTemp = systemData.outside_temp;
    if (systemOutsideTemp && systemOutsideTemp.value === groundTruth.outside_temp.value) {
      scores.outside_temp = 1.0;
    }
  } else {
    scores.outside_temp = systemData.outside_temp === null ? 1.0 : 0.0;
  }
  
  // Warning lights accuracy
  const systemLights = systemData.warning_lights || [];
  const groundTruthLights = groundTruth.warning_lights.lights || [];
  
  if (groundTruthLights.length === 0 && systemLights.length === 0) {
    scores.warning_lights = 1.0;
  } else if (groundTruthLights.length > 0) {
    // Calculate intersection over union
    const intersection = groundTruthLights.filter(light => systemLights.includes(light)).length;
    const union = new Set([...groundTruthLights, ...systemLights]).size;
    scores.warning_lights = union > 0 ? intersection / union : 0.0;
  }
  
  // Oil life accuracy
  if (groundTruth.oil_life.visible) {
    scores.oil_life = systemData.oil_life_percent === groundTruth.oil_life.percent ? 1.0 : 0.0;
  } else {
    scores.oil_life = systemData.oil_life_percent === null ? 1.0 : 0.0;
  }
  
  // Overall accuracy (weighted average)
  const weights = {
    odometer: 0.25,
    fuel_level: 0.25,
    coolant_temp: 0.15,
    outside_temp: 0.10,
    warning_lights: 0.15,
    oil_life: 0.10
  };
  
  scores.overall = Object.entries(weights).reduce((sum, [field, weight]) => {
    return sum + (scores[field] * weight);
  }, 0);
  
  return scores;
}

/**
 * Generates comprehensive accuracy report
 */
function generateAccuracyReport(results) {
  const totalImages = results.length;
  const successfulTests = results.filter(r => r.system_output !== null).length;
  
  // Calculate field accuracies
  const fieldAccuracies = {
    odometer: 0,
    fuel_level: 0,
    coolant_temp: 0,
    outside_temp: 0,
    warning_lights: 0,
    oil_life: 0
  };
  
  if (successfulTests > 0) {
    Object.keys(fieldAccuracies).forEach(field => {
      const sum = results
        .filter(r => r.system_output !== null)
        .reduce((acc, r) => acc + r.accuracy_scores[field], 0);
      fieldAccuracies[field] = sum / successfulTests;
    });
  }
  
  const overallAccuracy = successfulTests > 0 
    ? results
        .filter(r => r.system_output !== null)
        .reduce((acc, r) => acc + r.accuracy_scores.overall, 0) / successfulTests
    : 0;
  
  // Identify critical failures
  const criticalFailures = [];
  
  if (overallAccuracy < 0.7) {
    criticalFailures.push(`Overall accuracy too low: ${(overallAccuracy * 100).toFixed(1)}% (need >70%)`);
  }
  
  if (fieldAccuracies.odometer < 0.8) {
    criticalFailures.push(`Odometer accuracy too low: ${(fieldAccuracies.odometer * 100).toFixed(1)}%`);
  }
  
  if (fieldAccuracies.fuel_level < 0.8) {
    criticalFailures.push(`Fuel level accuracy too low: ${(fieldAccuracies.fuel_level * 100).toFixed(1)}%`);
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (successfulTests < totalImages) {
    recommendations.push(`${totalImages - successfulTests} images failed processing - investigate system errors`);
  }
  
  if (overallAccuracy < 0.9) {
    recommendations.push('Overall accuracy below 90% - system not ready for production');
  }
  
  if (criticalFailures.length > 0) {
    recommendations.push('Fix critical failures before production deployment');
  }
  
  return {
    test_date: new Date().toISOString(),
    total_images: totalImages,
    successful_tests: successfulTests,
    overall_accuracy: overallAccuracy,
    field_accuracies: fieldAccuracies,
    results,
    critical_failures: criticalFailures,
    recommendations
  };
}

/**
 * Prints accuracy report to console
 */
function printAccuracyReport(report) {
  console.log('\n📊 VISION SYSTEM ACCURACY REPORT');
  console.log('=' .repeat(60));
  console.log(`Test Date: ${report.test_date}`);
  console.log(`Total Images: ${report.total_images}`);
  console.log(`Successful Tests: ${report.successful_tests}`);
  console.log(`Overall Accuracy: ${(report.overall_accuracy * 100).toFixed(1)}%`);
  console.log('');
  
  console.log('📋 FIELD ACCURACIES:');
  Object.entries(report.field_accuracies).forEach(([field, accuracy]) => {
    const status = accuracy >= 0.8 ? '✅' : accuracy >= 0.6 ? '⚠️' : '❌';
    console.log(`${status} ${field.padEnd(15)}: ${(accuracy * 100).toFixed(1)}%`);
  });
  console.log('');
  
  if (report.critical_failures.length > 0) {
    console.log('🚨 CRITICAL FAILURES:');
    report.critical_failures.forEach(failure => console.log(`- ${failure}`));
    console.log('');
  }
  
  console.log('📋 RECOMMENDATIONS:');
  report.recommendations.forEach(rec => console.log(`- ${rec}`));
  console.log('');
  
  console.log('🎯 PRODUCTION READINESS:');
  if (report.overall_accuracy >= 0.9 && report.critical_failures.length === 0) {
    console.log('✅ READY for production (high accuracy achieved)');
  } else if (report.overall_accuracy >= 0.7) {
    console.log('⚠️  NEEDS IMPROVEMENT (moderate accuracy)');
  } else {
    console.log('❌ NOT READY for production (low accuracy)');
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  report.results.forEach(result => {
    const status = result.system_output ? '✅' : '❌';
    const accuracy = result.system_output ? `${(result.accuracy_scores.overall * 100).toFixed(1)}%` : 'FAILED';
    console.log(`${status} ${result.image_file.padEnd(40)} ${accuracy}`);
  });
}

/**
 * Gets MIME type from file extension
 */
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

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3005/api/vision/process', {
      method: 'OPTIONS'
    });
    return response.status !== 404;
  } catch (error) {
    // Try a simple health check instead
    try {
      const healthResponse = await fetch('http://localhost:3005/', {
        method: 'GET'
      });
      return healthResponse.ok;
    } catch (healthError) {
      return false;
    }
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server not running!');
    console.log('💡 Start the server with: npm run dev');
    console.log('   Then run this test again.');
    process.exit(1);
  }
  
  console.log('✅ Server is running, proceeding with accuracy test...\n');
  
  await runAccuracyTest();
}

main().catch(console.error);
