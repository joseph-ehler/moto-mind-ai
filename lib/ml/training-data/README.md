# Training Data for Dashboard Processing

This directory contains training and validation data for the dashboard processing system.

## Directory Structure

```
training-data/
├── dashboards/
│   ├── raw/                    # Original dashboard images (16 images)
│   ├── labeled/               # Ground truth labels (JSON files)
│   ├── test-results/          # System output for comparison
│   └── validation-reports/    # Test results and accuracy reports
├── other-documents/           # Future: service invoices, fuel receipts, etc.
└── README.md                  # This file
```

## Dashboard Images Inventory

**Current Collection (16 images):**
- `$_57.jpeg` - Unknown dashboard
- `2013-Honda-Accord-EX-instrument-cluster.jpg` - 2013 Honda Accord EX
- `Gemini_Generated_Image_3el7om3el7om3el7.png` - AI generated dashboard
- `Gemini_Generated_Image_fygcilfygcilfygc.png` - AI generated dashboard
- `MY26_CRV_I1_10inDIC.jpg` - Honda CR-V digital cluster
- `YA255_25-6.webp` - Unknown dashboard
- `YA420_29.jpg` - Unknown dashboard
- `ZA159_24.webp` - Unknown dashboard
- `ZA201_25.webp` - Unknown dashboard
- `dashboard-audi-audi-a4-a9ed58-1024.jpg` - Audi A4 dashboard
- `jolene.jpg` - Unknown dashboard
- `s-l1200 (1).jpg` - Unknown dashboard
- `s-l1200.jpg` - Unknown dashboard
- `s-l1600 (1).webp` - Unknown dashboard
- `s-l1600 (2).webp` - Unknown dashboard
- `s-l1600.webp` - Unknown dashboard

## Ground Truth Labeling Process

Each dashboard image needs a corresponding JSON file with ground truth data:

### Label File Format: `{image_name}.json`

```json
{
  "image_file": "2013-Honda-Accord-EX-instrument-cluster.jpg",
  "vehicle_info": {
    "make": "Honda",
    "model": "Accord EX",
    "year": 2013
  },
  "ground_truth": {
    "odometer": {
      "value": 85432,
      "unit": "miles",
      "visible": true,
      "confidence": "high",
      "notes": "Digital display clearly visible"
    },
    "fuel_level": {
      "type": "eighths",
      "value": 6,
      "display_text": "3/4 full",
      "visible": true,
      "confidence": "high",
      "notes": "Analog gauge with clear needle position"
    },
    "coolant_temp": {
      "status": "normal",
      "gauge_position": "center",
      "visible": true,
      "confidence": "medium",
      "notes": "Gauge visible but small"
    },
    "outside_temp": {
      "value": null,
      "unit": null,
      "visible": false,
      "confidence": "n/a",
      "notes": "Not visible in this dashboard"
    },
    "warning_lights": {
      "lights": ["CHECK_ENGINE"],
      "visible": true,
      "confidence": "high",
      "notes": "Check engine light clearly illuminated"
    },
    "oil_life": {
      "percent": null,
      "visible": false,
      "confidence": "n/a",
      "notes": "Not displayed in this view"
    }
  },
  "image_quality": {
    "lighting": "good",
    "angle": "straight",
    "resolution": "high",
    "clarity": "excellent",
    "overall_quality": "A"
  },
  "labeling_metadata": {
    "labeled_by": "expert",
    "labeled_date": "2025-09-30",
    "review_status": "pending",
    "notes": "Clear example of Honda digital/analog hybrid cluster"
  }
}
```

## Validation Testing Process

1. **Label Ground Truth**: Create JSON labels for all dashboard images
2. **Run System Tests**: Process each image through vision system
3. **Compare Results**: Automated comparison of system output vs ground truth
4. **Generate Reports**: Accuracy metrics and failure analysis
5. **Iterate**: Fix issues and retest

## Usage

### Run Systematic Validation
```bash
npm run test:dashboard-validation
```

### Generate Training Report
```bash
npm run test:training-report
```

### Label New Images
```bash
npm run label:dashboard-image <image-name>
```

## Quality Standards

### Image Requirements
- **Resolution**: Minimum 800x600 pixels
- **Lighting**: Clear visibility of all gauges
- **Angle**: Straight-on view preferred
- **Focus**: Sharp, not blurry
- **Coverage**: Full dashboard cluster visible

### Labeling Requirements
- **Accuracy**: Expert-level precision required
- **Completeness**: All visible elements labeled
- **Consistency**: Same labeling standards across all images
- **Documentation**: Clear notes for ambiguous cases

## Current Status

- ✅ **16 dashboard images collected**
- ❌ **0 images labeled** (needs ground truth)
- ❌ **0 validation tests run**
- ❌ **0 accuracy reports generated**

## Next Steps

1. **Priority 1**: Label 5-10 high-quality images first
2. **Priority 2**: Run validation tests on labeled subset
3. **Priority 3**: Generate initial accuracy report
4. **Priority 4**: Label remaining images
5. **Priority 5**: Full systematic validation

## Notes

- Focus on diverse vehicle types and dashboard styles
- Include edge cases (low fuel, warning lights, different units)
- Document any ambiguous or unclear readings
- Maintain chain of custody for all training data
