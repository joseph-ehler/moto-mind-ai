# Plugin System Testing Checklist ✅

**Date:** _____________  
**Tester:** _____________  
**Time Started:** _____________

---

## 🎯 Quick Start

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to test page:**
   ```
   http://localhost:3000/test-plugins
   ```

3. **Open DevTools Console:**
   - Press F12 (Windows/Linux)
   - Press Cmd+Option+I (Mac)

---

## ✅ Test Scenario 1: Basic (No Plugins)

**Purpose:** Verify FileUpload works normally without plugins

- [ ] Click "Basic (No Plugins)" button
- [ ] Upload a small image (< 5MB)
- [ ] File appears in the list
- [ ] Upload a PDF
- [ ] File appears in the list
- [ ] Upload multiple files
- [ ] All files appear
- [ ] Remove a file
- [ ] File is removed from list
- [ ] No errors in console

**Expected Result:** All file types accepted, normal behavior ✅

**Notes:**
_____________________________________________
_____________________________________________

---

## ✅ Test Scenario 2: File Validation

**Purpose:** Test file validator plugin

- [ ] Click "File Validation" button
- [ ] Console shows: "✅ Plugin registered: @motomind/file-validator"
- [ ] Upload small image (< 5MB)
- [ ] ✅ File is ACCEPTED
- [ ] Console shows: "✅ Validation passed"
- [ ] Upload large image (> 5MB)
- [ ] ❌ File is REJECTED
- [ ] Console shows: "❌ Validation failed (max size)"
- [ ] Error message is clear
- [ ] Upload a PDF
- [ ] ❌ File is REJECTED
- [ ] Console shows: "❌ Validation failed (allowed types)"
- [ ] Upload .exe or .zip file
- [ ] ❌ File is REJECTED

**Expected Result:** Only images under 5MB accepted ✅

**Issues Found:**
_____________________________________________
_____________________________________________

---

## ✅ Test Scenario 3: Paste Support

**Purpose:** Test paste support plugin

- [ ] Click "Paste Support" button
- [ ] Console shows: "✅ Plugin registered: @motomind/paste-support"
- [ ] Copy an image (screenshot or browser)
- [ ] Press Ctrl+V (Windows) or Cmd+V (Mac)
- [ ] Image appears in file list
- [ ] Console shows: "📋 Paste event detected"
- [ ] Console shows: "✅ Image pasted from clipboard"
- [ ] Take a screenshot
- [ ] Press Ctrl+V / Cmd+V
- [ ] Screenshot appears in file list
- [ ] Try pasting text
- [ ] Nothing happens (correct)

**Expected Result:** Pasted images are added to file list ✅

**Issues Found:**
_____________________________________________
_____________________________________________

---

## ✅ Test Scenario 4: Combined Plugins

**Purpose:** Test multiple plugins working together

- [ ] Click "Combined Plugins" button
- [ ] Console shows both plugins registered
- [ ] Upload small image (< 10MB)
- [ ] ✅ File is ACCEPTED
- [ ] Upload large image (> 10MB)
- [ ] ❌ File is REJECTED
- [ ] Console shows validation error
- [ ] Paste small image
- [ ] ✅ File is ACCEPTED
- [ ] Paste works correctly
- [ ] Try uploading PDF
- [ ] ❌ File is REJECTED
- [ ] Validation runs on pasted files
- [ ] No plugin conflicts
- [ ] Both plugins work harmoniously

**Expected Result:** Both plugins work together seamlessly ✅

**Issues Found:**
_____________________________________________
_____________________________________________

---

## 📊 Console Log Verification

Open DevTools Console and verify you see:

### Plugin Registration
- [ ] "✅ Plugin registered: @motomind/file-validator"
- [ ] "✅ Plugin registered: @motomind/paste-support"

### Validation Success
- [ ] "📋 Validating file: [filename]"
- [ ] "✅ Validation passed: [filename]"

### Validation Failure
- [ ] "❌ Validation failed (max size): ..."
- [ ] "❌ Validation failed (allowed types): ..."

### Paste Events
- [ ] "📋 Paste event detected"
- [ ] "✅ Image pasted from clipboard"

### Plugin Cleanup
- [ ] When switching scenarios, old plugins unregister
- [ ] "🧹 Plugin unregistered: [plugin-id]"

---

## 🐛 Bug Report Template

If you find issues, use this template:

**Bug #1:**
- Scenario: _________________________
- Expected: _________________________
- Actual: _________________________
- Console Error: _________________________
- Steps to Reproduce:
  1. _________________________
  2. _________________________
  3. _________________________

**Bug #2:**
- Scenario: _________________________
- Expected: _________________________
- Actual: _________________________
- Console Error: _________________________
- Steps to Reproduce:
  1. _________________________
  2. _________________________
  3. _________________________

---

## ⚡ Performance Check

- [ ] File upload feels instant (< 100ms)
- [ ] Validation is fast (< 50ms per file)
- [ ] Paste is responsive (< 200ms)
- [ ] No UI lag or freezing
- [ ] No memory leaks (test with 20+ files)
- [ ] Console logs are reasonable (not spamming)

---

## ✅ Final Verification

### Core Functionality
- [ ] Plugin registration works
- [ ] Plugin cleanup works
- [ ] Hooks execute correctly
- [ ] Events fire properly
- [ ] UI updates correctly

### File Validator
- [ ] Size validation works
- [ ] Type validation works
- [ ] Error messages are clear
- [ ] Console logs are helpful

### Paste Support
- [ ] Paste detection works
- [ ] Image extraction works
- [ ] File addition works
- [ ] Multiple pastes work

### Combined
- [ ] No plugin conflicts
- [ ] Both plugins execute
- [ ] Order is respected
- [ ] Performance is good

---

## 📝 Overall Results

**Total Tests:** 50+  
**Passed:** _____ / _____  
**Failed:** _____ / _____  
**Success Rate:** _____ %

**Overall Assessment:**
- [ ] ✅ Ready for production
- [ ] ⚠️ Minor issues found (document below)
- [ ] ❌ Major issues found (requires fixes)

---

## 💡 Additional Notes

**What worked well:**
_____________________________________________
_____________________________________________
_____________________________________________

**What needs improvement:**
_____________________________________________
_____________________________________________
_____________________________________________

**Suggestions:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## ✅ Completion

**Time Completed:** _____________  
**Total Time:** _____ minutes  
**Status:** _____________

**Next Steps:**
- [ ] Report findings
- [ ] Fix any bugs found
- [ ] Integrate into production
- [ ] Build more plugins
- [ ] Write automated tests

---

**Tested By:** _____________  
**Signature:** _____________  
**Date:** _____________
