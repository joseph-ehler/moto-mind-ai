#!/usr/bin/env node

// Validation Progress Tracker
// Tracks progress toward 50+ rigorously labeled validation dataset

const fs = require('fs');
const path = require('path');

async function trackValidationProgress() {
  console.log('📊 Dashboard Validation Progress Tracker\n');
  
  const trainingDataPath = path.join(__dirname, '../training-data');
  const rawImagesPath = path.join(trainingDataPath, 'dashboards', 'raw');
  const labeledPath = path.join(trainingDataPath, 'dashboards', 'labeled');
  
  // Count raw images
  const rawImages = fs.existsSync(rawImagesPath) 
    ? fs.readdirSync(rawImagesPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    : [];
  
  // Count labeled images
  const labeledImages = fs.existsSync(labeledPath)
    ? fs.readdirSync(labeledPath).filter(f => f.endsWith('.json'))
    : [];
  
  // Analyze labeled images
  const labelAnalysis = {
    first_pass: 0,
    verified: 0,
    final: 0,
    vehicle_makes: new Set(),
    dashboard_types: new Set(),
    quality_grades: { A: 0, B: 0, C: 0, D: 0, F: 0 }
  };
  
  const detailedLabels = [];
  
  for (const labelFile of labeledImages) {
    try {
      const labelPath = path.join(labeledPath, labelFile);
      const label = JSON.parse(fs.readFileSync(labelPath, 'utf8'));
      
      // Count review status
      const status = label.labeler_info?.review_status || 'unknown';
      if (labelAnalysis[status] !== undefined) {
        labelAnalysis[status]++;
      }
      
      // Track vehicle diversity
      if (label.vehicle_info?.make) {
        labelAnalysis.vehicle_makes.add(label.vehicle_info.make.toLowerCase());
      }
      
      // Track dashboard types
      if (label.vehicle_info?.dashboard_type) {
        labelAnalysis.dashboard_types.add(label.vehicle_info.dashboard_type);
      }
      
      // Track quality grades
      const quality = label.image_quality?.overall_quality;
      if (quality && labelAnalysis.quality_grades[quality] !== undefined) {
        labelAnalysis.quality_grades[quality]++;
      }
      
      detailedLabels.push({
        file: labelFile,
        status: status,
        make: label.vehicle_info?.make || 'Unknown',
        model: label.vehicle_info?.model || 'Unknown',
        dashboard_type: label.vehicle_info?.dashboard_type || 'Unknown',
        quality: quality || 'Unknown',
        labeler: label.labeler_info?.labeler_id || 'Unknown'
      });
      
    } catch (error) {
      console.log(`   ⚠️  Error reading label ${labelFile}: ${error.message}`);
    }
  }
  
  // Display progress summary
  console.log('📈 PROGRESS SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Raw Images Available: ${rawImages.length}`);
  console.log(`Labeled Images: ${labeledImages.length}/50 (${Math.round(labeledImages.length/50*100)}%)`);
  console.log('');
  
  console.log('📋 LABELING STATUS:');
  console.log(`- First Pass: ${labelAnalysis.first_pass}`);
  console.log(`- Verified: ${labelAnalysis.verified}`);
  console.log(`- Final: ${labelAnalysis.final}`);
  console.log('');
  
  console.log('🚗 VEHICLE DIVERSITY:');
  console.log(`- Makes Covered: ${labelAnalysis.vehicle_makes.size}`);
  console.log(`- Makes: ${Array.from(labelAnalysis.vehicle_makes).join(', ')}`);
  console.log(`- Dashboard Types: ${Array.from(labelAnalysis.dashboard_types).join(', ')}`);
  console.log('');
  
  console.log('⭐ QUALITY DISTRIBUTION:');
  Object.entries(labelAnalysis.quality_grades).forEach(([grade, count]) => {
    if (count > 0) {
      console.log(`- Grade ${grade}: ${count} images`);
    }
  });
  console.log('');
  
  // Production readiness assessment
  console.log('🎯 PRODUCTION READINESS ASSESSMENT:');
  
  const productionReady = labelAnalysis.final >= 50;
  const sufficientDiversity = labelAnalysis.vehicle_makes.size >= 5;
  const goodQuality = (labelAnalysis.quality_grades.A + labelAnalysis.quality_grades.B) >= labeledImages.length * 0.8;
  
  if (productionReady && sufficientDiversity && goodQuality) {
    console.log('✅ READY FOR PRODUCTION VALIDATION');
  } else {
    console.log('❌ NOT READY - Missing requirements:');
    if (!productionReady) {
      console.log(`   - Need ${50 - labelAnalysis.final} more final labels (currently ${labelAnalysis.final}/50)`);
    }
    if (!sufficientDiversity) {
      console.log(`   - Need more vehicle diversity (currently ${labelAnalysis.vehicle_makes.size} makes, need 5+)`);
    }
    if (!goodQuality) {
      const currentQuality = (labelAnalysis.quality_grades.A + labelAnalysis.quality_grades.B) / labeledImages.length * 100;
      console.log(`   - Need better image quality (currently ${currentQuality.toFixed(1)}%, need 80%+)`);
    }
  }
  console.log('');
  
  // Next steps recommendations
  console.log('🚀 RECOMMENDED NEXT STEPS:');
  
  if (rawImages.length < 20) {
    console.log('1. 📸 Source more diverse dashboard images (see DATASET_SOURCING_GUIDE.md)');
  }
  
  if (labelAnalysis.first_pass > labelAnalysis.verified) {
    console.log('2. 🔍 Get second reviewer verification for first-pass labels');
  }
  
  if (labelAnalysis.verified > labelAnalysis.final) {
    console.log('3. ✅ Finalize verified labels for production use');
  }
  
  if (labeledImages.length < 10) {
    console.log('4. 🏷️  Create more labels using: node scripts/create-rigorous-label.js');
  }
  
  if (labelAnalysis.final >= 10) {
    console.log('5. 🧪 Test current labels: node scripts/validate-corrected-labels.js');
  }
  
  console.log('');
  
  // Detailed breakdown
  if (detailedLabels.length > 0) {
    console.log('📋 DETAILED BREAKDOWN:');
    console.log('Status | Make     | Model    | Type    | Quality | File');
    console.log('-'.repeat(70));
    
    detailedLabels.forEach(label => {
      const status = label.status.padEnd(6);
      const make = label.make.padEnd(8);
      const model = label.model.padEnd(8);
      const type = label.dashboard_type.padEnd(7);
      const quality = label.quality.padEnd(7);
      console.log(`${status} | ${make} | ${model} | ${type} | ${quality} | ${label.file}`);
    });
    console.log('');
  }
  
  // Save progress report
  const reportPath = path.join(trainingDataPath, 'dashboards', 'progress-report.json');
  const report = {
    generated_at: new Date().toISOString(),
    raw_images_count: rawImages.length,
    labeled_images_count: labeledImages.length,
    target_count: 50,
    completion_percentage: Math.round(labeledImages.length / 50 * 100),
    labeling_status: {
      first_pass: labelAnalysis.first_pass,
      verified: labelAnalysis.verified,
      final: labelAnalysis.final
    },
    diversity: {
      vehicle_makes: Array.from(labelAnalysis.vehicle_makes),
      dashboard_types: Array.from(labelAnalysis.dashboard_types)
    },
    quality_distribution: labelAnalysis.quality_grades,
    production_ready: productionReady && sufficientDiversity && goodQuality,
    detailed_labels: detailedLabels
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📁 Progress report saved: ${reportPath}`);
}

trackValidationProgress().catch(console.error);
