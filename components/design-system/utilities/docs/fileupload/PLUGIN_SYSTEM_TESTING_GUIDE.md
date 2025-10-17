# Plugin System Testing Guide 🧪

## Quick Start

We've built a **complete plugin system** with a live demo component for testing!

---

## 🎯 How to Test

### Step 1: Add Demo Component to a Page

```tsx
// app/test-plugins/page.tsx (or any page)

import { PluginSystemDemo } from '@/components/design-system/utilities/file-upload/__tests__/plugin-system-demo'

export default function TestPage() {
  return <PluginSystemDemo />
}
```

### Step 2: Visit the Page

Navigate to your test page (e.g., `/test-plugins`)

### Step 3: Try Each Scenario

The demo has **4 test scenarios**:

---

## 📋 Test Scenarios

### **Scenario 1: Basic (No Plugins)**

**Purpose:** Verify FileUpload works normally without plugins

**Test:**
1. Click "Basic (No Plugins)" button
2. Upload any files (images, PDFs, etc.)
3. Verify files are added
4. Remove files
5. Verify they're removed

**Expected:**
- ✅ All file types accepted
- ✅ No validation
- ✅ Normal FileUpload behavior

---

### **Scenario 2: File Validation**

**Purpose:** Test the fileValidator plugin

**Test:**
1. Click "File Validation" button
2. Try uploading a small image (< 5MB) → Should ACCEPT ✅
3. Try uploading a large image (> 5MB) → Should REJECT ❌
4. Try uploading a PDF → Should REJECT ❌
5. Check console for rejection messages

**Expected:**
- ✅ Small images accepted
- ❌ Large files rejected with error message
- ❌ Non-images rejected with error message
- ✅ Console shows: "❌ Validation failed..."

---

### **Scenario 3: Paste Support**

**Purpose:** Test the pasteSupport plugin

**Test:**
1. Click "Paste Support" button
2. Copy an image (screenshot, image from browser)
3. Press Ctrl+V (Windows) or Cmd+V (Mac)
4. Verify image appears in file list
5. Check console for paste event

**Expected:**
- ✅ Pasted images are added
- ✅ Console shows: "Image pasted from clipboard"
- ✅ Works with screenshots
- ✅ Works with copied images

---

### **Scenario 4: Combined Plugins**

**Purpose:** Test multiple plugins working together

**Test:**
1. Click "Combined Plugins" button
2. Paste a small image → Should ACCEPT ✅
3. Paste a large image (> 10MB) → Should REJECT ❌
4. Upload a small image → Should ACCEPT ✅
5. Upload a PDF → Should REJECT ❌
6. Check console for both plugin messages

**Expected:**
- ✅ Validation runs on pasted files
- ✅ Both plugins work together
- ✅ No conflicts
- ✅ Console shows validation + paste events

---

## 🔍 What to Check

### **Console Messages**

Open browser DevTools console and look for:

**Plugin Registration:**
```
✅ Plugin registered: @motomind/file-validator
✅ Plugin registered: @motomind/paste-support
```

**File Validation (Success):**
```
📋 Validating file: image.jpg
✅ Validation passed: image.jpg
```

**File Validation (Failure):**
```
📋 Validating file: large-file.jpg
❌ Validation failed (max size): Image is too large! Max 5MB allowed: large-file.jpg (8.5 MB > 5 MB)
```

**Paste Events:**
```
📋 Paste event detected
✅ Image pasted from clipboard
```

---

### **Event Log**

The demo component has a live event log showing:
- Scenario changes
- File additions
- Plugin events
- Validation results

---

## ✅ Success Criteria

### **Core System**
- [ ] Plugins register on mount
- [ ] Plugins unregister on unmount
- [ ] No errors in console
- [ ] FileUpload works without plugins

### **File Validator Plugin**
- [ ] Accepts valid files
- [ ] Rejects files over size limit
- [ ] Rejects wrong file types
- [ ] Shows clear error messages
- [ ] Console logs are accurate

### **Paste Support Plugin**
- [ ] Detects paste events
- [ ] Extracts images from clipboard
- [ ] Adds files to FileUpload
- [ ] Works with screenshots

### **Combined Plugins**
- [ ] Multiple plugins work together
- [ ] No conflicts
- [ ] Validation runs on pasted files
- [ ] Order is respected (validate → paste)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module './utils'"

**Cause:** Plugin utilities file missing or not exported properly

**Fix:** Check that `plugins/utils.ts` exists and exports functions

---

### Issue 2: Validation not working

**Cause:** Plugin not registered or hook not executed

**Fix:** 
- Check console for plugin registration message
- Verify `plugins` prop is passed to FileUpload
- Check `before-file-added` hook is defined

---

### Issue 3: Paste not working

**Cause:** Browser permissions or focus issues

**Fix:**
- Ensure page has focus (click on it first)
- Try Ctrl+V (Windows) or Cmd+V (Mac)
- Check console for paste event
- Try pasting a screenshot

---

### Issue 4: Multiple plugins conflict

**Cause:** Hook execution order or state issues

**Fix:**
- Check plugin order in array
- Verify each plugin returns correct values
- Check console for errors

---

## 📝 Manual Testing Checklist

Print this and check off as you test:

### Basic Functionality
- [ ] FileUpload renders without plugins
- [ ] Files can be added
- [ ] Files can be removed
- [ ] Multiple files work
- [ ] Preview works

### File Validator Plugin
- [ ] Rejects files over size limit
- [ ] Rejects wrong file types
- [ ] Accepts valid files
- [ ] Error messages clear
- [ ] Console logs accurate
- [ ] Works with drag & drop
- [ ] Works with file picker
- [ ] Works with paste (if combined)

### Paste Support Plugin
- [ ] Detects Ctrl/Cmd+V
- [ ] Extracts images from clipboard
- [ ] Adds to file list
- [ ] Works with screenshots
- [ ] Works with copied images
- [ ] Console shows paste events

### Combined Plugins
- [ ] Both plugins initialize
- [ ] Both plugins execute
- [ ] No conflicts
- [ ] Validation runs on pasted files
- [ ] Both show console logs
- [ ] Performance is good

### Error Handling
- [ ] Plugin errors don't crash app
- [ ] FileUpload continues working
- [ ] Errors logged to console
- [ ] User sees feedback

### Performance
- [ ] No lag when adding files
- [ ] No lag when pasting
- [ ] No memory leaks
- [ ] Fast validation (<100ms)

---

## 🎯 Expected Results

After testing all scenarios, you should see:

✅ **Core System:**
- Plugins register/unregister cleanly
- No errors in console
- FileUpload works with and without plugins

✅ **File Validator:**
- Clear rejection messages
- Fast validation
- Accurate size/type checking

✅ **Paste Support:**
- Reliable paste detection
- Works with all image sources
- Clean clipboard handling

✅ **Combined:**
- Seamless integration
- No conflicts
- Predictable behavior

---

## 🚀 Next Steps After Testing

### If Everything Works ✅

**Option 1:** Build more plugins
- Image Rotation Plugin
- EXIF Stripper Plugin
- Custom MotoMind plugins

**Option 2:** Integrate into app
- Add plugins to real forms
- Use in production
- Monitor performance

**Option 3:** Share with team
- Show demo
- Document usage
- Train developers

---

### If Issues Found ❌

**Document the issue:**
1. What scenario caused it?
2. What did you expect?
3. What actually happened?
4. Console errors?
5. Steps to reproduce?

**Then:**
- Fix the bug
- Re-test
- Update documentation

---

## 💡 Testing Tips

### Tip 1: Use Different Browsers
Test in Chrome, Firefox, Safari to ensure compatibility

### Tip 2: Test with Real Files
Use actual vehicle photos, documents, etc. from your use case

### Tip 3: Test Edge Cases
- Very large files (100MB+)
- Very small files (1 byte)
- Unusual file types
- Special characters in filenames
- Many files at once (20+)

### Tip 4: Check Performance
- Time validation speed
- Monitor memory usage
- Check for leaks (upload 100+ files)

### Tip 5: Test User Experience
- Are error messages clear?
- Is feedback immediate?
- Is it intuitive?
- Any confusion?

---

## 📊 Test Report Template

Use this template to document your testing:

```markdown
# Plugin System Test Report

**Date:** [Date]
**Tester:** [Name]
**Browser:** [Chrome/Firefox/Safari]
**Version:** [Version]

## Test Results

### Scenario 1: Basic
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

### Scenario 2: File Validation
- Status: ✅ Pass / ❌ Fail
- Files tested: [List]
- Notes: [Any observations]

### Scenario 3: Paste Support
- Status: ✅ Pass / ❌ Fail
- Sources tested: [Screenshot, Browser, etc.]
- Notes: [Any observations]

### Scenario 4: Combined
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

## Issues Found

1. [Issue description]
   - Severity: High / Medium / Low
   - Steps to reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]

## Performance

- Validation speed: [ms per file]
- Memory usage: [MB]
- UI responsiveness: Good / Fair / Poor

## Recommendations

[Your recommendations for improvements]

## Conclusion

Overall Status: ✅ Ready / ⚠️ Needs Work / ❌ Not Ready
```

---

## 🎊 Summary

You now have:
1. ✅ Complete plugin system
2. ✅ Interactive demo component
3. ✅ Testing guide
4. ✅ Test checklist
5. ✅ Troubleshooting guide

**Go test it and let me know how it goes!** 🚀

---

## Quick Commands

```bash
# Run your app
npm run dev

# Navigate to test page
# http://localhost:3000/test-plugins

# Open DevTools
# F12 (Windows) or Cmd+Option+I (Mac)

# Start testing!
```

---

**Happy Testing!** 🎉
