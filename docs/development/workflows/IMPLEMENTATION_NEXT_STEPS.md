# Vision Schema Implementation - Next Steps

## ✅ **Completed**

### **1. Critical Rules Merged into System Prompt**
- ✅ Moved all critical rules into `DASHBOARD_SYSTEM_PROMPT`
- ✅ Removed duplicate system message after few-shot examples
- ✅ OpenAI now receives single system prompt at start (best practice)

**Why:** OpenAI docs recommend single system message. Multiple system messages may not be weighted equally.

---

### **2. Validation Layer Implemented**
- ✅ `validateDashboardExtraction()` - Catches extraction errors
- ✅ `autoCorrectDashboard()` - Fixes common AI mistakes
- ✅ `normalizeOdometerToMiles()` - Converts km to miles
- ✅ `processDashboardExtraction()` - Full pipeline

**Catches:**
- Trip meter exceeding odometer (swapped values)
- Fuel eighths outside 0-8 range
- Non-integer fuel values
- Temperature values without units
- Confidence scores outside 0-1 range
- Negative or excessive odometer readings

---

### **3. Comprehensive Test Suite**
- ✅ Created `/lib/vision/validators/__tests__/dashboard.test.ts`
- ✅ Tests all validation rules
- ✅ Tests auto-correct logic
- ✅ Tests km→miles conversion

**Run tests:**
```bash
npm test lib/vision/validators/__tests__/dashboard.test.ts
```

---

## ⏳ **To Do**

### **1. Test Few-Shot Example Impact** 🎯 **High Priority**

**Problem:** Few-shot examples add ~1200 tokens per request (+40% cost, +200ms latency).

**Question:** Do they improve accuracy enough to justify cost?

**Tool Created:** `/lib/vision/tools/test-few-shot-impact.ts`

**Process:**
1. Collect 5-10 real dashboard photos
2. Manually verify expected values (odometer, fuel, trip meters)
3. Run A/B test: with vs without few-shot examples
4. Compare accuracy and cost
5. Make data-driven decision

**Expected Results:**

| Scenario | Action |
|----------|--------|
| Same accuracy, 40% less cost | ✅ Remove few-shot |
| 30% better accuracy, 40% more cost | ⚖️ Business decision |
| Worse accuracy with few-shot | ❌ Remove immediately |

**Estimated Time:** 2-3 hours (most time is photo collection)

---

### **2. Production Integration** 🎯 **Medium Priority**

**Current State:** Old schema still in use

**Migration Path:**

**Step 1: Update dashboard processor**
```typescript
// Old
import { DOCUMENT_SCHEMAS } from '@/lib/vision/schemas'
const schema = DOCUMENT_SCHEMAS.dashboard_snapshot

// New
import { 
  buildExtractionPrompt,
  processDashboardExtraction 
} from '@/lib/vision/schemas'

const messages = buildExtractionPrompt('dashboard_snapshot', imageBase64)
const rawData = await extractWithAI(messages)
const { data, validation } = processDashboardExtraction(rawData)

if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
  // Handle errors
}
```

**Step 2: Update API endpoint**
- Use validated `data.fuel_eighths` instead of `data.fuel_level?.value`
- Use `data.trip_a_miles` instead of `data.trip_meters?.[0]?.value`
- Use `data.odometer_miles + data.odometer_unit` instead of `data.odometer_raw`

**Step 3: Test with real uploads**
- Upload 10+ dashboard photos
- Verify extraction quality
- Check validation catches errors
- Monitor confidence scores

**Step 4: Deploy**
- Enable validation in production
- Set up error monitoring
- Alert on repeated validation failures
- Manual review queue for low confidence (<0.5)

---

### **3. Monitoring & Alerting** 🎯 **Low Priority (but important)**

**Metrics to track:**
- Validation error rate (should be <5%)
- Average confidence score (should be >0.8)
- Auto-correct rate (how often we fix mistakes)
- Extraction cost per upload
- Extraction latency

**Alerts:**
- Validation error rate >10%
- Average confidence <0.7
- Extraction failures >5 in 1 hour

**Dashboard:**
```
Extraction Quality (Last 24h)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Successful:       487 (97.4%)
Validation Errors: 13 (2.6%)
Avg Confidence:    0.92
Avg Cost:         $0.0018
Avg Latency:       2.3s

Most Common Errors:
1. Trip meter > odometer (8 cases)
2. Fuel eighths out of range (3 cases)
3. Missing odometer unit (2 cases)
```

---

## 📊 **Decision Tree**

```
Start
  │
  ├─ Run validation tests
  │  └─ All pass? → Continue
  │     └─ Failures? → Fix validator
  │
  ├─ Test few-shot impact
  │  ├─ Same accuracy? → Remove few-shot ✅
  │  ├─ Better with few-shot? → Cost/benefit analysis
  │  └─ Worse with few-shot? → Remove immediately ❌
  │
  ├─ Production integration
  │  ├─ Update processor
  │  ├─ Update API endpoint
  │  ├─ Test with real photos
  │  └─ Deploy
  │
  └─ Monitor & iterate
     ├─ Track metrics
     ├─ Alert on issues
     └─ Continuously improve
```

---

## 🎯 **Immediate Next Action**

**Test few-shot example impact:**

1. **Collect Photos** (30 min)
   - Upload 5-10 dashboard photos
   - Include variety (trip meters, fuel levels, km/miles)

2. **Prepare Test Cases** (30 min)
   - Convert to base64
   - Manually verify expected values
   - Add to test script

3. **Run Test** (1 hour)
   - Execute A/B comparison
   - Wait for results
   - Review accuracy vs cost

4. **Make Decision** (5 min)
   - Keep few-shot if accuracy gain > cost increase
   - Remove if same/worse accuracy
   - Document decision

**Total Time:** ~2 hours

**Impact:**
- Potential 40% cost reduction
- Or validated accuracy improvement
- Data-driven decision on prompt structure

---

## 💡 **Success Criteria**

### **Short Term (This Week)**
- [x] Validation tests pass
- [ ] Few-shot impact measured
- [ ] Keep/remove decision made
- [ ] Production integration planned

### **Medium Term (This Month)**
- [ ] New schema in production
- [ ] Validation catching errors
- [ ] Monitoring dashboard live
- [ ] Extraction quality >95%

### **Long Term (Next Quarter)**
- [ ] Cost optimized (few-shot decision implemented)
- [ ] Auto-correct reducing manual review
- [ ] Confidence scores calibrated
- [ ] A/B testing infrastructure for prompt improvements

---

## 📚 **Resources**

**Documentation:**
- `/docs/VISION_SCHEMA_REFACTOR.md` - Architecture overview
- `/docs/SCHEMA_FIXES_SUMMARY.md` - What was fixed
- `/lib/vision/tools/README.md` - Testing guide

**Code:**
- `/lib/vision/schemas/fields.ts` - Clean interfaces
- `/lib/vision/prompts/dashboard.ts` - Extraction instructions
- `/lib/vision/validators/dashboard.ts` - Validation logic
- `/lib/vision/prompts/builder.ts` - Prompt assembly

**Tests:**
- `/lib/vision/validators/__tests__/dashboard.test.ts` - Validation tests
- `/lib/vision/tools/test-few-shot-impact.ts` - A/B testing tool

---

## 🚀 **Quick Start**

```bash
# 1. Run validation tests
npm test lib/vision/validators/__tests__/dashboard.test.ts

# 2. Collect dashboard photos (manual)
# - Upload 5-10 photos
# - Convert to base64
# - Add to test-few-shot-impact.ts

# 3. Run few-shot impact test
npm run test:few-shot-impact

# 4. Review results and decide

# 5. Integrate into production
# - Update dashboard processor
# - Test with real uploads
# - Deploy with monitoring
```

---

**Status:** ✅ Architecture complete. Validation tested. Ready to measure few-shot impact and deploy.
