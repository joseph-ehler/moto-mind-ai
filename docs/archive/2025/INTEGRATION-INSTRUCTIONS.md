# TIER 1 EVENT TYPES - BACKEND INTEGRATION INSTRUCTIONS

## 🎯 WHAT NEEDS TO BE DONE

The UI is complete and ready! Now we need to wire up the backend to make the new event types work.

## 📝 STEP 1: Import the New Processors

Add this import at the top of `/pages/api/vision/process.ts`:

```typescript
import { processRepair, processInsurance, processAccident } from './tier1-processors'
```

## 🔧 STEP 2: Update the Switch Statement

The switch statement in process.ts already has the case statements for our new types:
- `case 'repair':`
- `case 'insurance':`  
- `case 'accident':`

But they're calling functions that don't exist yet. Replace those lines with:

```typescript
case 'repair':
  result = await processRepair(base64Image)
  break
case 'insurance':
  result = await processInsurance(base64Image)
  break
case 'accident':
  result = await processAccident(base64Image)
  break
```

## 🎨 STEP 3: Update Fallback Mock Data

In the fallback section, add cases for the new event types:

```typescript
// Add these cases to the fallback logic
if (captureType === 'repair') {
  result = {
    type: 'repair',
    confidence: 85,
    problem_description: 'Alternator failure',
    repair_performed: 'Alternator replacement',
    total_amount: 685,
    shop_name: 'Joe\'s Auto Repair',
    warranty_period: '12 months',
    _fallback: true
  }
} else if (captureType === 'insurance') {
  result = {
    type: 'insurance',
    confidence: 90,
    insurance_company: 'State Farm',
    policy_number: 'ABC123456',
    coverage_type: 'Full coverage',
    premium_amount: 1200,
    expiration_date: '2026-03-15',
    _fallback: true
  }
} else if (captureType === 'accident') {
  result = {
    type: 'accident',
    confidence: 85,
    location: 'Main St & 5th Ave',
    damage_description: 'Rear bumper damage',
    claim_number: 'CLM789',
    other_party_info: { vehicle: 'Honda Civic' },
    _fallback: true
  }
}
```

## 🚀 STEP 4: Test the Integration

Once these changes are made, you can test each new event type:

1. **Test Repair Processing:**
   - Upload a repair invoice
   - Should see: "🔧 Alternator replacement" with amber icon
   - Subtitle: "Joe's Auto Repair • $685 • Warranty: 12 months"

2. **Test Insurance Processing:**
   - Upload an insurance document
   - Should see: "🛡️ Auto insurance renewed" with indigo icon
   - Subtitle: "Policy #ABC123456 • $1,200/year • Full coverage"

3. **Test Accident Processing:**
   - Upload accident documentation
   - Should see: "⚠️ Minor collision" with red icon
   - Subtitle: "Rear bumper damage • Claim #CLM789 • Other party: Honda"

## 📊 EXPECTED TIMELINE OUTPUT

After integration, your timeline will show:

```
Vehicle Timeline                           25 events

Filter: [All] [Odometer] [Fuel] [Service] [Repair] [Inspection] [Insurance] [Accident] [Document]

────────── RECENT (LAST 7 DAYS) • 8 ──────────

🔧  Alternator replacement                    
    Joe's Auto Repair • $685 • Warranty: 12 months
    At 87,450 mi • Emergency repair        2 days ago [View] ⌄ ✕

✅  Safety inspection passed                  
    Certificate #SI-2025-789456 • Valid until Dec 2025
    At 87,100 mi • Next due Dec 2025      1 week ago [View] ⌄ ✕

🛡️  Auto insurance renewed                   
    Policy #ABC123456 • $1,200/year • Full coverage
    Expires Mar 2026 • Premium paid       3 days ago [View] ⌄ ✕

⚠️  Minor collision                          
    Rear bumper damage • Claim #CLM789 • Other party: Honda
    At 86,890 mi • Police report filed    2 weeks ago [View] ⌄ ✕
```

## ✅ VERIFICATION CHECKLIST

- [ ] Import statement added to process.ts
- [ ] Switch statement cases updated
- [ ] Fallback mock data added
- [ ] Repair event displays correctly
- [ ] Insurance event displays correctly  
- [ ] Accident event displays correctly
- [ ] All filter buttons work
- [ ] Color coding appears correctly
- [ ] Icons display properly

## 🎯 RESULT

Once these changes are made, MotoMind will be transformed from a basic service/fuel logger into a comprehensive vehicle life management system that captures:

- 🔧 **Maintenance** - Scheduled services
- ⛽ **Fuel** - Gas purchases and economy
- 📊 **Odometer** - Mileage tracking
- 🔧 **Repairs** - Unscheduled fixes and breakdowns
- ✅ **Inspections** - Safety and emissions compliance
- 🛡️ **Insurance** - Policies, claims, and renewals
- ⚠️ **Accidents** - Incidents and damage reports
- 📄 **Documents** - General document storage

**Every critical vehicle event, captured and organized! 🚀**
