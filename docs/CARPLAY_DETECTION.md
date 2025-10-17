# CarPlay & Android Auto Detection

## Overview

Multi-signal car detection system that automatically detects when your phone connects to your car via CarPlay or Android Auto. Works with both wireless and wired connections.

## How It Works

### Detection Signals

The system uses 5 different signals to detect car connection:

| Signal | Points | Indicates |
|--------|--------|-----------|
| Display Mode (CarPlay/Android Auto) | 50 | App running in car display |
| Screen Resolution | 15 | Display matches CarPlay specs |
| Charging (wired) | 30 | Plugged into car USB |
| Car Audio | 10 | Media session active |
| WiFi (wireless) | 10 | Connected via WiFi (not cellular) |
| **Repeat Connection Boost** | +10 | Similar to last 24h connection |

### Confidence Scoring

Total confidence score (0-100) determines connection level:

- **Very High (80-100)**: Definitely connected to car
- **High (60-79)**: Strong indicators of car connection
- **Medium (40-59)**: Likely connected to car
- **Low (0-39)**: Weak or no car connection

### Connection Types

**Wireless Connection:**
- Car Bluetooth + Car WiFi
- Or CarPlay/Android Auto display mode (without charging)
- Common in newer vehicles (2019+)

**Wired Connection:**
- Device charging + (CarPlay display OR car Bluetooth)
- USB cable to car
- More reliable but less convenient

### Connection Memory (Learning Feature)

The system remembers your last successful car connection for 24 hours:

**What it learns:**
- Connection type (wireless or wired)
- Which signals were present
- Confidence level achieved
- Time of connection

**How it helps:**
- **+10 confidence boost** when you reconnect with similar signals
- Reduces false negatives on subsequent connections
- Adapts to your specific car's behavior
- Automatically forgets old connections after 24 hours

**Example:**
```
First connection: Display mode + charging = 80 points (very-high)
(System saves this pattern)

Second connection (same day): Display mode + charging = 80 + 10 = 90 points
Reason: "Similar to previous car connection"
```

## Usage

### In Your Component

```tsx
import { useCarPlayDetection } from '@/hooks/useCarPlayDetection'
import { CarPlayBanner } from '@/components/tracking/CarPlayBanner'

function TrackingPage() {
  const carPlaySignals = useCarPlayDetection()
  
  // Show banner when car detected
  return (
    <div>
      {carPlaySignals && (
        <CarPlayBanner
          onAutoStart={() => startTracking()}
          isTracking={trackingActive}
          minimumConfidence="medium"
        />
      )}
    </div>
  )
}
```

### Auto-Start Configuration

Users can enable auto-start tracking when car is detected:

```tsx
<CarPlayBanner
  onAutoStart={handleStart}
  isTracking={isActive}
  minimumConfidence="medium" // Adjust threshold
/>
```

**Confidence Thresholds:**
- `"low"`: Auto-start with any car indicator (may have false positives)
- `"medium"`: Balanced accuracy (recommended)
- `"high"`: Very confident car connection
- `"very-high"`: Absolute certainty (may miss some connections)

## Testing Without a Car

You can simulate car detection for development:

### Simulate Wired Connection

1. Connect phone to charger
2. Connect Bluetooth headphones/speaker (ideally with "car" in name)
3. Confidence should reach "medium" or "high"

### Simulate Wireless Connection

1. Connect to WiFi network
2. Connect Bluetooth device
3. Keep phone unplugged
4. May show as "medium" confidence

### Testing in Browser DevTools

```javascript
// Manually trigger detection
const detector = new EnhancedCarPlayDetector()
const signals = await detector.detect()
console.log(signals)

// Listen for changes
detector.onConnectionChange((connected, signals) => {
  console.log('Connected:', connected)
  console.log('Confidence:', signals.confidence)
})

detector.startMonitoring()
```

## Real-World Testing

### Test Scenario 1: Wireless CarPlay

1. Get in car
2. Phone connects to car Bluetooth automatically
3. Open MotoMind app
4. Should see banner: "CarPlay Connected (Wireless)"
5. Confidence: Very High (80-100%)
6. Enable auto-start if desired

### Test Scenario 2: Wired CarPlay/Android Auto

1. Get in car
2. Plug phone into USB cable
3. CarPlay/Android Auto launches
4. Open MotoMind app
5. Should see banner: "CarPlay Connected (Wired)"
6. Confidence: Very High (80-100%)

### Test Scenario 3: Bluetooth Only

1. Get in car
2. Phone connects to car Bluetooth
3. Don't plug in USB (wireless not available)
4. Open MotoMind app
5. Should see banner: "Car Connected"
6. Confidence: Medium (40-59%)

## Troubleshooting

### Banner Doesn't Appear

**Check:**
- Is Bluetooth enabled on phone?
- Is phone connected to car's Bluetooth?
- Is location permission granted?
- Try refreshing the page

**Lower the threshold:**
```tsx
<CarPlayBanner minimumConfidence="low" />
```

### False Positives (Banner appears when not in car)

**Solutions:**
- Increase minimum confidence threshold
- Disable Bluetooth when not driving
- Check if other Bluetooth devices have "car" in name

**Adjust threshold:**
```tsx
<CarPlayBanner minimumConfidence="high" />
```

### Auto-Start Not Working

**Verify:**
1. Auto-start is enabled (toggle in banner)
2. Tracking isn't already active
3. Confidence meets minimum threshold
4. `onAutoStart` callback is provided

**Debug:**
```javascript
// Check localStorage
console.log(localStorage.getItem('carplay_autostart'))

// Should be 'true'
```

## Browser Compatibility

### iOS Safari

✅ **Works:**
- Geolocation
- Battery Status
- Display mode detection
- Screen resolution check

❌ **Limited:**
- Web Bluetooth (not supported)
- WiFi SSID (not exposed)

**Detection relies on:**
- Charging status
- Display mode
- Screen resolution

### Android Chrome

✅ **Works:**
- All signals supported
- Web Bluetooth (with permission)
- Network information
- Display mode detection

**Best platform for full detection.**

### Desktop Browsers

⚠️ **Limited Detection:**
- No Bluetooth connection
- No charging status
- No CarPlay/Android Auto mode

**Not designed for desktop use.**

## Known Limitations

1. **WiFi SSID:** Browsers don't expose network names for privacy
   - Detection relies on checking if connected to WiFi (vs cellular)
   
2. **Bluetooth API:** Requires explicit user permission
   - Detection uses media session as proxy instead
   - Less reliable than true Bluetooth detection
   
3. **iOS Safari:** Limited API support
   - No Web Bluetooth API
   - Battery API may not always be available
   
4. **Display Mode:** Only reliable when actually in CarPlay/Android Auto
   - Regular browser won't show display mode
   
5. **First Connection:** May have lower confidence
   - System learns your car over time
   - Subsequent connections are more accurate

## Best Practices

### For Solo Drivers

1. Enable auto-start after testing in your actual car
2. Use "medium" confidence (balances accuracy and convenience)
3. Keep Bluetooth on while driving
4. Install app as PWA for better persistence

### For App Developers

```typescript
// Always provide fallback
<CarPlayBanner
  onAutoStart={handleStart}
  minimumConfidence="medium"
/>

// Or check manually
const isConnected = useIsCarConnected('high')
if (isConnected && userWantsAutoStart) {
  startTracking()
}
```

### For Testing

1. Test in real car (best accuracy)
2. Test with various Bluetooth devices
3. Test both wired and wireless scenarios
4. Test with low battery
5. Test airplane mode (should disconnect)

## API Reference

### `EnhancedCarPlayDetector`

```typescript
class EnhancedCarPlayDetector {
  // Detect current connection status
  async detect(): Promise<CarConnectionSignals>
  
  // Start monitoring for changes
  startMonitoring(): void
  
  // Stop monitoring
  stopMonitoring(): void
  
  // Listen to connection changes
  onConnectionChange(
    callback: (connected: boolean, signals: CarConnectionSignals) => void
  ): void
}
```

### `useCarPlayDetection()`

```typescript
function useCarPlayDetection(): CarConnectionSignals | null
```

Returns current detection signals or `null` if not yet detected.

### `useIsCarConnected()`

```typescript
function useIsCarConnected(
  minimumConfidence: 'low' | 'medium' | 'high' | 'very-high'
): boolean
```

Returns `true` if car is connected with sufficient confidence.

### `CarConnectionSignals`

```typescript
interface CarConnectionSignals {
  connectionType: 'wired' | 'wireless' | 'unknown'
  signals: {
    charging: boolean
    carBluetooth: boolean
    carWiFi: boolean
    displayMode: 'carplay' | 'android-auto' | 'normal'
    networkSSID: string | null
    screenResolution: { matches: boolean; type: string }
  }
  confidence: {
    level: 'low' | 'medium' | 'high' | 'very-high'
    score: number // 0-100
    reasons: string[]
  }
}
```

## Future Enhancements

- [ ] Remember specific car Bluetooth devices
- [ ] Learn parking locations for each car
- [ ] Detect specific car models
- [ ] Integrate with OBD-II readers
- [ ] Auto-pause when leaving car
- [ ] Historical car connection data

## Support

For issues or questions:
- Check troubleshooting section above
- Review browser console for errors
- Test with different confidence thresholds
- Open issue on GitHub with detection logs

---

**Status:** Production ready  
**Last Updated:** October 17, 2025  
**Version:** 1.0.0
