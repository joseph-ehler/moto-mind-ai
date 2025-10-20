# AI Module

AI-powered functionality for MotoMind.

## Components

### `insight-generator.ts` ✅ **REBUILT**
Generates intelligent vehicle insights using OpenAI.

**Features:**
- Full insights (with NHTSA data)
- Quick insights (VIN decode only)
- Maintenance recommendations
- Reliability scoring
- Risk factor analysis

**Usage:**

```typescript
import { generateInsights, generateQuickInsights, buildOnboardingContext } from '@/lib/ai/insight-generator'

// Quick insights (fast, no NHTSA data)
const quick = await generateQuickInsights({
  year: 2019,
  make: 'Honda',
  model: 'Civic',
  trim: 'LX',
  mileage: 45000
})

// Full insights (with NHTSA safety data)
const full = await generateInsights({
  vehicle: {
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    mileage: 45000
  },
  safetyData: nhtsaData, // From lib/nhtsa/vehicle-safety
  userContext: {
    mileage: 45000,
    drivePattern: 'mixed',
    recentIssues: ['Check engine light'],
    maintenanceHistory: ['Oil change - 3 months ago']
  }
})

// Maintenance recommendations
const recommendations = await generateMaintenanceRecommendations(
  { year: 2019, make: 'Honda', model: 'Civic' },
  45000 // mileage
)
```

**Output:**
```typescript
{
  summary: "2-3 sentence overview of the vehicle",
  reliabilityScore: 0.85, // 0-1 scale
  maintenanceTip: "Specific actionable advice",
  costTip: "Cost-saving advice",
  riskFactors: ["Top concern 1", "Top concern 2"],
  strengths: ["Positive 1", "Positive 2"],
  confidence: 0.9 // AI confidence level
}
```

### `openai-client.ts`
OpenAI API wrapper with error handling and retries.

### `claude-client.ts`
Claude API wrapper for alternative AI provider.

### `context-bridge.ts`
Enables AI collaboration between Windsurf and Codex CLI.

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
```

## Best Practices

1. **Use quick insights for VIN decode** - Faster, cheaper
2. **Use full insights for detailed analysis** - When you have NHTSA data
3. **Handle errors gracefully** - All functions return fallbacks
4. **Set temperature low (0.2-0.3)** - For factual, consistent responses
5. **Monitor token usage** - Track costs via response.usage

## Error Handling

All functions include built-in fallbacks:
- Network errors → Default insights
- Rate limits → Exponential backoff
- Invalid JSON → Parsed with fallback
- Missing API key → Clear error message
