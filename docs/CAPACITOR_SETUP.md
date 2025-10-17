# Capacitor Native App Setup

**Date:** Oct 17, 2025 (Evening)  
**Status:** ✅ Foundation Complete  
**Next:** Add background geolocation & auto-start

---

## 🎉 What We Built Tonight

### Foundation Complete:
- ✅ Capacitor installed (`@capacitor/core`, `@capacitor/cli`)
- ✅ iOS platform added
- ✅ Project structure created
- ✅ Development workflow configured
- ✅ Scripts added to package.json

### Project Structure:
```
motomind-ai/
├── ios/                          # Native iOS project (Xcode)
│   ├── App/
│   │   ├── App.xcodeproj        # Xcode project file
│   │   └── App/                 # iOS app code
│   └── capacitor-cordova-ios-plugins/
├── capacitor.config.ts          # Capacitor configuration
└── package.json                 # Added cap:* scripts
```

---

## 📱 App Configuration

### App Details:
- **Name:** MotoMind
- **Bundle ID:** com.motomind.app
- **Platforms:** iOS (Android later)
- **Web Dir:** `out` (Next.js build output)

### Development Mode:
Configured to use live reload from `http://localhost:3000`:
```typescript
server: {
  url: 'http://localhost:3000',
  cleartext: true
}
```

---

## 🚀 Available Commands

### Development:
```bash
# Start Next.js dev server (required for live reload)
npm run dev

# Open iOS project in Xcode
npm run cap:open:ios

# Run on iOS simulator/device
npm run cap:run:ios

# Sync web code to native projects
npm run cap:sync
```

### How to Develop:
1. Start dev server: `npm run dev`
2. Open Xcode: `npm run cap:open:ios`
3. Click "Run" in Xcode
4. App opens with live reload from localhost:3000
5. Edit code → Instant refresh in simulator!

---

## 🛠️ Next Steps (Tomorrow - Day 3)

### Phase 1: Add Background Geolocation
```bash
npm install @capacitor-community/background-geolocation
```

**Features to Enable:**
- Background location tracking
- Auto-start on motion detection
- Battery-optimized updates
- Location filtering (remove noise)

### Phase 2: Configure iOS Permissions
Add to `ios/App/App/Info.plist`:
```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>MotoMind tracks your trips automatically when you drive</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>MotoMind needs your location to track trips</string>

<key>NSMotionUsageDescription</key>
<string>MotoMind uses motion to detect when you're driving</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
</array>
```

### Phase 3: Build Auto-Start Detection
```typescript
// lib/tracking/auto-start-detector.ts

class AutoStartDetector {
  async detectTriggers() {
    // Multi-signal detection
    const signals = {
      carplay: await this.detectCarPlay(),
      bluetooth: await this.detectBluetooth(),
      motion: await this.detectMotion()
    }
    
    // Start tracking if high confidence
    if (signals.carplay.confidence === 'very-high') {
      await this.startTracking('carplay')
    }
  }
}
```

### Phase 4: Test in Real Car
- Get in car
- Connect CarPlay/Bluetooth
- Verify tracking auto-starts
- Drive around block
- Verify tracking continues in background
- Park and exit
- Verify tracking auto-stops
- Open app → See trip!

---

## 🎯 Success Criteria

### End of Day 3:
- ✅ Can run app on iPhone
- ✅ Background location works
- ✅ Auto-start triggers work
- ✅ Tracking continues when app backgrounded
- ✅ Tested in real car with real driving

### The Magic Experience:
```
User gets in car
  ↓
Phone connects to CarPlay
  ↓
MotoMind detects connection
  ↓
Tracking starts automatically
  ↓
User drives (phone in pocket)
  ↓
Tracking continues in background
  ↓
User parks and exits
  ↓
Tracking stops automatically
  ↓
Parking location saved
  ↓
Open app later → See trip!

Zero manual steps. Pure magic. ✨
```

---

## 📚 Resources

### Capacitor Docs:
- Getting Started: https://capacitorjs.com/docs/getting-started
- iOS Development: https://capacitorjs.com/docs/ios
- Next.js Guide: https://capacitorjs.com/docs/guides/nextjs

### Background Geolocation:
- Plugin Docs: https://github.com/capacitor-community/background-geolocation
- iOS Setup: https://github.com/capacitor-community/background-geolocation#ios
- Examples: https://github.com/capacitor-community/background-geolocation/tree/main/example

### Apple Docs:
- Location Best Practices: https://developer.apple.com/documentation/corelocation/getting_the_user_s_location
- Background Execution: https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background

---

## 🎊 Achievement Unlocked

**Tonight's Win:**
- ✅ Capacitor foundation complete (45 min)
- ✅ iOS project structure created
- ✅ Development workflow configured
- ✅ Ready for native features tomorrow

**Tomorrow's Goal:**
- 🎯 Build the magic (auto-start tracking)
- 🎯 Test in real car
- 🎯 Validate the magical experience

**You're building exactly what you said you wanted:** 
> "I'm not going to want to open an app and press a button every time"

Now you won't have to. It'll just work. ✨

---

**Status:** Foundation complete - Ready for Day 3! 🚀
