# Vision Testing Tools

## 🧪 **Validation Tests**

Location: `/lib/vision/validators/__tests__/dashboard.test.ts`

**Run tests:**
```bash
npm test lib/vision/validators/__tests__/dashboard.test.ts
```

**What it tests:**
- ✅ Valid extractions pass
- ✅ Swapped odometer/trip meters caught
- ✅ Fuel eighths out of range (0-8) caught
- ✅ Non-integer fuel values caught
- ✅ Confidence out of range (0-1) caught
- ✅ Outside temp without unit caught
- ✅ Low confidence warnings
- ✅ Auto-correct swaps odometer/trip when obvious
- ✅ Auto-correct defaults odometer unit to miles
- ✅ Auto-correct rounds decimal fuel values
- ✅ Normalize km to miles conversion

**Example output:**
```
PASS  lib/vision/validators/__tests__/dashboard.test.ts
  validateDashboardExtraction
    ✓ passes valid extraction (2 ms)
    ✓ catches swapped odometer and trip meter (1 ms)
    ✓ catches fuel eighths out of range (1 ms)
    ✓ catches confidence out of range (1 ms)
```

---

## 📊 **Few-Shot Impact Test**

Location: `/lib/vision/tools/test-few-shot-impact.ts`

**Purpose:** Measure if few-shot examples justify their token cost.

### **Setup**

1. **Collect Real Dashboard Photos**
   - Take 5-10 dashboard photos from your vehicles
   - Include various scenarios:
     - Main odometer only
     - Trip meter only
     - Both visible
     - Different fuel levels
     - km vs miles units

2. **Convert to Base64**
   ```bash
   base64 -i dashboard1.jpg > dashboard1.txt
   ```

3. **Manually Verify Expected Values**
   - Look at each photo
   - Note actual odometer reading
   - Note actual fuel level (0-8 eighths)
   - Note trip meter if visible

4. **Add Test Cases**
   ```typescript
   const testCases: TestCase[] = [
     {
       name: 'Honda Civic - Trip meter visible',
       imageBase64: fs.readFileSync('dashboard1.txt', 'utf8'),
       expectedOdometer: 85432,
       expectedFuelEighths: 8,
       expectedTripA: 234.1
     },
     {
       name: 'Toyota Camry - Main odometer only',
       imageBase64: fs.readFileSync('dashboard2.txt', 'utf8'),
       expectedOdometer: 127856,
       expectedFuelEighths: 4,
       expectedTripA: null
     }
   ]
   ```

### **Run Test**

```bash
# Add to package.json scripts:
"test:few-shot-impact": "ts-node lib/vision/tools/test-few-shot-impact.ts"

# Run:
npm run test:few-shot-impact
```

### **Example Output**

```
🧪 Testing Few-Shot Example Impact

Running 10 test cases...

📸 Testing: Honda Civic - Trip meter visible
  🎯 With few-shot examples...
  ✅ With few-shot: CORRECT
  🎯 Without few-shot examples...
  ✅ Without few-shot: CORRECT

📸 Testing: Toyota Camry - Main odometer only
  🎯 With few-shot examples...
  ✅ With few-shot: CORRECT
  🎯 Without few-shot examples...
  ❌ Without few-shot: WRONG (confused trip with odometer)

...

📊 SUMMARY

Accuracy:
  With few-shot:    10/10 (100.0%)
  Without few-shot: 7/10 (70.0%)

Cost per extraction:
  With few-shot:    $0.003240
  Without few-shot: $0.001820
  Savings:          $0.001420 (43.8%)

Tokens per extraction:
  With few-shot:    2847 tokens
  Without few-shot: 1623 tokens
  Reduction:        1224 tokens (43.0%)

💡 RECOMMENDATION

⚖️  Keep few-shot examples - they improve accuracy by 30.0%
   Cost increase: $0.001420 per extraction
   At 1000 extractions/month: $1.42 additional cost
```

### **Decision Matrix**

| Scenario | Recommendation |
|----------|----------------|
| **Same accuracy** | ✅ Remove few-shot (save tokens/cost) |
| **Better with few-shot** | ⚖️ Keep if accuracy gain > cost increase |
| **Worse with few-shot** | ❌ Remove immediately |

### **Cost Analysis**

**Typical few-shot overhead:**
- +1200 tokens per request (~40% increase)
- +$0.001-0.002 per extraction
- At 1000 extractions/month: +$1-2

**Worth it if:**
- Accuracy improves by >10%
- Reduces manual corrections
- Prevents bad data in database

**Not worth it if:**
- Accuracy unchanged
- System prompt alone works well
- Budget-constrained

---

## 🎯 **Next Steps**

1. ✅ **Run validation tests** - Ensure validator catches errors
   ```bash
   npm test lib/vision/validators/__tests__/dashboard.test.ts
   ```

2. ⏳ **Collect real dashboards** - 5-10 photos from actual vehicles

3. ⏳ **Run few-shot impact test** - Measure accuracy vs cost
   ```bash
   npm run test:few-shot-impact
   ```

4. ⏳ **Decide on few-shot** - Keep or remove based on results

5. ⏳ **Production integration** - Use best-performing configuration

---

## 📝 **Testing Checklist**

### **Validation Layer** ✅
- [x] Created comprehensive tests
- [x] Tests catch swapped odometer/trip
- [x] Tests catch invalid ranges
- [x] Tests verify auto-correct
- [x] Tests verify km→miles conversion

### **Few-Shot Impact** ⏳
- [ ] Collect 5-10 real dashboard photos
- [ ] Convert to base64
- [ ] Manually verify expected values
- [ ] Add test cases to script
- [ ] Run comparison test
- [ ] Make keep/remove decision
- [ ] Update production config

### **Production Deployment** ⏳
- [ ] Validation layer active
- [ ] Few-shot decision made
- [ ] Error monitoring in place
- [ ] Cost tracking enabled
- [ ] Manual review process for low confidence

---

## 💡 **Pro Tips**

### **Validation Tests**
- Run on every commit (CI/CD)
- Add new tests when bugs found
- Test edge cases (empty fuel, max odometer, etc.)

### **Few-Shot Testing**
- Use diverse dashboard styles (different car brands)
- Include edge cases (trip only, km units, etc.)
- Test multiple times for consistency (temperature=0 helps)
- Calculate ROI: accuracy gain vs cost increase

### **Production Monitoring**
- Track validation errors over time
- Monitor confidence scores
- Alert on repeated extraction failures
- A/B test prompt changes
