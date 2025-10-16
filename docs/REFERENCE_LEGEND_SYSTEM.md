# Reference Legend System for Warning Light Detection 📖

**Date:** October 2, 2025  
**Status:** Production Ready (Pending Image Upload)  
**Cost Impact:** +$0.01-0.02 per dashboard (+33-67%)

---

## 🎯 **Overview**

The Reference Legend System shows GPT-4o a visual dictionary of warning light symbols BEFORE analyzing the actual dashboard. This teaches the AI what symbols look like, improving recognition accuracy.

---

## 🔍 **How It Works**

### **Two-Step Process:**

**Step 1: Show the Legend**
```
GPT-4o receives:
- Reference image showing all common warning light symbols
- Text: "Study these symbols - use them as a visual dictionary"
```

**Step 2: Analyze Dashboard**
```
GPT-4o receives:
- User's actual dashboard photo
- Text: "Compare illuminated lights to the reference guide above"
```

**Result:** Better symbol matching because AI learned what each light looks like.

---

## 📁 **Setup Instructions**

### **Option A: Public Folder (Simplest)**

1. **Save the reference image:**
   - Download the Google screenshot showing warning light symbols
   - Save as `warning-lights-legend.jpg`
   - Place in `/public/reference-images/`

2. **Verify path:**
   ```
   /public/reference-images/warning-lights-legend.jpg
   ```

3. **Done!** System will automatically use local file.

---

### **Option B: Supabase Storage (Production)**

1. **Create bucket:**
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('reference-images', 'reference-images', true);
   ```

2. **Upload image:**
   - Via Supabase Dashboard: Storage → reference-images → Upload
   - Save as `warning-lights-legend.jpg`

3. **Update config:**
   ```typescript
   // Already configured in /lib/vision/config.ts
   // Will automatically use Supabase URL if available
   ```

4. **Get URL:**
   ```
   https://yourproject.supabase.co/storage/v1/object/public/reference-images/warning-lights-legend.jpg
   ```

---

## 🎛️ **Configuration**

### **Enable/Disable Feature:**

```typescript
// In .env
VISION_USE_REFERENCE_LEGEND=true  # or false

// Or programmatically
await processDashboardV2(imageBase64, engineState, {
  useReferenceLegend: true  // Override default
})
```

### **Default Behavior:**

```typescript
// In /lib/vision/config.ts
export const VISION_FEATURES = {
  useReferenceLegend: true  // Default ON
}
```

---

## 📊 **A/B Testing**

### **How to Test:**

```typescript
// Example: 50/50 A/B test
const useReferenceLegend = Math.random() > 0.5

const result = await processDashboardV2(imageBase64, engineState, {
  useReferenceLegend
})

// Track which variant was used
await logExperiment({
  variant: useReferenceLegend ? 'with_legend' : 'without_legend',
  accuracy: calculatedAccuracy,
  cost: estimatedCost
})
```

### **Metrics to Track:**

1. **Warning Light Accuracy**
   - % of correctly identified lights
   - False positive rate
   - False negative rate

2. **Cost per Request**
   - Without legend: ~$0.03
   - With legend: ~$0.04-0.05

3. **User Edits**
   - % of events requiring manual corrections
   - Specific lights that need correction

4. **Processing Time**
   - Latency impact of extra image

---

## 💰 **Cost Analysis**

### **Token Breakdown:**

| Variant | Input Tokens | Cost per Request | Monthly (1000 requests) |
|---------|--------------|------------------|-------------------------|
| Without Legend | ~1,800 | $0.03 | $30 |
| With Legend | ~2,300 | $0.04-0.05 | $40-50 |

**Increase:** +$10-20 per 1,000 requests (+33-67%)

### **ROI Calculation:**

**If accuracy improves by 10%:**
- Fewer user corrections needed
- Better data quality
- Improved user experience
- **Worth the cost ✅**

**If accuracy improves by <5%:**
- Marginal benefit
- May not justify cost increase
- **Consider disabling ❌**

---

## 🚀 **Implementation Status**

### **✅ Completed:**

1. ✅ Directory structure created
2. ✅ Config file with URL management
3. ✅ Prompt builder supports reference legend
4. ✅ Pipeline passes option through
5. ✅ A/B test flag implemented
6. ✅ Logging for tracking variant

### **⏳ Pending:**

1. ⏳ **Upload reference image** to `/public/reference-images/`
2. ⏳ Deploy and monitor
3. ⏳ Collect accuracy metrics
4. ⏳ Analyze A/B test results
5. ⏳ Make final decision (keep or remove)

---

## 📖 **Reference Image Requirements**

### **What Makes a Good Legend:**

✅ **Should have:**
- Clear, high-resolution symbols
- Standard automotive warning lights
- Good contrast/visibility
- Text labels for each symbol
- Organized by color/severity

❌ **Avoid:**
- Blurry or low-res images
- Non-standard symbols
- Poorly organized layout
- Missing labels
- Excessive branding

### **Recommended Image:**

The Google screenshot you provided is perfect! Shows:
- 22 common warning lights
- Clear symbols with labels
- Organized in grid
- Good contrast

---

## 🧪 **Testing Checklist**

Before full rollout:

- [ ] Reference image uploaded and accessible
- [ ] Test with legend shows image loads
- [ ] Test without legend still works
- [ ] A/B test flag working
- [ ] Logging captures variant used
- [ ] Cost tracking accurate
- [ ] Metrics collection ready
- [ ] Dashboard with NO lights detected correctly
- [ ] Dashboard with MULTIPLE lights detected correctly
- [ ] Unfamiliar warning lights handled gracefully

---

## 📈 **Expected Results**

### **Best Case:**
- Warning light accuracy: 85% → 97% (+12%)
- False positives: 15% → 3% (-80%)
- User edits: 20% → 5% (-75%)
- **ROI: Excellent ✅**

### **Likely Case:**
- Warning light accuracy: 85% → 92% (+7%)
- False positives: 15% → 8% (-47%)
- User edits: 20% → 12% (-40%)
- **ROI: Good ✅**

### **Worst Case:**
- Warning light accuracy: 85% → 87% (+2%)
- False positives: 15% → 13% (-13%)
- User edits: 20% → 18% (-10%)
- **ROI: Poor ❌ (disable feature)**

---

## 🔧 **Troubleshooting**

### **Image not loading:**

1. Check file exists:
   ```bash
   ls -la public/reference-images/warning-lights-legend.jpg
   ```

2. Check URL in config:
   ```typescript
   console.log(REFERENCE_LEGEND_URL)
   ```

3. Test URL directly in browser

### **Feature not activating:**

1. Check environment variable:
   ```bash
   echo $VISION_USE_REFERENCE_LEGEND
   ```

2. Check feature flag:
   ```typescript
   console.log(VISION_FEATURES.useReferenceLegend)
   ```

3. Check pipeline logs for "📖 Using reference legend"

### **Accuracy not improving:**

1. Verify reference image quality
2. Check GPT-4o is studying legend (prompt order)
3. Review extraction logs for patterns
4. Consider alternative reference images
5. Try different prompt wording

---

## 🎯 **Next Steps**

### **Week 1: Setup**
1. Upload reference image
2. Verify system works
3. Deploy to production

### **Week 2: Collect Data**
1. Run 50/50 A/B test
2. Track accuracy metrics
3. Monitor cost impact

### **Week 3: Analyze**
1. Compare variant performance
2. Calculate ROI
3. Make decision:
   - Keep if ROI positive
   - Remove if marginal benefit
   - Iterate if promising but needs work

### **Week 4: Optimize**
1. If keeping: make permanent
2. If removing: disable feature
3. If iterating: try different approach

---

## 📚 **Related Documentation**

- `/docs/WARNING_LIGHT_SYSTEM.md` - Warning light database
- `/docs/VISION_ENHANCEMENTS_V2.1.md` - Other vision improvements
- `/lib/vision/config.ts` - Configuration
- `/lib/vision/prompts/builder.ts` - Prompt construction

---

## ✅ **Status: Ready for Testing**

The system is fully implemented and ready for testing once the reference image is uploaded!

**Action Required:**
1. Save Google screenshot as `warning-lights-legend.jpg`
2. Place in `/public/reference-images/`
3. Test a dashboard capture
4. Monitor logs for "📖 Using reference legend"
5. Compare results with/without legend

**Let's see if it improves accuracy!** 🚀
