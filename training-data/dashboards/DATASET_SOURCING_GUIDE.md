# Dashboard Image Dataset Sourcing Guide

## 🎯 **Goal: 50+ Rigorously Labeled Dashboard Images**

To achieve production-ready validation, we need a diverse dataset covering:
- **Different vehicle makes/models** (Honda, Toyota, Ford, Chevy, BMW, Audi, etc.)
- **Various dashboard types** (analog, digital, hybrid clusters)
- **Different conditions** (day/night, various lighting)
- **Range of readings** (low/high mileage, different fuel levels, warning scenarios)

---

## 📊 **Target Dataset Composition**

### **Vehicle Make Distribution (50+ images):**
- **Honda**: 8-10 images (Civic, Accord, CR-V, Pilot)
- **Toyota**: 8-10 images (Camry, Corolla, RAV4, Prius)
- **Ford**: 6-8 images (F-150, Focus, Escape, Mustang)
- **Chevrolet**: 6-8 images (Silverado, Malibu, Equinox, Cruze)
- **BMW**: 4-6 images (3 Series, 5 Series, X3, X5)
- **Audi**: 4-6 images (A3, A4, Q5, Q7)
- **Nissan**: 4-6 images (Altima, Sentra, Rogue)
- **Hyundai/Kia**: 4-6 images (Elantra, Sonata, Optima)
- **Other brands**: 4-6 images (Subaru, Mazda, VW, etc.)

### **Dashboard Type Distribution:**
- **Analog clusters**: 40% (traditional needle gauges)
- **Digital clusters**: 35% (LCD/LED displays)
- **Hybrid clusters**: 25% (mix of analog and digital)

### **Reading Diversity:**
- **Odometer ranges**: 
  - Low (0-50K): 20%
  - Medium (50K-150K): 50%
  - High (150K+): 30%
- **Fuel levels**: Even distribution across E, 1/4, 1/2, 3/4, F
- **Warning lights**: 30% with warnings, 70% without
- **Temperature readings**: Mix of °F and °C displays

---

## 🔍 **Sourcing Strategies**

### **1. Automotive Forums & Communities**
**Reddit Communities:**
- r/cars - Dashboard photos in posts
- r/MechanicAdvice - Diagnostic photos often show dashboards
- r/whatcarshouldIbuy - Interior photos
- r/Honda, r/Toyota, etc. - Brand-specific communities

**Automotive Forums:**
- CarGurus.com - Used car listings with interior photos
- Cars.com - Detailed vehicle photos
- AutoTrader.com - Interior shots in listings
- Edmunds.com - Review photos

### **2. YouTube Screenshots**
**Car Review Channels:**
- Doug DeMuro - Detailed interior reviews
- Savage Geese - Technical reviews with dashboard shots
- TheStraightPipes - Interior walkthroughs
- Redline Reviews - Dashboard feature explanations

**Search Terms:**
- "dashboard tour [car model]"
- "instrument cluster [car model]"
- "interior review [car model]"
- "gauge cluster [car model]"

### **3. Stock Photo Sources**
**Free Sources:**
- Unsplash.com - Search "car dashboard", "instrument cluster"
- Pexels.com - Automotive interior photos
- Pixabay.com - Vehicle dashboard images

**Paid Sources:**
- Shutterstock.com - High-quality automotive photos
- Getty Images - Professional car interior shots
- Adobe Stock - Dashboard and gauge photos

### **4. Manufacturer Websites**
**Official Sources:**
- Honda.com - Model galleries with interior shots
- Toyota.com - Feature highlights showing dashboards
- Ford.com - Technology demonstrations
- BMW.com - iDrive and cluster showcases

### **5. Automotive Journalism**
**Review Sites:**
- MotorTrend.com - Interior photo galleries
- Car and Driver - Dashboard feature articles
- Road & Track - Technical reviews
- Jalopnik.com - Quirky dashboard features

---

## 📋 **Image Selection Criteria**

### **✅ Good Images:**
- **High resolution** (1024x768 minimum)
- **Clear dashboard view** (not cropped or partial)
- **Readable gauges** (numbers and needles visible)
- **Good lighting** (not too dark or overexposed)
- **Straight angle** (not too tilted or skewed)
- **Minimal glare** (reflections don't obscure readings)

### **❌ Avoid These Images:**
- **Low resolution** or pixelated
- **Partial dashboard views** (missing key gauges)
- **Severe glare** obscuring readings
- **Motion blur** from moving vehicle
- **Extreme angles** making readings unclear
- **Modified dashboards** (aftermarket gauges)

---

## 🏷️ **Image Naming Convention**

Use consistent naming for easy organization:

```
[year]-[make]-[model]-[variant]-[condition]-[sequence].jpg

Examples:
2020-honda-civic-si-day-01.jpg
2018-toyota-camry-hybrid-night-01.jpg
2019-ford-f150-xlt-dashboard-02.jpg
2021-bmw-x3-m40i-cluster-01.jpg
```

---

## 📁 **File Organization**

```
training-data/dashboards/
├── raw/                          # Original images
│   ├── 2020-honda-civic-si-day-01.jpg
│   ├── 2018-toyota-camry-hybrid-night-01.jpg
│   └── ...
├── labeled/                      # Ground truth labels
│   ├── 2020-honda-civic-si-day-01.json
│   ├── 2018-toyota-camry-hybrid-night-01.json
│   └── ...
├── validation-results/           # Test results
├── sourcing-log.md              # Track where images came from
└── labeling-progress.md         # Track labeling status
```

---

## 📝 **Sourcing Documentation**

Create a log file tracking image sources:

```markdown
# Image Sourcing Log

## 2020-honda-civic-si-day-01.jpg
- **Source**: Honda.com official gallery
- **URL**: https://honda.com/civic-si/gallery
- **License**: Fair use for research
- **Date**: 2025-09-30
- **Notes**: Clear analog cluster, good lighting

## 2018-toyota-camry-hybrid-night-01.jpg
- **Source**: YouTube screenshot
- **Channel**: Doug DeMuro
- **Video**: "2018 Toyota Camry Review"
- **Timestamp**: 3:45
- **Date**: 2025-09-30
- **Notes**: Digital cluster with hybrid indicators
```

---

## ⚖️ **Legal Considerations**

### **Fair Use Guidelines:**
- **Research/Educational Purpose**: Our validation is for system improvement
- **No Commercial Use**: Not using images for profit
- **Attribution**: Document sources appropriately
- **Transformation**: Images used for technical analysis, not republication

### **Best Practices:**
- **Prefer public domain** or creative commons images
- **Screenshot public videos** rather than download copyrighted images
- **Use manufacturer press photos** when available
- **Document all sources** for transparency

---

## 🎯 **Collection Strategy**

### **Week 1: Foundation Set (15 images)**
- Focus on most common vehicles (Honda, Toyota, Ford)
- Mix of analog and digital clusters
- Clear, high-quality images only
- Begin with easily sourceable images

### **Week 2: Diversity Expansion (20 images)**
- Add luxury brands (BMW, Audi, Mercedes)
- Include hybrid/electric vehicle displays
- Various lighting conditions
- Different fuel levels and warning states

### **Week 3: Edge Cases (15 images)**
- Older vehicles with unique clusters
- High-mileage odometers
- Multiple warning lights active
- Unusual gauge configurations

### **Week 4: Quality Control & Gaps**
- Review dataset for gaps
- Replace low-quality images
- Ensure balanced distribution
- Prepare for labeling phase

---

## 📊 **Progress Tracking**

Create a simple spreadsheet tracking:
- **Image filename**
- **Vehicle make/model/year**
- **Dashboard type** (analog/digital/hybrid)
- **Source** (website/video/forum)
- **Quality rating** (A/B/C)
- **Labeling status** (not started/in progress/complete/verified)
- **Special features** (warnings/high mileage/etc.)

---

## 🚀 **Next Steps**

1. **Start with existing 3 images** - Re-label with rigorous standards
2. **Source 10-15 high-quality images** from diverse vehicles
3. **Begin systematic labeling** using our rigorous standards
4. **Validate labels** with second reviewer
5. **Test against vision system** to measure true accuracy
6. **Expand dataset** based on initial results
7. **Achieve 50+ validated images** before production deployment

**Remember: Quality over quantity. Better to have 20 perfectly labeled images than 50 questionable ones.**
