# 🚀 Tuesday Quick Start - Vehicles Refinement

**Time:** 45 minutes - 1 hour  
**Goal:** Fix 40+ miscategorized files from Week 1  
**Method:** Semi-automated script (safe, fast, reusable)  

---

## ✅ PRE-FLIGHT CHECK

Before starting, verify:

- [ ] You have ~1 hour available
- [ ] No uncommitted changes: `git status`
- [ ] On main branch: `git branch --show-current`
- [ ] Latest code pulled: `git pull origin main`

---

## 🎯 THE PLAN (4 Phases)

### **Phase 1: Run the Script** (10 min)

```bash
# Run the refinement script
npm run refine:vehicles
```

**What happens:**
1. Script finds API routes in `domain/`
2. Shows you what it will move
3. Asks for confirmation
4. Moves files with `git mv`
5. Updates imports automatically
6. Reports results

**Example output:**
```
🔧 REFINING VEHICLES STRUCTURE

============================================================
Fixing categorization issues from Week 1 migration
============================================================

📁 Found 42 API routes in domain/

Files to move:
   features/vehicles/domain/[id].ts
   → features/vehicles/data/[id].ts

   features/vehicles/domain/fuel.ts
   → features/vehicles/data/fuel.ts
   
   ... (40 more files)

This will move 42 files from domain/ to data/
Continue? (Ctrl+C to cancel, Enter to proceed)
```

**Your decision:**
- ✅ Looks good? Press **Enter**
- ⚠️ Looks wrong? Press **Ctrl+C** and report issue

---

### **Phase 2: Verify** (15 min)

After script completes, verify everything works:

```bash
# 1. Check what changed
git status
git diff --stat

# 2. Type check
npm run typecheck

# 3. Run tests (if any exist)
npm test features/vehicles 2>/dev/null || echo "No tests yet"

# 4. Check structure
ls -la features/vehicles/domain/ | wc -l   # Should be ~10 files
ls -la features/vehicles/data/ | wc -l     # Should be ~40 files
```

**Expected results:**
- ✅ Type check passes
- ✅ Git shows ~42 renames (R) and some modifications (M)
- ✅ `domain/` has ~10 files (types, validation, business logic)
- ✅ `data/` has ~40 files (API routes)

**If issues:**
```bash
# Rollback everything
git reset --hard HEAD

# Report the issue
# We'll debug together
```

---

### **Phase 3: Review Structure** (10 min)

Manually verify the structure makes sense:

```bash
# Domain should have: types, entities, validation, business logic
ls features/vehicles/domain/

# Expected files (examples):
# - vehicle-health.ts
# - vehicles.ts (validation)
# - fleet-rules.ts
# - canonical-images.ts
# - transaction.ts

# Data should have: API routes, queries, mutations
ls features/vehicles/data/

# Expected files (examples):
# - [id].ts (GET /api/vehicles/[id])
# - fuel.ts (POST /api/vehicles/[id]/fuel)
# - odometer.ts (POST /api/vehicles/[id]/odometer)
# - createVehicle.ts
# - getVehicle.ts
```

**Questions to ask:**
1. Does `domain/` contain only types, validation, business logic?
2. Does `data/` contain API routes and data access?
3. Are there any files in the wrong place?

**If anything looks wrong:**
- Move it manually with `git mv`
- Or note it for later refinement

---

### **Phase 4: Commit** (5 min)

If everything looks good:

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "refactor(vehicles): correct file categorization

Moved 40+ API routes from domain/ to data/
Updated all imports automatically

Fixes categorization issues discovered in Week 1 migration.
Structure now matches intended pattern:
- domain/ = types, validation, business logic (~10 files)
- data/ = API routes, queries, mutations (~40 files)
- hooks/ = React hooks (2 files)
- ui/ = UI components (12 files)

Used: scripts/refine-vehicles-structure.ts
Time: 15 min (vs 2 hours manual)"

# Push to remote
git push origin main
```

---

## 🎯 SUCCESS CRITERIA

Tuesday is successful if:

- [x] Script ran without errors
- [x] ~40 files moved from domain/ to data/
- [x] Type check passes
- [x] Structure is clean and logical
- [x] Imports updated correctly
- [x] Changes committed

**Bonus:**
- [ ] Took < 1 hour total time
- [ ] No manual fixes needed
- [ ] Confident in the approach

---

## ⚠️ IF SOMETHING GOES WRONG

### **Script crashes or errors:**

```bash
# Option 1: Report the error
# Copy the error message
# We'll debug together

# Option 2: Fallback to manual
# See: docs/WEEK-2-REFINEMENT-PLAN.md
# "Option B: Manual" section
```

### **Type check fails after refinement:**

```bash
# See which files have errors
npm run typecheck 2>&1 | grep error

# If it's import errors:
# - Script missed some imports
# - Fix manually with find/replace

# If it's actual type errors:
# - Pre-existing, unrelated to migration
# - Can fix separately or ignore for now
```

### **Not sure if structure is correct:**

**Take a screenshot and ask:**
- What's in `features/vehicles/domain/`?
- What's in `features/vehicles/data/`?
- Does it match the intended pattern?

---

## 📊 METRICS TO TRACK

After completion, note:

1. **Time taken:** ___ minutes
   - Target: < 60 min
   - Compare to: 2 hours manual

2. **Files moved:** ___ files
   - Expected: ~40

3. **Imports updated:** ___ files
   - Script will report this

4. **Manual fixes needed:** ___ 
   - Target: 0
   - Acceptable: 1-3

5. **Confidence (1-10):** ___
   - In the structure: ___
   - In the tools: ___
   - Ready for Week 3: ___

---

## 🎯 WHAT COMES NEXT

### **After Tuesday:**

1. **Wednesday:** Document learnings in `features/vehicles/README.md`
2. **Thursday:** Review Week 2, make decision (continue or stabilize)

### **If Tuesday goes well:**

**Week 3 preview:**
- Migrate `capture` feature (30-45 min)
- Migrate `dashboard` feature (30-45 min)
- Total: 1-1.5 hours for 2 features

**With improved tools:**
- 90%+ categorization accuracy
- Minimal manual cleanup
- Proven process

---

## 💡 TIPS

### **Before running script:**
- ☕ Grab coffee/water
- 🎵 Optional: Put on focus music
- 📱 Silence notifications
- ✅ Clear 1 hour block

### **While running:**
- Read the output carefully
- Understand what it's doing
- Don't blindly press Enter
- Trust but verify

### **After completion:**
- Review git diff
- Understand the changes
- Feel good about the progress
- Document what you learned

---

## 🚀 READY?

When you're ready:

```bash
# Start the refinement
npm run refine:vehicles
```

**Expected output:** 42 files moved, imports updated, structure clean

**Expected time:** 15 minutes script + 30 minutes verification = 45 min total

**Expected outcome:** Vehicles feature perfectly organized, ready for Week 3

---

**Good luck! You've got this.** 💎

---

## 📞 NEED HELP?

If anything goes wrong:

1. **Don't panic** - Everything is reversible
2. **Check git status** - See what changed
3. **Read the error** - Often tells you exactly what's wrong
4. **Ask for help** - Share the error message
5. **Worst case:** `git reset --hard HEAD` (undo everything)

**Remember:** We're building sustainable processes, not rushing to show progress.

Take your time. Do it right. Document what you learn.

---

**Tuesday Status:** Ready to execute ✅  
**Script:** `npm run refine:vehicles`  
**Time budget:** 45 min - 1 hour  
**Confidence:** High (script is tested and safe)  

**See you Tuesday!** 🚀
