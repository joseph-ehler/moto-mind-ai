# AI-Powered Onboarding Insights Strategy

## 🎯 Vision

Transform the stepped onboarding from "data collection" into "intelligent conversation" by generating personalized, compounding insights that make users say "wow, this app *gets* my vehicle."

---

## 📊 Current State (v1.0 - Rule-Based)

### What We Have:
```typescript
// Simple conditional logic
if (mileage > 100000) {
  return "High mileage veteran"
}
```

### Problems:
1. **Generic** - Same message for all 100k+ mile vehicles
2. **Limited** - Can't cross-reference multiple data points
3. **Static** - No learning or improvement
4. **Boring** - Users don't feel "seen"

---

## 🚀 Future State (v2.0 - AI-Powered)

### What We Could Have:
```typescript
// AI analyzes ALL context together
const insight = await generateInsight({
  vehicle: "2022 Chrysler 300",
  mileage: 150000,
  ownership: "owned-while",
  service: "overdue",
  safetyData: {...},
  recalls: [...],
  complaints: [...]
})

// Result:
"Your 2022 Chrysler 300 has 150k miles and is overdue for service. 
Given the recent airbag complaints (2 incidents), prioritize checking 
your airbag system along with the oil change. Also, there's a recall 
for the brake system - get that fixed free at the dealer."
```

---

## 💡 AI Insight Opportunities

### 1. **Mileage Insights** (After entering mileage)

#### Data to Pass:
```typescript
{
  vehicle: {
    year: 2022,
    make: "Chrysler",
    model: "300",
    trim: "Touring L"
  },
  mileage: 150000,
  maintenanceInterval: 7500,
  safetyData: {
    totalComplaints: 4,
    topProblems: [
      { component: "AIR BAGS", count: 2, crashes: 2 },
      { component: "SERVICE BRAKES", count: 1 }
    ]
  },
  recalls: [...],
  specs: {
    engine: "3.6L V6",
    transmission: "8-Speed Automatic"
  }
}
```

#### AI Prompt:
```
You're an expert mechanic analyzing a vehicle's maintenance needs.

Vehicle: 2022 Chrysler 300 Touring L (3.6L V6, 8-Speed Auto)
Current Mileage: 150,000 miles
Maintenance Interval: Every 7,500 miles

Safety Data:
- 4 total complaints
- 2 airbag incidents (with crashes)
- 1 brake complaint

Generate 1-2 specific, actionable insights:
1. What maintenance is coming up (based on mileage)?
2. What should the owner watch for (based on complaints)?

Format: {"type": "warning|info|success", "title": "...", "message": "..."}
```

#### Expected Output:
```json
[
  {
    "type": "warning",
    "title": "Service Due + Safety Check",
    "message": "At 150k miles, you're due for oil change at 157,500. Given 2 airbag incidents in similar vehicles, have your airbag system inspected during this service."
  },
  {
    "type": "info",
    "title": "Transmission Milestone",
    "message": "Your 8-speed automatic is at the point where transmission fluid should be checked. This can prevent expensive repairs later."
  }
]
```

---

### 2. **Ownership Insights** (After ownership type)

#### Data to Pass:
```typescript
{
  vehicle: {...},
  mileage: 150000,
  ownership: "owned-while",
  safetyData: {...},
  recalls: [
    {
      id: "23V456",
      component: "Service Brakes",
      summary: "Brake fluid leak",
      status: "open"
    }
  ],
  marketValue: {
    estimated: 18500,
    withFullHistory: 22000 // +18% with verified service
  }
}
```

#### AI Prompt:
```
User has owned this 2022 Chrysler 300 for a while (150k miles).

Open Recalls:
- Service Brakes: Brake fluid leak (Recall #23V456)

Market Data:
- Current estimated value: $18,500
- Value with full service history: $22,000 (+18%)

Generate 1-2 insights about:
1. Immediate action items (recalls)
2. Long-term value preservation

Focus on money-saving and resale value.
```

#### Expected Output:
```json
[
  {
    "type": "warning",
    "title": "Free Brake Repair Available",
    "message": "Recall #23V456 covers a brake fluid leak. Visit any Chrysler dealer for free repairs - this also protects your resale value."
  },
  {
    "type": "success",
    "title": "Service History = $3,500 More",
    "message": "Maintaining full service records can increase your vehicle's value by $3,500 when you sell. We'll help you track everything."
  }
]
```

---

### 3. **Service History Insights** (After last service date)

#### Data to Pass:
```typescript
{
  vehicle: {...},
  mileage: 150000,
  serviceTiming: "overdue", // >6 months ago
  monthsSinceService: 9,
  milesPerYear: 15000, // calculated from mileage + age
  commonFailures: [
    {
      component: "Transmission",
      failureRate: 0.08,
      avgMileage: 120000,
      avgCost: 3500
    }
  ]
}
```

#### AI Prompt:
```
User's last service was 9 months ago. They drive ~15k miles/year.

Vehicle: 2022 Chrysler 300 (150k miles)

Common Failures for this Model:
- Transmission: 8% failure rate around 120k miles, avg repair $3,500

Generate insights about:
1. Urgency of service
2. What to check (given common failures)
3. Cost prevention

Emphasize preventing the $3,500 transmission repair.
```

#### Expected Output:
```json
[
  {
    "type": "warning",
    "title": "Don't Wait - Transmission Risk",
    "message": "9 months is too long at your mileage. Chrysler 300s can have transmission issues around 120k miles. A $150 service now prevents a $3,500 repair later."
  },
  {
    "type": "info",
    "title": "Recommended Service Items",
    "message": "Ask your mechanic to check: transmission fluid, brake fluid (recall!), oil & filter, and tire rotation. This covers the most critical items."
  }
]
```

---

### 4. **Final Reveal** (Comprehensive analysis)

#### Data to Pass:
```typescript
{
  vehicle: {...},
  mileage: 150000,
  ownership: "owned-while",
  serviceTiming: "overdue",
  nickname: "The Beast",
  fullContext: {
    safetyScore: 18,
    riskLevel: "LOW",
    complaints: [...],
    recalls: [...],
    marketValue: {...},
    commonFailures: [...],
    userAnswers: {
      mileage: 150000,
      ownership: "owned-while",
      serviceTiming: "overdue"
    }
  }
}
```

#### AI Prompt:
```
Generate a comprehensive vehicle intelligence summary for "The Beast" - a 2022 Chrysler 300.

Context:
- Mileage: 150k miles (high usage, ~15k/year)
- Ownership: Long-term owner
- Service: Overdue (9 months)
- Safety Score: 18/100 (LOW risk)
- Recalls: 1 open (brakes)
- Complaints: 4 total (airbags, brakes)
- Market Value: $18,500 (could be $22k with service history)

Generate 3-4 sections:
1. Safety & Reliability (what's good, what to watch)
2. Maintenance Priorities (urgent vs. upcoming)
3. Value Preservation (how to maximize resale)
4. Smart Owner Tips (specific to this vehicle + usage)

Be specific, actionable, and encouraging. Format as structured insights.
```

#### Expected Output:
```json
{
  "safetyInsight": "Your 300 has a LOW risk score - better than 54% of similar vehicles. However, address the brake recall immediately (free repair) and have the airbag system checked given 2 incidents in similar vehicles.",
  
  "maintenanceInsight": "At 150k miles with 9 months since service, prioritize: 1) Oil change ($60), 2) Transmission fluid check ($120), 3) Brake recall (free). Total: ~$180 prevents $3,500+ in repairs.",
  
  "valueInsight": "With complete service records, your vehicle could sell for $22,000 vs. $18,500 without them. Track every service with MotoMind to capture that $3,500 premium.",
  
  "smartTips": "Given your high-mileage usage (15k/year), consider: switching to synthetic oil (lasts longer), checking transmission every 15k miles, and monitoring brake performance closely post-recall."
}
```

---

## 🛠️ Implementation Plan

### Phase 1: Single AI Call (Week 1)
- Add OpenAI call on **Final Reveal** only
- Pass full context from all steps
- Generate comprehensive summary
- A/B test: Rule-based vs. AI insights

### Phase 2: Per-Step Insights (Week 2-3)
- Add AI calls after each insight step
- Cache results to avoid redundant calls
- Stream responses for perceived speed
- Fallback to rule-based if API fails

### Phase 3: Follow-Up Questions (Week 4)
Add contextual follow-up questions:
- "Have you noticed any transmission issues?"
- "When was your last brake service?"
- "Do you use synthetic oil?"

Use answers to generate even better insights.

### Phase 4: Learning & Personalization (Week 5+)
- Track which insights lead to actions
- A/B test different prompt styles
- Learn user preferences
- Build personal profile over time

---

## 💰 Cost Analysis

### OpenAI Pricing (GPT-4o-mini):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

### Per-Onboarding Cost:
```
Input (~1,500 tokens per call):
  4 calls × 1,500 tokens = 6,000 tokens = $0.0009

Output (~500 tokens per call):
  4 calls × 500 tokens = 2,000 tokens = $0.0012

Total per onboarding: ~$0.002 (0.2 cents)
```

### At Scale:
- 10,000 onboardings/month = $20/month
- 100,000 onboardings/month = $200/month
- Negligible cost for massive UX improvement

---

## 📈 Success Metrics

### Engagement:
- Time on insights screen (target: +40%)
- "Continue" click rate (target: >95%)
- Completion rate (target: >85%)

### Quality:
- User satisfaction survey post-onboarding
- "This was helpful" thumbs up/down
- Retention at 7 days (target: +15%)

### Business:
- Conversion to Pro (target: +20%)
- Service booking rate (target: +30%)
- Referral rate (target: +25%)

---

## 🎨 Prompt Engineering Best Practices

### 1. **Be Specific:**
```
❌ "Generate insights about this vehicle"
✅ "You're a mechanic with 20 years experience. Analyze this vehicle's 
    maintenance needs based on mileage, complaints, and recalls."
```

### 2. **Provide Structure:**
```typescript
// Include JSON schema in prompt
const schema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      type: { enum: ["success", "warning", "info"] },
      title: { type: "string", maxLength: 50 },
      message: { type: "string", maxLength: 200 }
    }
  }
}
```

### 3. **Use Examples:**
Include 2-3 good examples in the prompt to guide style and tone.

### 4. **Set Constraints:**
```
- Maximum 2 insights
- Keep messages under 200 characters
- Focus on actionable advice
- Use specific numbers and prices
```

---

## 🔐 Privacy & Safety

### What We DON'T Send:
- User names
- Email addresses
- Location data
- Payment info

### What We DO Send:
- Vehicle specs (public data)
- Mileage (anonymous)
- Generic timestamps ("9 months ago" not dates)
- Safety data (public NHTSA data)

### Safety Rails:
- No medical advice
- No legal advice
- No financial advice
- Always defer to professionals for actual repairs

---

## 🚀 Next Steps

1. **This Week:**
   - Create OpenAI helper function
   - Test prompts in Playground
   - Implement Final Reveal AI call
   - A/B test against rule-based

2. **Next Week:**
   - Roll out to 10% of users
   - Measure engagement metrics
   - Refine prompts based on feedback
   - Add per-step AI calls

3. **Month 2:**
   - Add follow-up questions
   - Build learning system
   - Create insight library
   - Launch to 100% of users

---

## 💭 Example AI Conversation Flow

### User Journey:
1. **VIN Decode** → Vehicle specs fetched
2. **Confirm** → User confirms vehicle
3. **Mileage: 150,000** → AI analyzes maintenance needs
4. **Ownership: Owned a while** → AI analyzes recalls + value
5. **Nickname: The Beast** → AI personalizes language
6. **Service: Overdue** → AI emphasizes urgency
7. **Final Reveal** → AI synthesizes everything into actionable plan

### AI Output Evolution:
```
Step 3 (Mileage):
"At 150k miles, check transmission fluid and address the brake recall."

Step 5 (Ownership):
"The Beast has served you well! Protect that $3,500 resale value premium."

Step 7 (Final):
"Here's The Beast's action plan: 1) Brake recall (free), 2) Transmission 
check ($120), 3) Oil change ($60). Do this month to prevent $3,500+ repairs 
and maintain your $22k resale value."
```

Notice how insights **compound** - later steps reference earlier context!

---

## ✅ Summary

**Current:** Rule-based, generic, limited
**Future:** AI-powered, personalized, compounding

**Cost:** $0.002 per onboarding (negligible)
**Effort:** 1-2 weeks to implement
**Impact:** +20-40% engagement, +15% retention

**This is the "wow" moment that turns onboarding into a relationship.** 🚀
