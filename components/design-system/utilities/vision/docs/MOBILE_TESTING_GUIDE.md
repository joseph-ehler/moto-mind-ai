# 📱 Mobile Testing Guide - Vision System

## Overview

Complete guide for testing the vision system on real mobile devices (iOS & Android).

---

## 🎯 Test Checklist

### **Camera Functionality**
- [ ] Camera initializes on mobile
- [ ] Rear camera is default (environment facing mode)
- [ ] Front camera switch works
- [ ] Auto-focus works for VIN/license plates
- [ ] Flash/torch controls work (if available)
- [ ] Video orientation correct (portrait & landscape)

### **Capture Experience**
- [ ] Frame guides visible and aligned
- [ ] Haptic feedback on capture
- [ ] Processing modal shows
- [ ] Success/error feedback clear
- [ ] Retry flow works

### **Batch Capture**
- [ ] Gallery picker opens
- [ ] Multiple image selection works
- [ ] Camera + Gallery mixed mode works
- [ ] Sequential captures work
- [ ] Progress tracking accurate

### **Performance**
- [ ] Camera starts quickly (<2s)
- [ ] Capture is instant
- [ ] Processing completes in <5s
- [ ] No memory leaks on repeated captures
- [ ] Battery drain is acceptable

### **Plugin Pipeline**
- [ ] VIN validation works on mobile
- [ ] Confidence scoring accurate
- [ ] VIN decoding successful
- [ ] Data enrichment complete

---

## 🔧 Setup

### **1. Enable HTTPS for Local Development**

Mobile devices require HTTPS for camera access.

```bash
# Install mkcert (one-time setup)
brew install mkcert
mkcert -install

# Create SSL certificates
cd your-project-root
mkcert localhost

# Update next.config.js
```

```js
// next.config.js
const fs = require('fs')
const https = require('https')

module.exports = {
  // ... other config
  
  // Development server with HTTPS
  server: {
    dev: {
      https: {
        key: fs.readFileSync('./localhost-key.pem'),
        cert: fs.readFileSync('./localhost.pem'),
      },
    },
  },
}
```

### **2. Network Configuration**

```bash
# Find your local IP
ipconfig getifaddr en0  # macOS
# or
ip addr show  # Linux

# Start dev server
npm run dev

# Access from mobile
# https://192.168.1.XXX:3000
```

### **3. Trust Certificate on Mobile**

**iOS:**
1. Navigate to `https://your-local-ip:3000`
2. Safari will show warning → "Show Details"
3. Tap "visit this website"
4. Settings → General → About → Certificate Trust Settings
5. Enable trust for your cert

**Android:**
1. Chrome will show "Your connection is not private"
2. Click "Advanced" → "Proceed to..."
3. Grant camera permission when prompted

---

## 📱 Device-Specific Testing

### **iOS Safari**

**Camera Constraints:**
```typescript
{
  facingMode: 'environment',  // Rear camera
  width: { ideal: 1920 },
  height: { ideal: 1080 }
}
```

**Known Issues:**
- iOS 14.3+ may have camera rotation issues
- Safari requires user gesture for camera start
- Picture-in-picture may conflict with camera

**Testing Checklist:**
- [ ] iPhone SE (small screen)
- [ ] iPhone 12/13/14 (standard)
- [ ] iPhone 14 Pro Max (large)
- [ ] iPad (tablet)

### **Android Chrome**

**Camera Constraints:**
```typescript
{
  facingMode: { exact: 'environment' },  // Force rear
  width: { min: 1280, ideal: 1920 },
  height: { min: 720, ideal: 1080 }
}
```

**Known Issues:**
- Some devices have camera rotation lag
- Older Android may not support high resolutions
- Chrome may cache camera permissions

**Testing Checklist:**
- [ ] Samsung Galaxy (standard)
- [ ] Google Pixel (native Android)
- [ ] Budget device (performance test)
- [ ] Tablet (large screen)

---

## 🧪 Test Scenarios

### **Scenario 1: VIN Scanning from Camera**

1. Open `/test/vision-plugins` on mobile
2. Tap "Start VIN Scan"
3. Point at VIN plate
4. Tap capture button
5. Verify:
   - ✅ VIN detected correctly
   - ✅ Make/model/year populated
   - ✅ Confidence > 90%
   - ✅ Processing < 5 seconds

### **Scenario 2: Batch Upload from Gallery**

1. Open `/test/batch-vision` on mobile
2. Tap "Upload Photos"
3. Select 5 VIN photos from gallery
4. Tap "Process All"
5. Verify:
   - ✅ All images upload successfully
   - ✅ Progress tracking works
   - ✅ All VINs processed
   - ✅ Results display correctly

### **Scenario 3: Sequential Camera Captures**

1. Open `/test/batch-vision` on mobile
2. Use camera mode
3. Capture 3 VINs sequentially
4. Review in gallery
5. Process batch
6. Verify:
   - ✅ All captures saved
   - ✅ Can reorder/remove
   - ✅ Batch processing works
   - ✅ Statistics accurate

---

## 🐛 Common Issues & Solutions

### **Issue: Camera won't start**

**Symptoms:** Black screen, "Camera access denied"

**Solutions:**
1. Check HTTPS is enabled
2. Verify browser has camera permission
3. Check no other app is using camera
4. Restart browser
5. Clear browser data

### **Issue: Image rotates incorrectly**

**Symptoms:** Portrait image shows as landscape

**Solutions:**
1. Enable `autoRotate: true` in preprocessing
2. Check EXIF orientation handling
3. Test with different image sources

### **Issue: Processing too slow**

**Symptoms:** > 10 seconds per image

**Solutions:**
1. Enable image preprocessing (compression)
2. Reduce camera resolution
3. Test network speed
4. Check server performance

### **Issue: High battery drain**

**Symptoms:** Battery drops quickly during scanning

**Solutions:**
1. Stop camera between captures
2. Reduce camera resolution
3. Disable continuous focus
4. Minimize processing

---

## 📊 Performance Benchmarks

### **Target Metrics:**

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Camera Start | < 1s | < 2s | > 3s |
| Capture Latency | < 100ms | < 200ms | > 500ms |
| Processing Time | < 3s | < 5s | > 10s |
| Plugin Pipeline | < 1s | < 2s | > 3s |
| Memory Usage | < 100MB | < 200MB | > 300MB |
| Battery Drain | < 5%/min | < 10%/min | > 15%/min |

### **How to Measure:**

```typescript
// Add performance tracking
const startTime = performance.now()
await visionService.processFile(file)
const duration = performance.now() - startTime
console.log(`Processing took ${duration}ms`)

// Memory usage (Chrome DevTools)
performance.memory.usedJSHeapSize / 1024 / 1024 // MB
```

---

## 🔍 Debugging on Mobile

### **Remote Debugging:**

**iOS Safari:**
1. Enable Web Inspector on iPhone
2. Connect to Mac via USB
3. Safari → Develop → [Your iPhone] → [Page]

**Android Chrome:**
1. Enable USB debugging on Android
2. Connect to computer via USB
3. Chrome → `chrome://inspect` → Select device

### **Console Logging:**

```typescript
// Add detailed logging
console.log('[Vision] Camera starting...', {
  constraints: cameraConstraints,
  device: navigator.userAgent,
  screen: { width: window.screen.width, height: window.screen.height }
})
```

### **Error Reporting:**

```typescript
// Capture errors for analysis
window.addEventListener('error', (event) => {
  // Send to analytics
  analytics.track('mobile_error', {
    message: event.message,
    stack: event.error?.stack,
    device: navigator.userAgent
  })
})
```

---

## ✅ Production Readiness Checklist

Before deploying to production:

- [ ] Tested on >= 3 iOS devices
- [ ] Tested on >= 3 Android devices
- [ ] All performance metrics met
- [ ] Error handling verified
- [ ] Fallback UI for unsupported browsers
- [ ] Analytics tracking implemented
- [ ] Camera permissions properly requested
- [ ] HTTPS enforced in production
- [ ] Image optimization confirmed
- [ ] Plugin pipeline verified
- [ ] Battery usage acceptable
- [ ] Memory leaks checked
- [ ] Accessibility tested (screen readers)

---

## 📚 Resources

- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Can I Use: getUserMedia](https://caniuse.com/stream)
- [iOS Safari Camera Issues](https://bugs.webkit.org/buglist.cgi?quicksearch=camera)
- [Android Chrome Camera](https://developer.chrome.com/docs/web-platform/getusermedia/)

---

*Last Updated: 2025-10-07*
*Status: Ready for Testing*
