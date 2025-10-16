# Fix macOS System Notifications 🔔

## ✅ Your Code IS Working!

The console shows: `✅ Browser notification created successfully`

**This means the notification was sent to macOS, but macOS is blocking it.**

---

## 🔧 Fix macOS Notification Settings

### Step 1: Check Browser Permissions

**Chrome:**
1. Click the **lock icon** 🔒 in the address bar
2. Click **"Site settings"**
3. Find **"Notifications"**
4. Make sure it's set to **"Allow"** ✅

**Safari:**
1. Safari menu → **Settings**
2. Click **"Websites"** tab
3. Select **"Notifications"** in left sidebar
4. Find localhost and set to **"Allow"**

---

### Step 2: Check macOS System Settings

**macOS Ventura/Sonoma (13+):**

1. Open **System Settings** (⚙️)
2. Click **"Notifications"** in left sidebar
3. Scroll down and find your **browser** (Chrome, Safari, Firefox, etc.)
4. Click on the browser name
5. Make sure these are enabled:
   - ✅ **"Allow Notifications"** (toggle ON)
   - ✅ **"Show previews"** → "Always"
   - ✅ **"Show in Notification Center"** (checked)
   - ✅ **"Notification style"** → "Banners" or "Alerts"
   - ✅ **"Play sound for notifications"** (checked)

**macOS Monterey (12) or older:**

1. Open **System Preferences** → **Notifications**
2. Find your **browser** in the left list
3. Enable all notification options

---

### Step 3: Disable Do Not Disturb / Focus Modes

**Check if DND is on:**
- Look at the top-right menu bar
- If you see a moon icon 🌙 or Focus icon, click it
- Turn OFF "Do Not Disturb" and all Focus modes

**Detailed steps:**
1. Click **Control Center** (switches icon) in menu bar
2. Look for **"Focus"** or **"Do Not Disturb"**
3. Click it and select **"Off"**

**Or via System Settings:**
1. System Settings → **"Focus"**
2. Make sure all Focus modes are OFF
3. Check **"Share across devices"** is OFF (if you don't want other devices to trigger DND)

---

### Step 4: Check "Notification Summary" Settings

macOS may be batching your notifications:

1. System Settings → **"Notifications"**
2. Scroll down to **"Scheduled Summary"**
3. Make sure it's **OFF** or your browser is NOT in the summary list

---

### Step 5: Test Notification Immediately

Let's test if notifications work now:

1. Open your browser console (F12)
2. Paste this code:
   ```javascript
   new Notification('Test Notification', { 
     body: 'If you see this in macOS, it works!' 
   })
   ```
3. Press Enter
4. **Look at top-right corner of screen** for the notification

**Result:**
- ✅ **Notification appears** → macOS settings are fixed!
- ❌ **No notification** → Continue to Step 6

---

### Step 6: Restart Browser (Nuclear Option)

Sometimes Chrome needs a full restart:

1. **Completely quit browser:**
   - Chrome: `Cmd + Q` (not just close window!)
   - Safari: `Cmd + Q`
2. Wait 5 seconds
3. Reopen browser
4. Go back to your app
5. Try notification again

---

### Step 7: Check Browser Notification Settings (Deep Dive)

**Chrome Advanced Settings:**
1. Chrome menu → **Settings**
2. Click **"Privacy and security"** in left sidebar
3. Click **"Site Settings"**
4. Scroll down to **"Notifications"**
5. Make sure:
   - ✅ "Sites can ask to send notifications" (not blocked)
   - ✅ localhost:3005 is in "Allowed to send notifications"
   - ❌ localhost:3005 is NOT in "Not allowed to send notifications"

---

## 🧪 Testing Your Setup

### Quick Test in Browser Console:

```javascript
// Test 1: Check permission
console.log('Permission:', Notification.permission) 
// Should show: "granted"

// Test 2: Send test notification
if (Notification.permission === 'granted') {
  new Notification('Test from Console', {
    body: 'macOS notification test!',
    icon: '🔔'
  })
} else {
  console.log('Permission not granted!')
}
```

---

## 🎯 What Should Happen:

When notifications are working correctly:

1. **Notification appears** in top-right corner of screen
2. **"Ding" sound** plays (if enabled)
3. **Notification stays** for ~5 seconds
4. **Goes to Notification Center** (click clock to see)
5. **Click notification** → Brings browser to front

---

## 🐛 Common Issues:

### Issue 1: "Do Not Disturb" is on
**Fix:** Disable all Focus modes (see Step 3)

### Issue 2: Browser not allowed in System Settings
**Fix:** Add browser to allowed apps (see Step 2)

### Issue 3: Notification Summary is batching
**Fix:** Disable Scheduled Summary (see Step 4)

### Issue 4: "Show previews" is off
**Fix:** Set to "Always" in System Settings

### Issue 5: Browser cache issue
**Fix:** Hard refresh (Cmd + Shift + R) or restart browser

---

## ✅ After Fixing Settings:

1. **Refresh your app** (Cmd + R)
2. **Send an AI message** about maintenance
3. **Click "Set Reminder"**
4. **Wait 10 seconds**
5. **Look at top-right corner** of your screen
6. **You should see macOS notification!** 🎉

---

## 📸 What You Should See:

```
┌────────────────────────────────┐
│ 🔔  MotoMind Reminder          │
│                                │
│ Set Reminder                   │
│                                │
│              Now • MotoMind    │
└────────────────────────────────┘
```

Location: **Top-right corner of macOS screen**

---

## 🔍 Still Not Working?

Try this diagnostic:

1. Open **Terminal**
2. Run this command:
   ```bash
   log stream --predicate 'subsystem == "com.apple.notificationcenter"' --level debug
   ```
3. Keep Terminal open
4. Trigger a notification in your app
5. Watch Terminal output
6. Look for errors or "denied" messages

---

## 💡 Alternative: Use macOS Native Notifications via Service Worker

If browser notifications still don't work, we can implement a service worker approach or use AppleScript (more reliable but requires server).

Let me know if you need help with that approach!

---

## ⚡ Quick Checklist:

- [ ] Browser notification permission = "Allow"
- [ ] macOS System Settings → Notifications → Browser = ON
- [ ] Do Not Disturb / Focus = OFF
- [ ] Scheduled Summary = OFF or Browser excluded
- [ ] Show previews = "Always"
- [ ] Browser completely restarted (Cmd + Q, then reopen)
- [ ] Test notification in console works

**Once all checked, your macOS notifications will work!** ✅
