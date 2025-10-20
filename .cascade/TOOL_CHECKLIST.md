# 🎯 CASCADE PRE-FLIGHT CHECKLIST

**Cascade (me!) should reference this file before ANY work!**

---

## ⚡ IMMEDIATE CHECKLIST

### **Before Building ANY Feature:**
```
□ Run: npm run windsurf:guide "build [feature]"
□ Read: .windsurf-context.md (if it exists)
□ Check: npm run db health (if DB involved)
□ Check: npm run db schema:inspect (if DB changes)
□ Follow the patterns in that file
□ Suggest validation after building
```

### **After Making Changes:**
```
□ Suggest: npm run ai-platform:enforce -- --check-staged
□ Suggest: npm run ai-platform:guardian -- --check
□ Suggest: npm run db rls:validate (if DB changes)
□ Suggest: npm run db perf:metrics (if DB changes)
□ Suggest: npm run ai-platform:quality (if major changes)
□ Remind: Pre-commit hook will validate automatically
```

### **Weekly Maintenance:**
```
□ Suggest: npm run windsurf:graph (refresh knowledge)
□ Suggest: npm run ai-platform:quality (track trends)
□ Suggest: npm run db health (database health)
□ Suggest: npm run db perf:metrics (database performance)
```

---

## 📋 TOOL REFERENCE (Quick Access)

| Tool | Command | When to Use |
|------|---------|-------------|
| **Context Generator** | `npm run windsurf:guide "task"` | BEFORE any feature work |
| **Codebase Graph** | `npm run windsurf:graph` | Weekly or before big changes |
| **Pattern Enforcer** | `npm run ai-platform:enforce -- --check` | After code changes |
| **Dependency Guardian** | `npm run ai-platform:guardian -- --check` | After adding imports |
| **Quality Monitor** | `npm run ai-platform:quality` | Weekly or after changes |
| **Architecture Validator** | `npm run arch:validate` | After creating features |
| **Feature Migration** | `npm run migrate:ai [feature]` | When migrating features |
| **Repo Analyzer** | `npm run repo:analyze` | Check feature completeness |
| **DB Health** | `npm run db health` | Before DB work or when issues |
| **DB RLS Validate** | `npm run db rls:validate` | After DB changes (CRITICAL!) |
| **DB Performance** | `npm run db perf:metrics` | Weekly or when slow |
| **Record Decision** | `npm run windsurf:context decision` | After important decisions |
| **Batch Operations** | `npm run windsurf:batch replace` | Multi-file changes |

---

## 🚨 CRITICAL REMINDERS FOR CASCADE

**I (Cascade) MUST:**

1. **Always check** if `.windsurf-context.md` exists before generating code
2. **Always suggest** running `windsurf:guide` before building features
3. **Always remind** user about validation tools after changes
4. **Never forget** these tools exist - they're part of the god-tier system!
5. **Always read** this checklist at the start of work sessions

**These tools make me 10-20x more effective!**

Don't let the user build without context!
Don't let bad code enter the codebase!
Use the tools we built!

---

## 💡 WHY THIS MATTERS

**Without these tools:**
- ❌ I generate code without context
- ❌ Violations enter the codebase
- ❌ Quality degrades over time
- ❌ We waste time fixing preventable issues

**With these tools:**
- ✅ I have perfect context
- ✅ Violations are blocked
- ✅ Quality is tracked
- ✅ Development is 10-20x faster

**The tools exist. I MUST use them!**

---

*Last Updated: October 19, 2025*
*Version: 2.0 - God-Tier System + Database Toolkit*

**NEW: See `.cascade/DB_QUICK_REF.md` for all 41 database commands!**
