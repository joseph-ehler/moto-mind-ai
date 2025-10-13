# 🗺️ Mapbox Setup Guide

**Required for:** Address autocomplete in inline editing

---

## Quick Setup (5 minutes)

### **1. Get Free Mapbox Token**

**Visit:** https://account.mapbox.com/

1. **Sign up** (free account)
2. Go to **Access Tokens**
3. Click **Create a token**
4. Name it: `MotoMind Development`
5. **Copy** the token (starts with `pk.`)

**Free tier:** 100,000 requests/month (more than enough!)

---

### **2. Add Token to Environment**

**Open:** `.env.local` (create if doesn't exist)

**Add this line:**
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token_here
```

**Example:**
```env
# Other environment variables...

# Mapbox (for address autocomplete)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibXlhY2NvdW50IiwiYSI6ImNtMXh5ejEyMzAwMXoycXB6ZGY3OGVycHEifQ.AbCdEfGhIjKlMnOpQrStUv
```

---

### **3. Restart Dev Server**

```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

---

### **4. Test It**

1. Navigate to any event
2. Click edit on "Address" field (if available)
3. Start typing an address
4. Autocomplete suggestions should appear! 🎉

---

## Troubleshooting

### **"Address autocomplete not working"**

**Check:**
1. Token added to `.env.local`
2. Token starts with `pk.`
3. Dev server restarted
4. Browser console for errors

**Fallback:** If no token, shows regular text input (still works, just no autocomplete)

### **"Invalid token" error**

**Solution:**
1. Go back to Mapbox dashboard
2. Check token is active
3. Create new token if needed
4. Update `.env.local`
5. Restart server

---

## Token Security

✅ **Safe to use:** 
- `NEXT_PUBLIC_MAPBOX_TOKEN` is a **public** token
- Designed to be used in browser
- Rate-limited by domain

❌ **Never share:**
- Secret tokens
- Access tokens with write permissions

✅ **Best practices:**
- Restrict token to your domain in production
- Monitor usage in Mapbox dashboard
- Use separate tokens for dev/prod

---

## Optional: Restrict Token

**Production only:**

1. Go to Mapbox dashboard
2. Select your token
3. Under **Token restrictions**:
   - Add your production domain: `yourdomain.com`
   - Add localhost: `localhost:3005` (for dev)
4. Save changes

This prevents token abuse if leaked.

---

## Cost & Limits

**Free tier:**
- 100,000 requests/month
- More than enough for small-medium apps

**Example usage:**
- 10 address edits/day = 300/month
- 100 address edits/day = 3,000/month
- Still well under limit!

**If you exceed:**
- First 100k: Free
- Next 100k: $0.75
- Very affordable!

---

## Alternative: No Mapbox

**If you don't want to set up Mapbox:**

The address field will automatically fall back to a regular text input. It still works fine, just without autocomplete suggestions.

No errors, no problems! Just less convenient for users.

---

## ✅ Setup Complete!

Once you see autocomplete suggestions, you're all set! 🎉

**Enjoy beautiful address autocomplete powered by Mapbox!** 🗺️
