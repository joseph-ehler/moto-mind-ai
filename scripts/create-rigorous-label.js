#!/usr/bin/env node

// Rigorous Dashboard Image Labeling Tool
// Implements the labeling standards to prevent systematic errors

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createRigorousLabel() {
  console.log('🎯 Rigorous Dashboard Image Labeling Tool');
  console.log('Following standards to prevent systematic labeling errors\n');
  
  // Get image filename
  const imageFile = await question('Enter image filename (e.g., dashboard-honda-civic.jpg): ');
  const imagePath = path.join(__dirname, '../training-data/dashboards/raw', imageFile);
  
  if (!fs.existsSync(imagePath)) {
    console.log(`❌ Image not found: ${imagePath}`);
    process.exit(1);
  }
  
  console.log(`\n📋 PRE-LABELING CHECKLIST`);
  console.log('Before proceeding, ensure you have:');
  console.log('✓ Loaded image at full resolution');
  console.log('✓ Adjusted brightness/contrast if needed');
  console.log('✓ Examined all dashboard areas systematically');
  console.log('✓ Have reference materials available\n');
  
  const ready = await question('Ready to proceed? (y/n): ');
  if (ready.toLowerCase() !== 'y') {
    console.log('Please complete pre-labeling checklist first.');
    process.exit(0);
  }
  
  // Initialize label structure
  const label = {
    image_file: imageFile,
    labeler_info: {
      labeler_id: await question('Enter your initials_date (e.g., JD_20250930): '),
      labeling_date: new Date().toISOString().split('T')[0],
      review_status: 'first_pass'
    },
    image_quality: {},
    vehicle_info: {},
    ground_truth: {},
    labeling_notes: {
      uncertainties: [],
      assumptions: [],
      image_issues: []
    }
  };
  
  // Image Quality Assessment
  console.log('\n🔍 STEP 1: IMAGE QUALITY ASSESSMENT');
  label.image_quality.overall_quality = await question('Overall image quality (A/B/C/D/F): ');
  label.image_quality.lighting = await question('Lighting quality (excellent/good/fair/poor): ');
  label.image_quality.clarity = await question('Image clarity (sharp/acceptable/blurry): ');
  label.image_quality.glare_issues = await question('Glare issues (none/minor/significant): ');
  label.image_quality.notes = await question('Any visibility issues: ');
  
  // Vehicle Information
  console.log('\n🚗 STEP 2: VEHICLE INFORMATION');
  label.vehicle_info.make = await question('Vehicle make (Honda/Toyota/Ford/etc): ');
  label.vehicle_info.model = await question('Vehicle model (Accord/Camry/F150/etc): ');
  const yearInput = await question('Vehicle year (if visible): ');
  label.vehicle_info.year = yearInput ? parseInt(yearInput) : null;
  label.vehicle_info.dashboard_type = await question('Dashboard type (analog/digital/hybrid): ');
  
  // CRITICAL: Odometer Reading
  console.log('\n📊 STEP 3: ODOMETER READING (CRITICAL - Most errors occur here)');
  console.log('⚠️  ZOOM IN to 200% and read EVERY digit visible');
  console.log('⚠️  Common mistake: reading 85432 as 820 - READ ALL DIGITS');
  
  const odometerVisible = await question('Is odometer clearly visible? (y/n): ');
  if (odometerVisible.toLowerCase() === 'y') {
    const odometerValue = await question('Enter COMPLETE odometer reading (all digits): ');
    const odometerUnit = await question('Unit (miles/km): ');
    const odometerConfidence = await question('Confidence level (high/medium/low): ');
    const odometerNotes = await question('Notes about odometer reading: ');
    
    label.ground_truth.odometer = {
      value: parseInt(odometerValue),
      unit: odometerUnit,
      visible: true,
      confidence: odometerConfidence,
      notes: odometerNotes
    };
    
    if (odometerConfidence === 'low') {
      label.labeling_notes.uncertainties.push(`Odometer reading uncertain: ${odometerNotes}`);
    }
  } else {
    label.ground_truth.odometer = {
      value: null,
      unit: null,
      visible: false,
      confidence: 'n/a',
      notes: 'Odometer not visible or readable in image'
    };
  }
  
  // Fuel Level Reading
  console.log('\n⛽ STEP 4: FUEL LEVEL READING');
  console.log('⚠️  TRACE needle position precisely from center to tip');
  console.log('⚠️  Count markings to determine quarters vs eighths scale');
  
  const fuelVisible = await question('Is fuel gauge clearly visible? (y/n): ');
  if (fuelVisible.toLowerCase() === 'y') {
    const fuelType = await question('Scale type (quarters/eighths/percent): ');
    
    let fuelValue;
    if (fuelType === 'quarters') {
      console.log('Quarters scale: E=0, 1/4=2, 1/2=4, 3/4=6, F=8 (converted to eighths)');
      const quarterValue = await question('Needle position (E/1/4/1/2/3/4/F): ');
      const quarterMap = { 'E': 0, '1/4': 2, '1/2': 4, '3/4': 6, 'F': 8 };
      fuelValue = quarterMap[quarterValue] || 0;
    } else if (fuelType === 'eighths') {
      fuelValue = parseInt(await question('Eighths value (0-8, where 8=Full): '));
    } else {
      fuelValue = parseInt(await question('Percent value (0-100): '));
    }
    
    const fuelDisplayText = await question('Display text (Full/3/4/1/2/1/4/Empty): ');
    const fuelConfidence = await question('Confidence level (high/medium/low): ');
    const fuelNotes = await question('Notes about fuel reading: ');
    
    label.ground_truth.fuel_level = {
      type: fuelType,
      value: fuelValue,
      display_text: fuelDisplayText,
      visible: true,
      confidence: fuelConfidence,
      notes: fuelNotes
    };
  } else {
    label.ground_truth.fuel_level = {
      type: null,
      value: null,
      display_text: null,
      visible: false,
      confidence: 'n/a',
      notes: 'Fuel gauge not visible or readable'
    };
  }
  
  // Warning Lights
  console.log('\n⚠️  STEP 5: WARNING LIGHTS');
  console.log('⚠️  Only count clearly illuminated (bright/glowing) lights');
  console.log('⚠️  Identify specific types, not generic "other"');
  
  const warningLightsVisible = await question('Are any warning lights clearly illuminated? (y/n): ');
  if (warningLightsVisible.toLowerCase() === 'y') {
    console.log('Common types: check_engine, oil_pressure, battery, abs, airbag, seatbelt');
    const lightsInput = await question('Enter warning light types (comma separated): ');
    const lights = lightsInput.split(',').map(s => s.trim()).filter(s => s);
    const lightsConfidence = await question('Confidence level (high/medium/low): ');
    const lightsNotes = await question('Notes about warning lights: ');
    
    label.ground_truth.warning_lights = {
      lights: lights,
      visible: true,
      confidence: lightsConfidence,
      notes: lightsNotes
    };
  } else {
    label.ground_truth.warning_lights = {
      lights: [],
      visible: true,
      confidence: 'high',
      notes: 'No warning lights illuminated'
    };
  }
  
  // Engine Coolant Temperature
  console.log('\n🌡️  STEP 6: ENGINE COOLANT TEMPERATURE');
  console.log('⚠️  This is ENGINE coolant (C-H gauge), NOT outside weather temp');
  
  const coolantVisible = await question('Is coolant temperature gauge visible? (y/n): ');
  if (coolantVisible.toLowerCase() === 'y') {
    const coolantStatus = await question('Needle position (cold/normal/hot): ');
    const coolantPosition = await question('Gauge position (low/center/high): ');
    const coolantConfidence = await question('Confidence level (high/medium/low): ');
    const coolantNotes = await question('Notes about coolant temp: ');
    
    label.ground_truth.coolant_temp = {
      status: coolantStatus,
      gauge_position: coolantPosition,
      visible: true,
      confidence: coolantConfidence,
      notes: coolantNotes
    };
  } else {
    label.ground_truth.coolant_temp = {
      status: null,
      gauge_position: null,
      visible: false,
      confidence: 'n/a',
      notes: 'Coolant temperature gauge not visible'
    };
  }
  
  // Outside Temperature
  console.log('\n🌡️  STEP 7: OUTSIDE TEMPERATURE');
  console.log('⚠️  This is WEATHER temperature (digital display with °F/°C)');
  
  const outsideTempVisible = await question('Is outside temperature display visible? (y/n): ');
  if (outsideTempVisible.toLowerCase() === 'y') {
    const tempValue = parseInt(await question('Temperature value: '));
    const tempUnit = await question('Unit (F/C): ');
    const tempLocation = await question('Display location (center/corner/dashboard): ');
    const tempConfidence = await question('Confidence level (high/medium/low): ');
    const tempNotes = await question('Notes about outside temp: ');
    
    label.ground_truth.outside_temp = {
      value: tempValue,
      unit: tempUnit,
      display_location: tempLocation,
      visible: true,
      confidence: tempConfidence,
      notes: tempNotes
    };
  } else {
    label.ground_truth.outside_temp = {
      value: null,
      unit: null,
      display_location: null,
      visible: false,
      confidence: 'n/a',
      notes: 'Outside temperature not visible'
    };
  }
  
  // Final Notes
  console.log('\n📝 STEP 8: FINAL DOCUMENTATION');
  const uncertainties = await question('Any uncertain readings (comma separated): ');
  if (uncertainties) {
    label.labeling_notes.uncertainties.push(...uncertainties.split(',').map(s => s.trim()));
  }
  
  const assumptions = await question('Any assumptions made (comma separated): ');
  if (assumptions) {
    label.labeling_notes.assumptions.push(...assumptions.split(',').map(s => s.trim()));
  }
  
  const imageIssues = await question('Any image quality issues (comma separated): ');
  if (imageIssues) {
    label.labeling_notes.image_issues.push(...imageIssues.split(',').map(s => s.trim()));
  }
  
  // Save label
  const labelPath = path.join(__dirname, '../training-data/dashboards/labeled', 
    imageFile.replace(/\.[^.]*$/, '.json'));
  
  fs.writeFileSync(labelPath, JSON.stringify(label, null, 2));
  
  console.log('\n✅ LABELING COMPLETE');
  console.log(`📁 Label saved to: ${labelPath}`);
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Have second reviewer verify this label');
  console.log('2. Resolve any discrepancies');
  console.log('3. Mark as "verified" when consensus reached');
  console.log('4. Include in validated dataset when "final"');
  
  rl.close();
}

createRigorousLabel().catch(console.error);
