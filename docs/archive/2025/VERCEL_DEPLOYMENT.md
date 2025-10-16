# Vercel Deployment Guide 🚀

**Date:** October 2, 2025  
**Status:** Ready to Deploy

---

## 📋 **Pre-Deployment Checklist**

- [ ] All code committed to Git
- [ ] GitHub repository created
- [ ] Environment variables documented
- [ ] Supabase database migrations applied
- [ ] Reference images uploaded to Supabase Storage
- [ ] .env.local backed up (contains secrets)

---

## 1️⃣ **Push to GitHub**

```bash
# Add all files
git add .

# Commit with descriptive message
git commit -m "Production ready: Enhanced vision system with gauge references"

# Add remote (if not already added)
git remote add origin https://github.com/joseph-ehler/moto-mind-ai.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## 2️⃣ **Deploy to Vercel**

### **Option A: Via Vercel Dashboard (Recommended)**

1. **Go to:** https://vercel.com/new
2. **Import Git Repository:**
   - Select your GitHub account
   - Choose `moto-mind-ai` repository
3. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
4. **Add Environment Variables** (see below)
5. **Deploy!**

### **Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts to link to project
```

---

## 3️⃣ **Environment Variables for Vercel**

Add these in **Vercel Dashboard → Settings → Environment Variables**:

### **🔴 Critical - Required for App to Function**

```bash
# Database
DATABASE_URL=postgresql://postgres:OGin3ykIzPCtQH6o@db.ucbbzzoimghnaoihyqbd.supabase.co:5432/postgres

# Supabase (Public - Safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://ucbbzzoimghnaoihyqbd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjYmJ6em9pbWdobmFvaWh5cWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODQyMTMsImV4cCI6MjA3NDI2MDIxM30.7kOT67ZldZigp1qqYTB6sXZcqU5ppLZohh-gGtIg84c

# Supabase (Server-side - Keep Secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjYmJ6em9pbWdobmFvaWh5cWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NDIxMywiZXhwIjoyMDc0MjYwMjEzfQ.Fq9BQHT8rQ2iNpgugdf-JdvdRYMf1vFTU1pvh88xbag

# OpenAI (for Vision AI)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# NextAuth (generate a secure secret for production)
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
```

### **🟡 Configuration - Recommended**

```bash
# Production URL (update after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Environment
NODE_ENV=production

# Feature Flags
NEW_API_ENVELOPE=true
NEXT_PUBLIC_DASHBOARD_SNAPSHOT=true

# Vision AI Features (NEW!)
VISION_USE_REFERENCE_LEGEND=true
VISION_USE_GAUGE_REFERENCES=true
```

### **🟢 Optional - Advanced Settings**

```bash
# JWT (if using custom auth)
JWT_SECRET=your-production-secret-key

# Database Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Usage Tracking
USAGE_BATCH_SIZE=10
USAGE_FLUSH_INTERVAL_MS=30000

# Mock APIs (not needed in production)
# SAMSARA_API_KEY=mock-key-not-needed
```

---

## 4️⃣ **Post-Deployment Steps**

### **1. Update NEXT_PUBLIC_APP_URL**

After first deploy, update this variable:

```bash
NEXT_PUBLIC_APP_URL=https://moto-mind-ai.vercel.app
```

Redeploy for changes to take effect.

### **2. Test Critical Flows**

- [ ] **VIN Scanning:** Upload VIN photo → Verify decode
- [ ] **Dashboard Capture:** Upload dashboard → Check extraction accuracy
- [ ] **Warning Lights:** Verify reference legend is used (check logs)
- [ ] **Gauge References:** Verify fuel/coolant accuracy improved
- [ ] **Vehicle Timeline:** Check events display correctly
- [ ] **Edit Modal:** Test editing with km/mi toggle

### **3. Check Logs**

In Vercel Dashboard → Deployments → [Latest] → Functions:

Look for:
```
📖 Using reference legend for warning light detection
📊 Using gauge references for fuel/coolant accuracy
```

### **4. Monitor Costs**

- **Vercel:** Free tier supports hobby projects
- **Supabase:** Free tier includes 500MB database + 1GB storage
- **OpenAI:** ~$0.07-0.09 per dashboard capture (with all references)

---

## 5️⃣ **Troubleshooting**

### **Build Fails**

```bash
# Common issues:
1. TypeScript errors → Run `npm run build` locally first
2. Missing dependencies → Check package.json
3. Environment variables → Verify all required vars set
```

### **Reference Images Not Loading**

```bash
# Check Supabase Storage URLs:
https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/warning-lights-legend.jpg
https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/fuel-analog.jpg
https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/fuel-digital.jpg
https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/coolant-analog.jpg
https://ucbbzzoimghnaoihyqbd.supabase.co/storage/v1/object/public/reference-images/coolant-digital.jpg

# Make sure all are publicly accessible
```

### **Database Connection Issues**

```bash
# Verify DATABASE_URL format:
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Check Supabase dashboard for correct connection string
```

### **Vision AI Not Working**

```bash
# Check:
1. OPENAI_API_KEY is valid
2. VISION_USE_REFERENCE_LEGEND=true
3. VISION_USE_GAUGE_REFERENCES=true
4. Reference images uploaded to Supabase
5. Check function logs for errors
```

---

## 6️⃣ **Domain Setup (Optional)**

### **Custom Domain**

1. **In Vercel Dashboard:**
   - Settings → Domains
   - Add your domain (e.g., `motomind.app`)
   - Follow DNS instructions

2. **Update Environment Variable:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://motomind.app
   ```

---

## 7️⃣ **Continuous Deployment**

Once connected, Vercel auto-deploys on:

- ✅ **Push to main:** Production deployment
- ✅ **Push to branch:** Preview deployment
- ✅ **Pull request:** Preview deployment with URL

**Workflow:**
```bash
# Make changes
git add .
git commit -m "Description of changes"
git push

# Vercel automatically deploys
# Check: https://vercel.com/dashboard
```

---

## 8️⃣ **Production Optimizations**

### **Next.js Config**

Already optimized in `next.config.js`:
- Image optimization enabled
- Compression enabled
- Standalone output for smaller builds

### **Database**

- ✅ Indexes on frequently queried columns
- ✅ RLS policies for security
- ✅ Connection pooling configured

### **Caching**

Vercel automatically caches:
- Static pages
- API routes with cache headers
- Images via Next.js Image component

---

## 📊 **Expected Performance**

### **Lighthouse Scores (Target)**

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 90+

### **API Response Times**

- **Dashboard Capture:** 3-5 seconds (vision processing)
- **Event List:** <500ms
- **Vehicle Details:** <300ms

---

## 🔐 **Security Checklist**

- [ ] **Environment variables** set in Vercel (not in code)
- [ ] **Service role key** marked as secret
- [ ] **OpenAI API key** marked as secret
- [ ] **Database credentials** marked as secret
- [ ] **Row Level Security (RLS)** enabled in Supabase
- [ ] **Public reference images** verified (no sensitive data)
- [ ] **CORS** configured for Supabase Storage
- [ ] **Rate limiting** considered for API routes

---

## 🎯 **Deployment Commands Summary**

```bash
# 1. Final commit
git add .
git commit -m "Production ready with vision enhancements"

# 2. Push to GitHub
git remote add origin https://github.com/joseph-ehler/moto-mind-ai.git
git branch -M main
git push -u origin main

# 3. Deploy to Vercel (via dashboard or CLI)
vercel

# 4. Add environment variables in Vercel dashboard

# 5. Test deployment
# Visit: https://moto-mind-ai.vercel.app

# 6. Monitor logs and performance
```

---

## ✅ **Launch Checklist**

### **Pre-Launch**
- [ ] All code pushed to GitHub
- [ ] Environment variables configured in Vercel
- [ ] Supabase migrations applied
- [ ] Reference images uploaded and accessible
- [ ] Local build successful (`npm run build`)
- [ ] All tests passing

### **Launch**
- [ ] Deploy to Vercel
- [ ] Verify deployment successful
- [ ] Test VIN scanning flow
- [ ] Test dashboard capture flow
- [ ] Test vehicle timeline
- [ ] Check reference images loading
- [ ] Monitor function logs

### **Post-Launch**
- [ ] Update NEXT_PUBLIC_APP_URL
- [ ] Set up custom domain (optional)
- [ ] Monitor error rates
- [ ] Monitor OpenAI costs
- [ ] Collect user feedback
- [ ] Track accuracy metrics

---

## 📚 **Resources**

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Supabase Docs:** https://supabase.com/docs
- **OpenAI API:** https://platform.openai.com/docs

---

## 🚀 **Ready to Deploy!**

Your app is production-ready with:
- ✅ Enhanced vision system with reference images
- ✅ Warning light detection with visual dictionary
- ✅ Fuel/coolant gauge recognition with examples
- ✅ Edit history tracking
- ✅ Km/mi toggle with live conversion
- ✅ Complete event timeline
- ✅ Professional UI/UX

**Just push to GitHub and connect to Vercel!** 🎉

---

## 📞 **Need Help?**

- **Vercel Support:** https://vercel.com/support
- **Deployment Issues:** Check function logs in Vercel dashboard
- **Database Issues:** Check Supabase dashboard
- **Vision AI Issues:** Verify OpenAI API key and reference images

**Good luck with your launch!** 🚀🎊
