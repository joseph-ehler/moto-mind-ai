# MotoMindAI Demo Script
## Smartphone-First Fleet Intelligence Demo

### Overview
This demo shows the complete smartphone-to-explanation pipeline:
1. **Photo Capture** → OCR extraction with confidence scores
2. **Data Confirmation** → User verification and editing
3. **Metrics Computation** → Real-time calculation from manual events
4. **Explanation Generation** → LLM reasoning with audit trails
5. **Data Quality Feedback** → Clear guidance for improvement

---

## Demo Flow (5 minutes)

### 1. Setup (30 seconds)
```bash
# Start the development server
cd motomind-ai
npm run dev

# Open in browser
open http://localhost:3005
```

### 2. Capture Vehicle Data (2 minutes)

**Navigate to Data Capture:**
- Click "Capture Data" or visit `/capture`
- Select "Truck 47" from vehicle dropdown

**Capture Odometer Reading:**
- Click "Odometer Reading" 
- Take photo of odometer (or upload sample image)
- OCR extracts: "73,854 miles" with 89% confidence
- User confirms: "Looks right" ✓
- Data saved automatically

**Capture Fuel Receipt:**
- Click "Fuel Receipt"
- Take photo of receipt (or upload sample)
- OCR extracts: "19.2 gallons, $84.67" with 91% confidence
- User edits date if needed
- Confirm and save ✓

### 3. Ask Fleet Intelligence Question (2 minutes)

**Navigate to Dashboard:**
- Return to main dashboard (`/`)
- Select "Truck 47" from vehicle list
- Notice status: "FLAGGED" with data quality: 85%

**Ask the Key Question:**
- In chat interface, type: **"Why was Truck 47 flagged?"**
- System processes in real-time:
  - ✅ Recomputes metrics from manual events
  - ✅ Evaluates deterministic fleet rules
  - ✅ Generates LLM explanation with evidence
  - ✅ Creates audit trail

**Review Explanation:**
```
Answer: Truck 47 flagged due to declining fuel efficiency and overdue maintenance

Root Causes:
• Fuel efficiency 10.4 MPG vs baseline 12.5 MPG (16% decline)
• Maintenance overdue by 95 days since last service
• Recent harsh braking events indicate brake wear

Supporting Data:
• fuel_efficiency_mpg: 10.4 (threshold: 12.5)
• days_since_service: 95 (threshold: 90)
• brake_wear_estimated: high (from harsh events)

Recommendations:
• Schedule brake inspection immediately
• Check fuel system for efficiency loss
• Update maintenance schedule to prevent future issues

Data Quality: 85% complete (High confidence)
Sources: Odometer photo, Fuel receipt, Maintenance records
```

### 4. Show Data Quality Guidance (30 seconds)

**Data Quality Panel:**
- Completeness: 85% (Good)
- Missing: Recent maintenance record
- Recommendation: "Add last service receipt to improve accuracy"
- Next action: "Take photo of brake pads for visual inspection"

---

## Key Value Propositions Demonstrated

### 1. **Zero Hardware Required**
- No OBD dongles, no telematics contracts
- Works with any smartphone camera
- Immediate setup, no installation

### 2. **User-Controlled Data Quality**
- OCR confidence scores visible
- User verification prevents errors
- Clear guidance on missing data

### 3. **Explainable Intelligence**
- Every recommendation backed by evidence
- Confidence scores for reliability
- Full audit trail for compliance

### 4. **Production-Grade Safety**
- Data validation with Zod schemas
- Circuit breakers for API resilience
- Multi-tenant isolation with RLS

---

## Technical Highlights

### Smartphone OCR Pipeline
```typescript
Photo → Tesseract.js → Confidence Score → User Verification → Structured Data
```

### Metrics Computation
```typescript
Manual Events → Daily Aggregation → Rule Evaluation → LLM Explanation
```

### Data Quality Scoring
```typescript
Completeness % + Latency + Missing Metrics → Confidence Level → Recommendations
```

---

## Demo Variations

### For Individual Owners
- Focus on simplicity: "Take 2 photos, get insights"
- Emphasize cost savings vs. traditional telematics
- Show maintenance reminders and fuel tracking

### For Small Fleets (2-10 vehicles)
- Multi-vehicle dashboard
- Fleet-wide patterns and comparisons
- DOT compliance and audit trails

### For Investors/Technical Audience
- Show database schema and RLS policies
- Demonstrate circuit breaker resilience
- Explain smartphone-first competitive advantage

---

## Success Metrics

**User Engagement:**
- Time to first insight: <5 minutes
- OCR accuracy: >80% confidence on clear photos
- User confirmation rate: >90% (minimal editing needed)

**Technical Performance:**
- Explanation generation: <5 seconds P95
- Data quality feedback: Real-time
- System reliability: Circuit breakers prevent failures

**Business Value:**
- Cost advantage: $19/month vs $50-100/month telematics
- Market expansion: Individual owners + small fleets
- Compliance ready: Full audit trails for DOT

---

## Troubleshooting

**Low OCR Confidence (<60%):**
- Retake photo in better lighting
- Focus on specific numbers/text areas
- Manual entry fallback available

**Missing Data Quality:**
- Clear recommendations shown
- "What to add next" guidance
- Progressive improvement over time

**API Failures:**
- Circuit breakers prevent cascading failures
- Graceful degradation with cached data
- User-friendly error messages

---

*"Fleet intelligence you can explain, audit, and trust - powered by your smartphone"*
