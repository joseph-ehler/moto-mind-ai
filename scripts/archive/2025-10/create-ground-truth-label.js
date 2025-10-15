#!/usr/bin/env node

// Ground Truth Labeling Tool for Dashboard Images
// Usage: node scripts/create-ground-truth-label.js <image-filename>

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createGroundTruthLabel() {
  const imageFile = process.argv[2];
  
  if (!imageFile) {
    console.log('Usage: node scripts/create-ground-truth-label.js <image-filename>');
    process.exit(1);
  }
  
  const imagePath = path.join(__dirname, '../training-data/dashboards/raw', imageFile);
  const labelPath = path.join(__dirname, '../training-data/dashboards/labeled', imageFile.replace(/\.[^/.]+$/, '.json'));
  
  if (!fs.existsSync(imagePath)) {
    console.log(`Error: Image file not found: ${imagePath}`);
    process.exit(1);
  }
  
  console.log(`\n🏷️  Creating ground truth label for: ${imageFile}`);
  console.log('=' .repeat(60));
  
  // Vehicle Information
  console.log('\n📋 VEHICLE INFORMATION:');
  const make = await question('Vehicle Make (e.g., Honda, Toyota): ');
  const model = await question('Vehicle Model (e.g., Accord, Camry): ');
  const year = await question('Vehicle Year (e.g., 2013): ');
  
  // Odometer Reading
  console.log('\n🔢 ODOMETER READING:');
  const odometerVisible = await question('Is odometer visible? (y/n): ');
  let odometerData = { visible: odometerVisible.toLowerCase() === 'y' };
  
  if (odometerData.visible) {
    odometerData.value = parseInt(await question('Odometer reading (numbers only): '));
    odometerData.unit = await question('Unit (miles/km): ');
    odometerData.confidence = await question('Confidence (high/medium/low): ');
    odometerData.notes = await question('Notes (optional): ');
  } else {
    odometerData.value = null;
    odometerData.unit = null;
    odometerData.confidence = 'n/a';
    odometerData.notes = await question('Why not visible?: ');
  }
  
  // Fuel Level
  console.log('\n⛽ FUEL LEVEL:');
  const fuelVisible = await question('Is fuel gauge visible? (y/n): ');
  let fuelData = { visible: fuelVisible.toLowerCase() === 'y' };
  
  if (fuelData.visible) {
    fuelData.type = await question('Gauge type (quarters/eighths/percent): ');
    
    if (fuelData.type === 'quarters') {
      const quarters = await question('Fuel level (E/1/2/3/F): ');
      fuelData.value = quarters === 'E' ? 0 : quarters === 'F' ? 4 : parseInt(quarters);
      fuelData.display_text = quarters === 'E' ? 'Empty' : quarters === 'F' ? 'Full' : `${quarters}/4`;
    } else if (fuelData.type === 'eighths') {
      const eighths = await question('Fuel level in eighths (0-8): ');
      fuelData.value = parseInt(eighths);
      fuelData.display_text = `${eighths}/8`;
    } else {
      fuelData.value = parseInt(await question('Fuel percentage (0-100): '));
      fuelData.display_text = `${fuelData.value}%`;
    }
    
    fuelData.confidence = await question('Confidence (high/medium/low): ');
    fuelData.notes = await question('Notes (optional): ');
  } else {
    fuelData.type = null;
    fuelData.value = null;
    fuelData.display_text = null;
    fuelData.confidence = 'n/a';
    fuelData.notes = await question('Why not visible?: ');
  }
  
  // Engine Temperature
  console.log('\n🌡️  ENGINE TEMPERATURE:');
  const tempVisible = await question('Is coolant temp gauge visible? (y/n): ');
  let tempData = { visible: tempVisible.toLowerCase() === 'y' };
  
  if (tempData.visible) {
    tempData.status = await question('Temperature status (cold/normal/hot): ');
    tempData.gauge_position = await question('Gauge position (low/center/high): ');
    tempData.confidence = await question('Confidence (high/medium/low): ');
    tempData.notes = await question('Notes (optional): ');
  } else {
    tempData.status = null;
    tempData.gauge_position = null;
    tempData.confidence = 'n/a';
    tempData.notes = await question('Why not visible?: ');
  }
  
  // Outside Temperature
  console.log('\n🌡️  OUTSIDE TEMPERATURE:');
  const outsideTempVisible = await question('Is outside temp displayed? (y/n): ');
  let outsideTempData = { visible: outsideTempVisible.toLowerCase() === 'y' };
  
  if (outsideTempData.visible) {
    outsideTempData.value = parseInt(await question('Temperature value: '));
    outsideTempData.unit = await question('Unit (F/C): ');
    outsideTempData.confidence = await question('Confidence (high/medium/low): ');
    outsideTempData.notes = await question('Notes (optional): ');
  } else {
    outsideTempData.value = null;
    outsideTempData.unit = null;
    outsideTempData.confidence = 'n/a';
    outsideTempData.notes = await question('Why not visible?: ');
  }
  
  // Warning Lights
  console.log('\n⚠️  WARNING LIGHTS:');
  const warningLightsVisible = await question('Are any warning lights on? (y/n): ');
  let warningLightsData = { visible: warningLightsVisible.toLowerCase() === 'y' };
  
  if (warningLightsData.visible) {
    console.log('Enter warning lights (one per line, empty line to finish):');
    console.log('Common lights: CHECK_ENGINE, OIL_PRESSURE, BATTERY, ABS, AIRBAG, etc.');
    const lights = [];
    while (true) {
      const light = await question('Warning light: ');
      if (!light.trim()) break;
      lights.push(light.trim().toUpperCase());
    }
    warningLightsData.lights = lights;
    warningLightsData.confidence = await question('Confidence (high/medium/low): ');
    warningLightsData.notes = await question('Notes (optional): ');
  } else {
    warningLightsData.lights = [];
    warningLightsData.confidence = 'high';
    warningLightsData.notes = 'No warning lights visible';
  }
  
  // Oil Life
  console.log('\n🛢️  OIL LIFE:');
  const oilLifeVisible = await question('Is oil life percentage shown? (y/n): ');
  let oilLifeData = { visible: oilLifeVisible.toLowerCase() === 'y' };
  
  if (oilLifeData.visible) {
    oilLifeData.percent = parseInt(await question('Oil life percentage: '));
    oilLifeData.confidence = await question('Confidence (high/medium/low): ');
    oilLifeData.notes = await question('Notes (optional): ');
  } else {
    oilLifeData.percent = null;
    oilLifeData.confidence = 'n/a';
    oilLifeData.notes = await question('Why not visible?: ');
  }
  
  // Image Quality Assessment
  console.log('\n📸 IMAGE QUALITY:');
  const lighting = await question('Lighting quality (excellent/good/fair/poor): ');
  const angle = await question('Camera angle (straight/angled/poor): ');
  const resolution = await question('Resolution (high/medium/low): ');
  const clarity = await question('Image clarity (excellent/good/fair/poor): ');
  const overallQuality = await question('Overall quality grade (A/B/C/D/F): ');
  
  // Final Notes
  console.log('\n📝 FINAL NOTES:');
  const finalNotes = await question('Any additional notes about this image: ');
  
  // Build the ground truth object
  const groundTruth = {
    image_file: imageFile,
    vehicle_info: {
      make: make || 'Unknown',
      model: model || 'Unknown',
      year: year ? parseInt(year) : null
    },
    ground_truth: {
      odometer: odometerData,
      fuel_level: fuelData,
      coolant_temp: tempData,
      outside_temp: outsideTempData,
      warning_lights: warningLightsData,
      oil_life: oilLifeData
    },
    image_quality: {
      lighting,
      angle,
      resolution,
      clarity,
      overall_quality: overallQuality.toUpperCase()
    },
    labeling_metadata: {
      labeled_by: 'manual',
      labeled_date: new Date().toISOString().split('T')[0],
      review_status: 'pending',
      notes: finalNotes || 'Manual labeling session'
    }
  };
  
  // Save the label file
  fs.writeFileSync(labelPath, JSON.stringify(groundTruth, null, 2));
  
  console.log('\n✅ Ground truth label created successfully!');
  console.log(`📁 Saved to: ${labelPath}`);
  console.log('\n📊 Summary:');
  console.log(`- Vehicle: ${groundTruth.vehicle_info.year} ${groundTruth.vehicle_info.make} ${groundTruth.vehicle_info.model}`);
  console.log(`- Odometer: ${odometerData.visible ? `${odometerData.value} ${odometerData.unit}` : 'Not visible'}`);
  console.log(`- Fuel Level: ${fuelData.visible ? fuelData.display_text : 'Not visible'}`);
  console.log(`- Warning Lights: ${warningLightsData.lights.length > 0 ? warningLightsData.lights.join(', ') : 'None'}`);
  console.log(`- Image Quality: ${overallQuality.toUpperCase()}`);
  
  rl.close();
}

createGroundTruthLabel().catch(console.error);
