# AI-Powered Insights Setup Guide

## 🚀 Quick Start

### 1. Add OpenAI API Key

Add to your `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-...your-key-here...
```

**Get your API key:**
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `.env.local`

### 2. Install OpenAI SDK

```bash
npm install openai
```

### 3. Restart Development Server

```bash
npm run dev
```

### 4. Test It!

1. Go to `http://localhost:3005/onboarding/new`
2. Enter a VIN (e.g., `2C3CCADG7NH116370`)
3. Complete onboarding steps
4. Watch for "Using AI insights" in browser console

---

## 🎯 How It Works

### Architecture

```
┌──────────────────────┐
│ SteppedOnboarding    │
│   Component          │
└──────────┬───────────┘
           │
           ├─ User enters mileage
           │
           ├─ Call /api/ai/insights (POST)
           │  {type: "mileage", data: {...}}
           │
           ├─ If AI succeeds → Use AI insights
           │
           └─ If AI fails → Use rule-based fallback
```

### Graceful Fallback

**If OpenAI API key not set:**
- API returns `{success: false, useFallback: true}`
- Component uses rule-based insights
- User sees no errors, just slightly less personalized insights

**If OpenAI call fails:**
- API catches error, returns fallback flag
- Component uses rule-based insights
- Error logged to console for debugging

**No user-facing errors ever!**

---

## 🧪 Testing

### Test with AI (OpenAI Key Set)

```bash
# Check console output
[Onboarding] Using AI mileage insights  ✅
[Onboarding] Using AI ownership insights  ✅
[Onboarding] Using AI service insights  ✅
```

### Test without AI (No Key)

```bash
# Check console output
[AI/Insights] OpenAI API key not configured, using fallback  ℹ️
[Onboarding] Falling back to rule-based mileage insights  ℹ️
```

### Test Different Scenarios

**Low Mileage (< 10k):**
- AI should mention "break-in period"
- Rule-based shows generic low-mileage message

**High Mileage (> 100k):**
- AI should give specific inspection advice
- Rule-based shows generic high-mileage message

**Recent Service + High Mileage:**
- AI should cross-reference both factors
- Rule-based treats them separately

**Vehicle with Complaints:**
- AI should mention specific problem components
- Rule-based has no knowledge of complaints

---

## 💰 Cost Analysis

### OpenAI Pricing (gpt-4o-mini)

- **Input:** $0.15 per 1M tokens
- **Output:** $0.60 per 1M tokens

### Per-Onboarding Cost

```
Mileage insights:
  Input: ~1,500 tokens × $0.15/1M = $0.000225
  Output: ~200 tokens × $0.60/1M = $0.00012
  Subtotal: $0.000345

Ownership insights:
  Input: ~1,500 tokens = $0.000225
  Output: ~200 tokens = $0.00012
  Subtotal: $0.000345

Service insights:
  Input: ~1,500 tokens = $0.000225
  Output: ~200 tokens = $0.00012
  Subtotal: $0.000345

Total per onboarding: ~$0.001 (0.1 cents)
```

### Monthly Costs

| Users/Month | Cost |
|-------------|------|
| 1,000 | $1 |
| 10,000 | $10 |
| 100,000 | $100 |
| 1,000,000 | $1,000 |

**Negligible cost for massive UX improvement!**

---

## 🔍 Debugging

### Check API Response

Browser DevTools → Network → Filter "insights"

**Success:**
```json
{
  "success": true,
  "insights": [
    {
      "type": "warning",
      "title": "Service Due + Safety Check",
      "message": "At 150k miles, check transmission fluid and address airbag recall."
    }
  ]
}
```

**Fallback:**
```json
{
  "success": false,
  "useFallback": true,
  "error": "OpenAI API key not configured"
}
```

### Check Server Logs

```bash
# Terminal running dev server
[AI/Insights] OpenAI API key not configured, using fallback
[AI] Failed to generate mileage insights: OpenAI API error
```

### Common Issues

**1. "OpenAI API key not configured"**
- Solution: Add `OPENAI_API_KEY` to `.env.local`
- Restart dev server

**2. "Rate limit exceeded"**
- Solution: You're on free tier, wait or upgrade
- OpenAI dashboard: https://platform.openai.com/usage

**3. "Invalid API key"**
- Solution: Generate new key at https://platform.openai.com/api-keys
- Make sure no extra spaces in `.env.local`

**4. Insights look generic**
- Solution: Check if AI is actually being used (console logs)
- Verify request payload has complete vehicle data

---

## 📊 Monitoring

### Key Metrics to Track

1. **AI Success Rate**
   - Log: `[Onboarding] Using AI ${type} insights`
   - Target: >95%

2. **Fallback Rate**
   - Log: `[Onboarding] Falling back to rule-based ${type} insights`
   - Target: <5%

3. **API Latency**
   - Network tab: Look for `/api/ai/insights` timing
   - Target: <2 seconds per call

4. **Cost Per User**
   - OpenAI dashboard: https://platform.openai.com/usage
   - Target: <$0.002 per onboarding

### Analytics Events (TODO)

```typescript
// Track AI usage
analytics.track('ai_insight_generated', {
  type: 'mileage',
  success: true,
  latency_ms: 1234
})

// Track fallback
analytics.track('ai_insight_fallback', {
  type: 'ownership',
  reason: 'api_error'
})
```

---

## 🚢 Deployment Checklist

### Pre-Launch

- [ ] Test with real VINs (variety of mileage/ownership)
- [ ] Test without API key (fallback works)
- [ ] Test with invalid key (error handling)
- [ ] Check console logs (no errors)
- [ ] Check network requests (reasonable latency)
- [ ] Verify insights make sense (not generic/hallucinating)

### Production Environment Variables

**Vercel:**
```bash
vercel env add OPENAI_API_KEY
# Paste your key
# Select: Production, Preview, Development
```

**Other Platforms:**
Add `OPENAI_API_KEY` to your platform's environment variables section.

### Post-Launch

- [ ] Monitor OpenAI usage dashboard
- [ ] Track success/fallback rates
- [ ] Collect user feedback
- [ ] A/B test AI vs. rule-based
- [ ] Refine prompts based on feedback

---

## 🔮 Next Steps

### Phase 2: Comprehensive Final Insights (Week 2)

Currently, Final Reveal uses rule-based insights. Add AI:

```typescript
const generateComprehensiveInsights(context)
```

This will synthesize ALL collected data into personalized action plan.

### Phase 3: Follow-Up Questions (Week 3)

Add dynamic follow-up questions based on insights:

```typescript
if (aiInsights.mentions('transmission')) {
  askFollowUp('Have you noticed any transmission issues?')
}
```

### Phase 4: Learning & Personalization (Week 4+)

- Track which insights lead to actions
- A/B test different prompt styles
- Build user preference profiles
- Improve over time

---

## 📚 Related Documentation

- **Strategy:** `AI_INSIGHTS_STRATEGY.md` - Full vision and opportunity
- **Implementation:** `STEPPED_ONBOARDING_COMPLETE.md` - Onboarding architecture
- **Code:** 
  - `lib/ai/insight-generator.ts` - AI insight functions
  - `app/api/ai/insights/route.ts` - API endpoint
  - `components/onboarding/SteppedOnboarding.tsx` - Integration

---

## 🎉 Success!

If you see insights like:

> **Service Due + Safety Check**
> 
> At 150k miles, your oil change is due. Given 2 airbag incidents in similar vehicles, have your airbag system inspected during this service.

**You've successfully enabled AI-powered insights!** 🚀

The onboarding experience just became 10x more valuable.
