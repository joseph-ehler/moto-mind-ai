# 🚩 MotoMind Feature Flag System

**Status:** ✅ Implemented (Phase 1B)  
**Purpose:** Safe deployments, progressive rollouts, A/B testing, tier gating

---

## 📖 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Usage](#usage)
4. [Feature States](#feature-states)
5. [Tier Gating](#tier-gating)
6. [Progressive Rollout](#progressive-rollout)
7. [A/B Testing](#ab-testing)
8. [Dependencies](#dependencies)
9. [Admin Dashboard](#admin-dashboard)
10. [Best Practices](#best-practices)

---

## 🎯 **OVERVIEW**

The Feature Flag System enables:
- ✅ **Safe deployments** - Test with 10% of users first
- ✅ **Kill switches** - Disable broken features instantly
- ✅ **Progressive rollout** - 10% → 50% → 100%
- ✅ **A/B testing** - Compare two approaches
- ✅ **Tier gating** - Pro/Business/Enterprise features
- ✅ **Beta testing** - Target specific users/teams
- ✅ **Feature dependencies** - Require other features first

---

## 🏗️ **ARCHITECTURE**

```
lib/config/features.ts          # Feature definitions (all 27 modules)
lib/hooks/useFeature.ts          # React hook for checking features
lib/hooks/useFeatureVariant.ts   # React hook for A/B testing
components/admin/FeatureFlagDashboard.tsx  # Admin UI
```

### **Feature Definition**

```typescript
export interface FeatureFlag {
  id: string                    // Unique identifier
  name: string                  // Display name
  description: string           // What it does
  status: FeatureStatus         // disabled | beta | rollout | enabled
  tier: Tier                    // free | pro | business | enterprise
  phase: number                 // 1-6 (roadmap phase)
  
  // Optional
  rolloutPercentage?: number    // 0-100
  betaUsers?: string[]          // User IDs
  betaTeams?: string[]          // Team IDs
  variants?: {                  // A/B testing
    control: string
    treatment: string
    split: number
  }
  requires?: string[]           // Feature dependencies
  addedIn?: string              // Version added
  deprecatedIn?: string         // Version deprecated
  removedIn?: string            // Version to remove
}
```

---

## 💻 **USAGE**

### **1. Check if Feature is Enabled**

```tsx
import { useFeature } from '@/lib/hooks/useFeature'

function MyComponent() {
  const hasOfflineMode = useFeature('offlineMode')
  
  if (!hasOfflineMode) {
    return <UpgradeToPro />
  }
  
  return <OfflineCapture />
}
```

### **2. Check Multiple Features**

```tsx
import { useFeatures } from '@/lib/hooks/useFeature'

function Dashboard() {
  const features = useFeatures([
    'analyticsEngine',
    'predictiveMaintenance',
    'aiInsights'
  ])
  
  return (
    <div>
      {features.analyticsEngine && <AnalyticsPanel />}
      {features.predictiveMaintenance && <MaintenanceAlerts />}
      {features.aiInsights && <AIInsights />}
    </div>
  )
}
```

### **3. A/B Testing**

```tsx
import { useFeatureVariant } from '@/lib/hooks/useFeatureVariant'

function Pricing() {
  const { variant } = useFeatureVariant('newPricingPage')
  
  if (variant === 'treatment') {
    return <NewPricingPage />
  }
  
  return <OldPricingPage />
}
```

Or use the component wrapper:

```tsx
import { FeatureVariant } from '@/lib/hooks/useFeatureVariant'

function Pricing() {
  return (
    <FeatureVariant
      featureId="newPricingPage"
      control={<OldPricingPage />}
      treatment={<NewPricingPage />}
    />
  )
}
```

### **4. Server-Side Checks**

```tsx
import { isFeatureEnabled } from '@/lib/config/features'

export async function getServerSideProps(context) {
  const { user } = await getUserFromSession(context)
  
  const hasAnalytics = isFeatureEnabled('analyticsEngine', {
    userId: user.id,
    userTier: user.tier
  })
  
  return {
    props: { hasAnalytics }
  }
}
```

---

## 🔄 **FEATURE STATES**

### **1. Disabled** (Default)
Feature is OFF for everyone.

```typescript
{
  status: 'disabled'
}
```

**Use when:**
- Feature not ready yet
- Waiting for Phase 2/3/4
- Deprecated feature

### **2. Beta**
Feature is ON only for beta users/teams.

```typescript
{
  status: 'beta',
  betaUsers: ['user123', 'user456'],
  betaTeams: ['team-internal']
}
```

**Use when:**
- Internal testing
- Early access for specific customers
- Collecting feedback before general release

### **3. Rollout**
Feature is ON for X% of users.

```typescript
{
  status: 'rollout',
  rolloutPercentage: 25  // 25% of users
}
```

**Use when:**
- Progressive rollout (10% → 50% → 100%)
- Monitoring for issues
- Gradual infrastructure load

**Rollout Schedule:**
```
Week 1: 10%  (beta complete, stable)
Week 2: 25%  (monitoring metrics)
Week 3: 50%  (confidence growing)
Week 4: 100% (fully released)
```

### **4. Enabled**
Feature is ON for everyone (with tier check).

```typescript
{
  status: 'enabled'
}
```

**Use when:**
- Feature is stable
- Passed rollout phase
- Core functionality

---

## 🎫 **TIER GATING**

Features can be gated by subscription tier:

```typescript
{
  tier: 'pro'  // free | pro | business | enterprise
}
```

### **Tier Hierarchy:**

```
FREE
├─ Smart Camera
├─ Location Intelligence
├─ AI Chat (10 messages/month)
└─ Event Timeline

PRO ($10-15/month)
├─ Everything in Free
├─ Offline Mode
├─ Push Notifications
├─ Pattern Recognition
├─ Auto-Enrichment
├─ Proximity Intelligence (15 POIs)
├─ Smart Notifications
├─ Analytics Engine
├─ Predictive Maintenance
├─ AI Insights
└─ Price Intelligence

BUSINESS ($50-100/user/month)
├─ Everything in Pro
├─ Multi-Model Vision (99.9% uptime)
├─ Fraud Detection AI
├─ Smart Exports (IRS, QuickBooks)
├─ Benchmark Intelligence
├─ Fleet Admin Dashboard
└─ Motion Intelligence

ENTERPRISE (Custom pricing)
├─ Everything in Business
├─ Workflow Automation
├─ Custom Integrations
├─ White-Label Option
├─ Voice I/O
├─ Dedicated Support
└─ SLA Guarantees
```

### **Checking Tier Access:**

```tsx
function AnalyticsDashboard() {
  const hasAnalytics = useFeature('analyticsEngine')  // Requires Pro
  
  if (!hasAnalytics) {
    return (
      <UpgradePrompt
        feature="Analytics Dashboard"
        requiredTier="pro"
        benefits={[
          'MPG trends over time',
          'Cost breakdown by category',
          'Efficiency scoring',
          'Spending forecasts'
        ]}
      />
    )
  }
  
  return <AnalyticsDashboard />
}
```

---

## 📈 **PROGRESSIVE ROLLOUT**

### **How It Works:**

1. **Start with Beta** (internal team only)
```typescript
{
  status: 'beta',
  betaUsers: ['team-internal']
}
```

2. **Move to 10% Rollout**
```typescript
{
  status: 'rollout',
  rolloutPercentage: 10
}
```

3. **Increase Gradually**
```typescript
// Week 2
rolloutPercentage: 25

// Week 3
rolloutPercentage: 50

// Week 4
rolloutPercentage: 100
```

4. **Fully Enable**
```typescript
{
  status: 'enabled'
}
```

### **Rollout is Deterministic:**

- Same user always gets same result
- Based on user ID hash
- No flickering between enabled/disabled

```typescript
// User 'abc123' → hash 42 → bucket 42
// If rolloutPercentage >= 42, feature is enabled
```

---

## 🧪 **A/B TESTING**

### **Define Variants:**

```typescript
{
  id: 'newPricingPage',
  variants: {
    control: 'Current pricing page',
    treatment: 'New pricing page with social proof',
    split: 50  // 50% get treatment
  }
}
```

### **Use in Components:**

```tsx
const { variant } = useFeatureVariant('newPricingPage')

// Track conversion
if (userConverted) {
  trackConversion('newPricingPage', variant)
}
```

### **Analyze Results:**

```sql
-- Get conversion rate by variant
SELECT
  variant,
  COUNT(*) as users,
  SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions,
  (SUM(CASE WHEN converted THEN 1 ELSE 0 END)::float / COUNT(*)) as conversion_rate
FROM variant_assignments
WHERE feature_id = 'newPricingPage'
GROUP BY variant
```

---

## 🔗 **DEPENDENCIES**

Features can require other features:

```typescript
{
  id: 'smartNotifications',
  requires: ['pushNotifications', 'patternRecognition', 'proximityIntelligence']
}
```

**Behavior:**
- `smartNotifications` won't be enabled unless ALL dependencies are enabled
- Automatic dependency checking
- Prevents broken states

**Example:**

```typescript
// This returns false because dependencies aren't met
isFeatureEnabled('smartNotifications', context)
// Even if status='enabled', it checks dependencies first
```

---

## 🎛️ **ADMIN DASHBOARD**

Access at: `/admin/features`

### **Features:**
- ✅ View all features (27 total)
- ✅ Filter by phase (1-6)
- ✅ Filter by status (enabled, rollout, beta, disabled)
- ✅ Search by name/description
- ✅ View rollout percentage
- ✅ See dependencies
- ✅ Manage beta users
- ✅ Enable/disable features
- ✅ View A/B test details

### **Stats Dashboard:**
- Total features
- Enabled count
- In rollout count
- Beta count
- Disabled count

---

## 📋 **BEST PRACTICES**

### **✅ DO:**

1. **Start with Beta**
   - Test internally first
   - Get feedback from team
   - Fix bugs before rollout

2. **Progressive Rollout**
   - 10% → 25% → 50% → 100%
   - Monitor metrics at each step
   - Pause if issues detected

3. **Track Everything**
   - Feature usage
   - Variant assignments
   - Conversion rates
   - Error rates by feature

4. **Clean Up Old Flags**
   - Remove flags after 100% rollout (1 month)
   - Archive deprecated features
   - Keep codebase clean

5. **Document Dependencies**
   - Make requirements explicit
   - Test dependency chains
   - Avoid circular dependencies

### **❌ DON'T:**

1. **Don't Skip Beta**
   - Always test internally first
   - Catch bugs before users see them

2. **Don't Jump to 100%**
   - Progressive rollout catches issues
   - 10% fail is better than 100% fail

3. **Don't Forget Tier Checks**
   - Always gate premium features
   - Enforce tier limits server-side too

4. **Don't Leave Flags Forever**
   - Remove after rollout complete
   - Technical debt accumulates

5. **Don't Test in Production**
   - Use development overrides
   - Add `?features=featureName` to URL

---

## 🔧 **DEVELOPMENT OVERRIDES**

Test features locally without changing code:

```
http://localhost:3000?features=offlineMode,pushNotifications
```

**Behavior:**
- Features enabled for current session only
- Only works in development/staging
- Disabled in production

**Usage:**

```tsx
// Automatically detected
const hasOfflineMode = useFeature('offlineMode')
// Returns true if ?features=offlineMode in URL
```

---

## 📊 **MONITORING**

Track feature usage:

```typescript
// Track when feature is used
useEffect(() => {
  if (hasAnalytics) {
    trackFeatureUsage('analyticsEngine', user.id)
  }
}, [hasAnalytics, user.id])
```

**Metrics to Monitor:**
- Feature adoption rate (% of eligible users using it)
- Time to adoption (days from enable to first use)
- Feature engagement (daily/weekly active)
- Conversion impact (A/B test results)
- Error rates by feature
- Performance impact

---

## 🚀 **ROLLOUT CHECKLIST**

Before enabling a feature:

- [ ] Beta tested with internal team
- [ ] No critical bugs
- [ ] Performance tested
- [ ] Analytics tracking added
- [ ] Documentation updated
- [ ] Tier gating configured
- [ ] Dependencies checked
- [ ] Rollback plan ready

During rollout:

- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Check user feedback
- [ ] Watch support tickets
- [ ] Have kill switch ready

After 100% rollout:

- [ ] Remove feature flag (after 1 month)
- [ ] Clean up old code paths
- [ ] Update documentation
- [ ] Celebrate! 🎉

---

## 📝 **EXAMPLES**

### **Example 1: New Phase 2 Feature**

```typescript
// Add to features.ts
export const features = {
  // ...
  autoEnrichment: {
    id: 'autoEnrichment',
    name: 'Auto-Enrichment',
    description: 'Automatic weather, geocoding, price validation',
    status: 'beta',
    tier: 'pro',
    phase: 2,
    betaUsers: ['user123'], // Your test account
    requires: ['patternRecognition'],
    addedIn: '2025-04-01'
  }
}
```

```tsx
// Use in component
function EventDetails({ event }) {
  const hasEnrichment = useFeature('autoEnrichment')
  
  return (
    <div>
      <h1>{event.vendor}</h1>
      
      {hasEnrichment && (
        <>
          <p>Weather: {event.weatherTemp}°F - {event.weatherCondition}</p>
          <p>Price vs Market: {event.priceVsMarket > 0 ? '+' : ''}{event.priceVsMarket}/gal</p>
        </>
      )}
    </div>
  )
}
```

### **Example 2: A/B Test Pricing Page**

```typescript
// Add to features.ts
export const features = {
  // ...
  newPricingDesign: {
    id: 'newPricingDesign',
    name: 'New Pricing Design',
    description: 'Pricing page with social proof',
    status: 'rollout',
    tier: 'free',
    phase: 1,
    rolloutPercentage: 50,
    variants: {
      control: 'Current design',
      treatment: 'Design with testimonials',
      split: 50
    },
    addedIn: '2025-02-01'
  }
}
```

```tsx
// Use in component
function PricingPage() {
  const { variant } = useFeatureVariant('newPricingDesign')
  
  if (variant === 'treatment') {
    return (
      <div>
        <PricingCards />
        <Testimonials />  {/* NEW */}
        <SocialProof />   {/* NEW */}
      </div>
    )
  }
  
  return <PricingCards />
}
```

---

## 🎯 **ROADMAP COVERAGE**

**Phase 1: Foundation** (2 features)
- ✅ Offline Mode
- ✅ Push Notifications

**Phase 2: Intelligence** (5 features)
- ⏳ Pattern Recognition
- ⏳ Multi-Model Vision
- ⏳ Auto-Enrichment
- ⏳ Proximity Intelligence
- ⏳ Smart Notifications

**Phase 3: Analytics** (3 features)
- ⏳ Analytics Engine
- ⏳ Predictive Maintenance
- ⏳ AI Insights

**Phase 4: Enterprise** (4 features)
- ⏳ Smart Exports
- ⏳ Workflow Automation
- ⏳ Benchmark Intelligence
- ⏳ Fleet Admin

**Phase 5: Premium** (3 features)
- ⏳ Voice I/O
- ⏳ Motion Intelligence
- ⏳ Price Intelligence

**Phase 6: Scale** (3 features)
- ⏳ Advanced Caching
- ⏳ Rate Protection
- ⏳ International

**Total:** 27 features across 18 months ✅

---

## 📞 **SUPPORT**

Questions? See:
- `lib/config/features.ts` - All feature definitions
- `lib/hooks/useFeature.ts` - React hooks
- Admin dashboard: `/admin/features`

---

**Status:** ✅ Feature Flag System Complete  
**Next:** PWA + Service Worker (Week 2)
