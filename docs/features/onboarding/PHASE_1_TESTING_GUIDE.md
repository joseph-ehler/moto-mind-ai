# Phase 1 Testing Guide - Vehicle VIN Flow

**Status:** Ready to test  
**Date:** October 20, 2025  
**URL:** `http://localhost:3000/onboarding/vehicle/new-flow`

---

## 🎯 What to Test

**Phase 1 delivers:**
- VIN capture with validation
- VIN decoding with NHTSA VPIC API
- Vehicle confirmation with micro-insights
- Chapter-based progress bars
- All Phase 0 polish (focus, ARIA, keyboard, etc.)

---

## 🧪 Test Scenarios

### **Scenario 1: Happy Path (Valid VIN)**

**Test VIN:** `1HGCM82633A004352` (Honda Accord)

**Steps:**
1. Visit `/onboarding/vehicle/new-flow`
2. Enter VIN: `1HGCM82633A004352`
3. Watch character counter turn green at 17/17
4. Click "Continue"
5. Watch decoding screen (ticker messages rotate)
6. Auto-advance to confirm screen (after ~2-5s)
7. See vehicle card: Year • Make • Model
8. See micro-insights: Safety risk • EPA class
9. Click "Looks right"
10. See alert: "Vehicle basics complete!"

**Expected:**
- ✅ VIN validates instantly
- ✅ Continue button enables
- ✅ Decoding shows ticker
- ✅ Auto-advances to confirm
- ✅ Vehicle data correct
- ✅ Micro-insights present
- ✅ Progress bar shows 3/3

---

### **Scenario 2: Valid VIN (Chrysler)**

**Test VIN:** `2C3CCADG7NH116370` (Chrysler 300)

**Steps:**
1. Visit `/onboarding/vehicle/new-flow`
2. Enter VIN: `2C3CCADG7NH116370`
3. Continue through flow

**Expected:**
- ✅ Decodes to: 2022 Chrysler 300
- ✅ Micro-insight: Large Cars (EPA)
- ✅ Safety risk calculated

---

### **Scenario 3: Invalid VIN (Contains I/O/Q)**

**Test VIN:** `1IO3456789ABCDEFG`

**Steps:**
1. Visit `/onboarding/vehicle/new-flow`
2. Try to enter: `1IO3456789ABCDEFG`

**Expected:**
- ✅ Characters "I", "O", "Q" are blocked/stripped
- ✅ Error message appears
- ✅ Continue button stays disabled
- ✅ Red error text shows

---

### **Scenario 4: Paste Handler**

**Test VIN:** `1HGCM 826-33A00 4352` (with spaces/dashes)

**Steps:**
1. Copy VIN with spaces/dashes
2. Paste into input
3. Watch auto-clean

**Expected:**
- ✅ Spaces removed
- ✅ Dashes removed
- ✅ Result: `1HGCM82633A004352`
- ✅ Counter shows 17/17
- ✅ Validates instantly

---

### **Scenario 5: Back Navigation**

**Steps:**
1. Enter valid VIN
2. Continue to decoding
3. Wait for confirm screen
4. Click "← Back" button

**Expected:**
- ✅ Returns to VIN input
- ✅ VIN still filled in
- ✅ Can edit and resubmit

**Alternative:**
1. On confirm screen
2. Click "Edit VIN" button

**Expected:**
- ✅ Returns to VIN input
- ✅ Same as back button

---

### **Scenario 6: Start Over**

**Steps:**
1. Complete VIN flow to confirm
2. Click "⋮" overflow menu
3. Click "Start over"
4. Confirm dialog

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Explains "This will reset only this wizard flow"
- ✅ Cancel / Reset buttons
- ✅ On Reset: VIN cleared, back to step 1
- ✅ Progress bar resets

---

### **Scenario 7: Autosave Indicator**

**Steps:**
1. Enter VIN
2. Watch overflow menu "⋮"
3. Open menu
4. See autosave status

**Expected:**
- ✅ Green dot + "Saved just now"
- ✅ Updates every 30 seconds
- ✅ Shows "Saved 12s ago", "Saved 3m ago", etc.

---

### **Scenario 8: Keyboard Navigation**

**Steps:**
1. Tab into VIN input
2. Type VIN
3. Press "Enter" (should continue)
4. Press "Escape" (should blur)
5. Use "Alt+←" (should go back)

**Expected:**
- ✅ Enter triggers continue
- ✅ Escape blurs focus
- ✅ Alt+← goes back
- ✅ All keyboard shortcuts work

---

### **Scenario 9: Slow API (Mock)**

**To simulate slow API:**
1. In browser DevTools → Network tab
2. Throttle to "Slow 3G"
3. Enter VIN and continue

**Expected:**
- ✅ Decoding starts
- ✅ After 12s: "Taking longer than usual" message
- ✅ After 20s: Timeout error
- ✅ Retry button appears
- ✅ Back button appears

---

### **Scenario 10: API Timeout Error**

**To test timeout handling:**
1. Temporarily edit API route to add delay:
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 21000)) // 21s delay
   ```
2. Enter VIN and continue

**Expected:**
- ✅ Slow hint at 12s
- ✅ Timeout at 20s
- ✅ Error card: "VIN database timeout"
- ✅ Retry button functional
- ✅ Back button functional

---

### **Scenario 11: Mobile Testing**

**Steps:**
1. Open in mobile view (DevTools → Device mode)
2. Test touch targets
3. Test overflow menu
4. Test progress bars

**Expected:**
- ✅ All buttons 44px+ touch targets
- ✅ Overflow menu easy to tap
- ✅ Progress bars tappable
- ✅ No horizontal scroll
- ✅ Active feedback on tap (`active:scale-95`)

---

### **Scenario 12: Accessibility (Screen Reader)**

**Steps:**
1. Turn on VoiceOver (Mac) or NVDA (Windows)
2. Navigate through flow
3. Listen to announcements

**Expected:**
- ✅ Title gets focus on step change
- ✅ Progress announced: "Vehicle, step 2 of 3"
- ✅ VIN input has label
- ✅ Decoding announces "started"
- ✅ Slow hint announced after 12s
- ✅ All buttons have labels

---

### **Scenario 13: Reduced Motion**

**Steps:**
1. Enable "Reduce motion" in OS settings
2. Go through flow
3. Watch animations

**Expected:**
- ✅ Progress bars don't transition (instant)
- ✅ Fill animations disabled
- ✅ No width transitions on chapter bars

---

## 📊 Analytics Events to Check

**Console should show:**

```
[Analytics] { event: 'onboarding_started', flow: 'vehicle' }
[Analytics] { event: 'step_viewed', stepId: 'vin' }
[Analytics] { event: 'vin_typed', length: 17 }
[Analytics] { event: 'vin_validated' }
[Analytics] { event: 'step_completed', stepId: 'vin' }
[Analytics] { event: 'step_viewed', stepId: 'vin_decoding' }
[Analytics] { event: 'vin_decode_start' }
[Analytics] { event: 'vin_decode_success', make: 'HONDA' }
[Analytics] { event: 'step_viewed', stepId: 'vehicle_confirm' }
[Analytics] { event: 'vehicle_confirm_accept' }
```

**On paste:**
```
[Analytics] { event: 'vin_pasted' }
```

**On slow API:**
```
[Analytics] { event: 'vin_decode_slow', atMs: 12000 }
```

**On timeout:**
```
[Analytics] { event: 'vin_decode_timeout' }
```

---

## 🐛 Known Issues to Watch For

### **Potential Issues:**

1. **CORS errors from NHTSA API**
   - **Solution:** Server-side API route handles this
   - **Check:** Network tab should show `/api/vin/decode`, not direct NHTSA call

2. **Auto-advance too fast**
   - **Expected:** 1.5s delay to show success state
   - **If too fast:** Increase delay in page.tsx

3. **Progress bar doesn't update**
   - **Check:** `currentStep` state updates correctly
   - **Check:** `getCurrentStepNumber()` returns 1, 2, 3

4. **Chapter bar too small**
   - **Expected:** Active bar uses `flex-1` (full width)
   - **Check:** Parent has `w-full` class

5. **Back button from decoding**
   - **Expected:** Goes to VIN, not refresh
   - **If broken:** Check `handleBack()` logic

---

## ✅ Acceptance Checklist

Before marking Phase 1 complete:

**UI:**
- [ ] VIN input validates (17 chars, no I/O/Q)
- [ ] Character counter turns green
- [ ] Help popover shows locations
- [ ] Paste strips spaces/dashes
- [ ] Continue enables when valid

**API:**
- [ ] Decoding calls `/api/vin/decode`
- [ ] Real NHTSA data returned
- [ ] Rollup includes safety + EPA
- [ ] Timeout at 20s works
- [ ] Error taxonomy correct

**Flow:**
- [ ] Auto-advance to confirm works
- [ ] Back button navigates correctly
- [ ] Edit VIN button works
- [ ] Start over resets state
- [ ] Exit redirects (placeholder)

**Polish:**
- [ ] Progress bars update (1→2→3)
- [ ] Active bar expands (flex-1)
- [ ] Autosave indicator updates
- [ ] Title/subtitle change per step
- [ ] Glassmorphism visible

**A11y:**
- [ ] Focus moves to title
- [ ] ARIA announces progress
- [ ] Keyboard shortcuts work
- [ ] Screen reader friendly
- [ ] Reduced motion respected

**Mobile:**
- [ ] 44px touch targets
- [ ] Overflow menu tappable
- [ ] No horizontal scroll
- [ ] One-handed friendly

**Analytics:**
- [ ] All 12 events fire
- [ ] Flow namespace correct
- [ ] Device type detected

---

## 🚀 Next Steps After Testing

**If everything works:**
1. Mark Phase 1 complete ✅
2. Document any bugs
3. Start Phase 2 planning

**If issues found:**
1. Document in issues list
2. Fix high-priority bugs
3. Re-test
4. Then proceed to Phase 2

---

## 📝 Test Results Template

```markdown
## Phase 1 Test Results

**Date:** [Date]
**Tester:** [Name]
**Browser:** [Chrome/Safari/Firefox]
**Device:** [Desktop/Mobile]

### Scenarios Tested:
- [ ] Happy path (valid VIN)
- [ ] Invalid VIN
- [ ] Paste handler
- [ ] Back navigation
- [ ] Start over
- [ ] Autosave
- [ ] Keyboard nav
- [ ] Slow API
- [ ] Mobile
- [ ] Accessibility
- [ ] Reduced motion
- [ ] Analytics

### Issues Found:
1. [Issue description]
2. [Issue description]

### Overall Status:
- [ ] Pass - Ready for Phase 2
- [ ] Pass with minor issues
- [ ] Fail - Needs fixes

### Notes:
[Any additional observations]
```

---

**Good luck testing! 🎉**

**Phase 1 = VIN chapter done. Phase 2 = Conversational chapter next!**
