# 🔍 **VISION CAPTURE INFRASTRUCTURE AUDIT**

> **Date:** 2025-01-11  
> **Purpose:** Audit existing vision capture before implementing Phase 2  
> **Focus:** Align with AI proposal validation flow

---

## **✅ WHAT WE ALREADY HAVE**

### **1. Vision Processing Pipeline** ✅

**Location:** `/lib/vision/`

#### **Key Files:**
- `pipeline-v2.ts` - NEW V2 pipeline (100% accuracy, 50% cheaper)
- `pipeline.ts` - V1 pipeline (legacy, still used for non-dashboard)
- `router.ts` - Routes requests to appropriate pipeline
- `data-extractor.ts` - Extraction logic
- `validators/` - Auto-correction & validation
- `prompts/` - Prompt engineering

#### **Capabilities:**
```typescript
// Dashboard extraction
processDashboardV2(imageBase64: string, engineState?: 'running' | 'accessory')
  → Returns: {
    odometer_miles, fuel_eighths, coolant_temp,
    warning_lights[], oil_life_percent, service_message
  }

// Other documents (uses V1)
processDocument(request: VisionRequest)
  → Returns: Extracted data based on document type
```

#### **Features:**
- ✅ Structured JSON output
- ✅ Auto-correction (swaps odometer/trip if confused)
- ✅ Warning light normalization
- ✅ Unit conversion (km → miles)
- ✅ Confidence scoring
- ✅ Processing metadata (timing, tokens, model)

---

### **2. API Endpoint** ✅

**Location:** `/pages/api/vision/process.ts`

#### **Flow:**
```
POST /api/vision/process
  ↓
Parse multipart form (image + metadata)
  ↓
Compress if large (> threshold)
  ↓
Convert to base64
  ↓
Route to vision pipeline
  ↓
Upload to Supabase storage
  ↓
Return extraction result
```

#### **Request:**
```typescript
{
  image: File,
  document_type: 'dashboard_snapshot' | 'fuel' | 'service' | ...,
  mode: 'test' | 'production',
  engine_state: 'running' | 'accessory' | null
}
```

#### **Response:**
```typescript
{
  success: true,
  result: {
    type: 'dashboard_snapshot',
    summary: 'Odometer 77,306 mi • Fuel 75% • Engine Normal',
    key_facts: {
      odometer_miles: 77306,
      fuel_eighths: 6,
      coolant_temp: 'normal',
      warning_lights: [],
      // ...
    },
    confidence: 0.95,
    processing_metadata: { /* ... */ }
  },
  publicUrl: 'https://storage.supabase.co/...'
}
```

---

### **3. Capture Components** ✅

**Location:** `/components/capture/`

#### **Available Components:**
```
capture/
├── PhotoCapture.tsx          - Basic photo capture
├── CameraCapture.tsx         - Camera with live preview
├── FuelReceiptCapture.tsx    - Fuel-specific capture
├── DataConfirmation.tsx      - User validation UI ⭐
├── DocumentConfirmation.tsx  - Document validation
├── VehicleConfirmation.tsx   - Vehicle association
└── types.ts                  - Shared types
```

#### **DataConfirmation Component:**
```tsx
<DataConfirmation
  kind="fuel_purchase" | "odometer_reading" | "maintenance" | "issue_report"
  extractedData={visionResult.key_facts}
  vehicleId={vehicleId}
  onConfirm={(eventData) => { /* Save to DB */ }}
  onCancel={() => { /* Go back */ }}
/>
```

**Features:**
- ✅ Pre-populated form with extracted data
- ✅ User can edit any field
- ✅ Saves to Supabase after confirmation
- ✅ Shows confidence scores
- ✅ PDF export option

---

### **4. Vision Components** ✅

**Location:** `/components/vision/`

```
vision/
├── UnifiedCameraCapture.tsx       - Unified capture interface
├── DashboardCaptureModal.tsx      - Dashboard-specific modal
├── RoutineDashboardCapture.tsx    - Routine capture flow
└── ...
```

---

## **⚠️ WHAT'S MISSING FOR PHASE 2**

### **1. AI Proposal Review UI** ❌

**Current State:**
- DataConfirmation shows extracted data in a form
- User edits fields one by one
- No clear "AI proposed this" messaging

**What We Need:**
```tsx
<AIProposalReview
  extractedData={visionResult}
  onAccept={(data) => { /* Save */ }}
  onEdit={(field) => { /* Open editor */ }}
  onRetake={() => { /* Go back to camera */ }}
/>
```

**Should Include:**
- Clear "AI Proposal" header
- Confidence badges per field
- "Looks good!" quick accept button
- Inline field editing
- "Retake photo" option
- Data source indicators (vision, EXIF, GPS)

---

### **2. Multi-Modal Capture Entry** ❌

**Current State:**
- Components are specific (FuelReceiptCapture, PhotoCapture)
- No unified entry point

**What We Need:**
```tsx
<CaptureEntry
  mode="vision" | "chat" | "manual"
  eventType="fuel" | "service" | "damage" | ...
  onComplete={(event) => { /* Save */ }}
/>
```

**Flow:**
```
User taps "Add Event"
  ↓
Shows capture mode selector:
  [📷 Take Photo] [💬 AI Chat] [✍️ Manual Entry]
  ↓
Based on selection:
  - Vision → Camera → AI Proposal → Confirm
  - Chat → Conversational → AI Proposal → Confirm
  - Manual → Form → Review → Confirm
```

---

### **3. Quality Score Integration** ⚠️

**Current State:**
- Quality score calculation exists (`lib/quality-score.ts`)
- Not integrated with capture flow

**What We Need:**
- Show quality score in AI proposal
- Update score in real-time as user edits
- Show suggestions: "Add odometer for +15%"

---

### **4. Supplemental Data Integration** ❌

**Current State:**
- No GPS capture during photo
- No EXIF extraction
- No reverse geocoding

**What We Need:**
```tsx
// During capture
const location = await getCurrentLocation() // Optional
const exif = await extractExifData(photo)

// In proposal
<ProposalField 
  label="Location"
  value="Shell Station, 123 Main St"
  source="gps"
  editable
/>
```

---

### **5. Guided Multi-Photo Capture** ❌

**Current State:**
- Single photo capture only
- No guided flows

**What We Need:**
```tsx
<GuidedCapture
  flow="dashboard_snapshot"
  steps={[
    { title: 'Odometer', guidance: 'Get a clear shot of just the odometer' },
    { title: 'Fuel Gauge', guidance: 'Focus on the fuel gauge' },
    { title: 'Coolant', guidance: 'Show the temperature gauge' },
    // ...
  ]}
  onComplete={(photos) => { /* Process all */ }}
/>
```

---

## **🎯 ARCHITECTURE ALIGNMENT**

### **Current Flow:**
```
User opens camera
  ↓
Takes photo
  ↓
Uploads to /api/vision/process
  ↓
Gets extraction result
  ↓
Shows DataConfirmation form
  ↓
User edits/confirms
  ↓
Saves to database
```

### **Target Flow (Phase 2):**
```
User opens capture
  ↓
Chooses mode (Vision / Chat / Manual)
  ↓
[VISION PATH]
Takes photo
  ↓
Captures GPS (optional) + EXIF
  ↓
Uploads to /api/vision/process
  ↓
Shows AI PROPOSAL with:
  - Extracted data
  - Confidence per field
  - Data sources (vision / EXIF / GPS)
  - Quality score
  ↓
User validates:
  - "Looks good!" → Save
  - Edit field → Inline editor
  - "Retake" → Back to camera
  ↓
Calculate quality score
  ↓
Save to database with:
  - extracted_data
  - supplemental_data (EXIF, GPS)
  - quality score
```

---

## **🔗 HOW EXISTING PIECES FIT**

### **✅ Can Reuse:**

1. **Vision Pipeline** (`lib/vision/`)
   - Already returns structured data
   - Already includes confidence
   - Just need to display better

2. **API Endpoint** (`/api/vision/process`)
   - Already handles image upload
   - Already returns extraction
   - Just need to add GPS/EXIF passthrough

3. **Base Components** (`components/capture/`)
   - PhotoCapture can be foundation
   - CameraCapture has live preview
   - DataConfirmation has form logic

4. **Quality Score** (`lib/quality-score.ts`)
   - Already calculates score
   - Just need to integrate in UI

---

### **🔧 Need to Build:**

1. **AIProposalReview Component**
   - New UI for proposal validation
   - Replace/enhance DataConfirmation
   - Show confidence, sources, quality

2. **CaptureOrchestrator**
   - Unified entry point
   - Routes to Vision/Chat/Manual
   - Handles supplemental data

3. **GPS/EXIF Capture**
   - getCurrentLocation() during photo
   - extractExifData() from photo
   - Pass to vision API

4. **Multi-Photo Flow**
   - GuidedCapture component
   - Step-by-step instructions
   - Progress tracking

---

## **📋 RECOMMENDED APPROACH**

### **Phase 2A: Vision Capture + Validation**

#### **Week 1: AI Proposal UI**
1. Create `AIProposalReview` component
2. Integrate quality score display
3. Add confidence badges
4. Add "Looks good" / "Edit" / "Retake" actions
5. Test with existing vision pipeline

#### **Week 2: GPS + EXIF**
6. Add GPS capture (optional, with permission)
7. Add EXIF extraction from photos
8. Pass supplemental data through API
9. Show in AI proposal with source badges
10. Test reverse geocoding

#### **Week 3: Polish & Integration**
11. Update API to store supplemental_data
12. Add photo nudges for manual entries
13. Integrate with timeline (Phase 1 work)
14. End-to-end testing

---

### **Phase 2B: Multi-Photo (Later)**

#### **Week 4-5: Guided Flows**
1. Create `GuidedCapture` component
2. Implement dashboard 5-photo flow
3. Implement tire tread 4-photo flow
4. Add progress saving ("Resume later")
5. Test multi-photo processing

---

## **🚦 DECISION POINTS**

### **1. Reuse DataConfirmation or Build New?**

**Option A: Enhance DataConfirmation**
- ✅ Less work
- ✅ Proven component
- ❌ Has legacy patterns
- ❌ Harder to add new features

**Option B: Build AIProposalReview** ⭐ RECOMMENDED
- ✅ Clean slate
- ✅ Matches Phase 1 designs
- ✅ Better UX patterns
- ❌ More upfront work

**Decision:** Build new `AIProposalReview`, can still reference DataConfirmation logic

---

### **2. Inline Editing vs Modal?**

**Option A: Inline Editing**
```
┌────────────────────────────────┐
│ Cost    [$42.50]    [Edit]    │ ← Click edit, field becomes input
│ Gallons [13.2 gal]  [Edit]    │
└────────────────────────────────┘
```

**Option B: Edit Modal**
```
Click [Edit] → Opens modal with form
```

**Decision:** Inline editing (faster, less context switching)

---

### **3. GPS Permission Flow?**

**Option A: Ask upfront**
```
"Allow location? This helps auto-fill gas stations"
[Allow] [Skip]
```

**Option B: Ask when needed** ⭐ RECOMMENDED
```
User captures photo
  ↓
"We found a Shell station nearby. Is this where you filled up?"
[Yes, Shell] [No, different] [Don't ask again]
```

**Decision:** Ask contextually, after extraction

---

## **✅ SUMMARY**

### **Existing Infrastructure: B+**
- ✅ Vision pipeline is excellent
- ✅ API is solid
- ✅ Base components exist
- ⚠️ Needs better validation UX
- ❌ Missing supplemental data

### **Work Required:**
1. Build `AIProposalReview` component (2-3 days)
2. Add GPS + EXIF capture (1-2 days)
3. Integrate quality score in UI (1 day)
4. Polish & testing (2-3 days)

**Total: 6-9 days for Phase 2A**

### **Key Principle:**
**"AI proposes, human disposes"** - Always show proposal, never auto-save

---

## **📁 FILES TO CREATE (Phase 2A)**

```
components/capture/
├── AIProposalReview.tsx       ⭐ NEW - Main proposal UI
├── ProposalField.tsx           ⭐ NEW - Editable field with confidence
├── QualityScoreBadge.tsx       ⭐ NEW - Quality display
├── DataSourceBadge.tsx         ⭐ NEW - Show where data came from
└── CaptureOrchestrator.tsx     ⭐ NEW - Unified entry

lib/
├── gps-capture.ts              ⭐ NEW - GPS utilities
├── exif-extraction.ts          ⭐ NEW - EXIF utilities
└── quality-score.ts            ✅ EXISTS - Already done!

pages/api/vision/
└── process.ts                  🔧 UPDATE - Add supplemental data
```

---

## **🎯 NEXT STEP**

**Ready to build `AIProposalReview` component?**

This is the centerpiece of Phase 2 - the UI that shows AI extraction and lets users validate/edit before saving.

Want me to start with this component?

---

**Audit Complete:** Ready for Phase 2 implementation! ✅
