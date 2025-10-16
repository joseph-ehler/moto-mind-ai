# 🚀 Elite Deployment System - Quick Reference

**One-page cheat sheet for the elite deployment infrastructure.**

---

## 📋 COMMON COMMANDS

### Deploy

```bash
# Standard deploy (recommended)
npm run deploy "feat: your message"

# Fast deploy (skip checks - emergency only)
npm run deploy:fast "fix: urgent"

# Deploy without waiting (continue working)
npm run deploy:no-wait "wip: in progress"
```

### Rollback

```bash
# Interactive rollback (shows options)
npm run rollback

# Quick rollback to last commit
npm run rollback:last

# Rollback to specific commit
npm run rollback -- --to abc123

# Restore from backup branch
npm run rollback -- --branch backup-name
```

### Verify

```bash
# Check deployment status
npm run deploy:wait

# Type check
npm run type-check

# Build
npm run build
```

---

## 🔄 WORKFLOWS

### Standard Deploy

```bash
# 1. Make changes
vim file.ts

# 2. Deploy (all-in-one)
npm run deploy "feat: description"

# ✅ Automatic: type check + build + push + verify
```

### Emergency Fix

```bash
# 1. Make fix
vim critical-file.ts

# 2. Fast deploy
npm run deploy:fast "fix: critical issue"

# 3. If broken, instant rollback
npm run rollback:last
```

### Check Status

```bash
# After any git push
npm run deploy:wait

# Shows real-time Vercel deployment status
# Exits with code 0 (success) or 1 (failure)
```

---

## 🛡️ SAFETY FEATURES

### Automatic Backups

Every deploy creates: `backup-before-deploy-<timestamp>`

```bash
# List backups
git branch | grep backup-

# Restore from backup
git reset --hard backup-before-deploy-12345

# Cleanup old backups
git branch -D backup-before-deploy-12345
```

### Pre-Deploy Validation

Automatically runs:
1. ✅ Type check (`npm run type-check`)
2. ✅ Build (`npm run build`)
3. ✅ Vercel deployment
4. ✅ Health check

Can skip with `--skip-build` or `--fast` flags.

### Import Validation

Migration tools validate imports were updated:
- Expected: >0 updates when files moved
- Actual: 0 updates = 🚨 ERROR + rollback

---

## 🐛 COMMON ISSUES

### Type Check Failed

```bash
# See errors
npm run type-check

# Fix and retry
npm run deploy "fix: types"
```

### Build Failed

```bash
# See errors locally
npm run build

# Common: import errors, missing deps
```

### Vercel Timeout

```bash
# Increase timeout
npm run deploy:wait -- --timeout 600

# Or check dashboard
https://vercel.com/dashboard
```

### Rollback Needed

```bash
# Immediate rollback
npm run rollback:last

# Verify
git log --oneline -3

# Force push if needed
git push --force origin main
```

---

## 📊 FLAGS & OPTIONS

### Deploy Flags

- `--skip-build` - Skip build (faster, less safe)
- `--skip-types` - Skip type check
- `--fast` - Skip all checks
- `--no-wait` - Don't wait for Vercel
- `--verbose` - Show detailed output

### Rollback Flags

- `--last` - Rollback last commit
- `--to <hash>` - Rollback to specific commit
- `--branch <name>` - Restore from backup
- `--force` - Skip confirmation

### Wait Flags

- `--timeout <seconds>` - Custom timeout (default 300)
- `--verbose` - Show detailed output

---

## 🎯 BEST PRACTICES

### 1. Always Use Full Deploy

```bash
# ✅ Good (safe)
npm run deploy "feat: new feature"

# ❌ Avoid (unsafe)
git add -A && git commit -m "..." && git push
```

### 2. Test Locally First

```bash
# Before deploying
npm run dev        # Test functionality
npm run type-check # Check types
npm run build      # Verify build
```

### 3. Keep Commits Small

```bash
# ✅ Good - small, focused
npm run deploy "feat: add button"
npm run deploy "fix: button styling"

# ❌ Avoid - large, mixed
npm run deploy "feat: entire feature + fixes + refactor"
```

### 4. Use Descriptive Messages

```bash
# ✅ Good
npm run deploy "feat(dashboard): add vehicle count widget"
npm run deploy "fix(api): handle null vehicle response"

# ❌ Avoid
npm run deploy "updates"
npm run deploy "wip"
```

### 5. Rollback Immediately

```bash
# If deployment fails or breaks something
npm run rollback:last

# Don't try to "fix forward" under pressure
# Rollback first, then fix properly
```

---

## 🚨 EMERGENCY PROCEDURES

### Production is Down

```bash
# 1. Immediate rollback
npm run rollback:last

# 2. Verify rollback worked
curl https://your-site.vercel.app

# 3. Force push if needed
git push --force origin main

# 4. Investigate issue locally
npm run dev
```

### Deploy Stuck

```bash
# 1. Check Vercel dashboard
https://vercel.com/dashboard

# 2. Cancel deployment (if needed)
vercel inspect <deployment-id> --cancel

# 3. Rollback commit
npm run rollback:last

# 4. Try again
npm run deploy "retry: ..."
```

### Can't Rollback

```bash
# 1. Check reflog
git reflog

# 2. Find working commit
git log --oneline -20

# 3. Hard reset
git reset --hard <good-commit>

# 4. Force push
git push --force origin main
```

---

## 📚 DETAILED DOCS

- **Full Guide:** [docs/ELITE-DEPLOYMENT-SYSTEM.md](./ELITE-DEPLOYMENT-SYSTEM.md)
- **Implementation:** [docs/ELITE-TIER-IMPLEMENTATION-COMPLETE.md](./ELITE-TIER-IMPLEMENTATION-COMPLETE.md)
- **Week 2 Results:** [docs/WEEK-2-TUESDAY-COMPLETE.md](./WEEK-2-TUESDAY-COMPLETE.md)

---

## 🎯 QUICK START

**First time using the system:**

```bash
# 1. Make sure Vercel CLI is installed
vercel --version || npm install -g vercel

# 2. Login and link project
vercel login
vercel link

# 3. Test with a small change
echo "# Test" >> README.md
npm run deploy "test: verify elite system works"

# 4. Verify it worked
npm run deploy:wait

# 5. Celebrate! 🎉
```

---

## 💡 TIPS

- Use `deploy:fast` only for emergencies
- Always run local build before deploying large changes
- Keep backup branches for a few days, then cleanup
- Rollback first, fix later (don't rush fixes under pressure)
- Use `--verbose` flags when debugging issues
- Check Vercel dashboard for detailed build logs

---

## 🏆 YOU'RE READY

With these tools, you can:
- ✅ Deploy confidently
- ✅ Rollback instantly
- ✅ Catch errors early
- ✅ Scale safely

**Welcome to elite-tier infrastructure.** 🚀
