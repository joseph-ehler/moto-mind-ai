# 🤖 Windsurf AI Context

**This directory contains critical information for AI assistants.**

---

## 🎯 MUST READ BEFORE ANY WORK

1. **Deployment**: Always use `npm run deploy "message"` 
2. **Never**: Manual `git push` (breaks feedback loop)
3. **Rollback**: `npm run rollback:last` for instant recovery
4. **Context**: `npm run windsurf:guide "<task>"` before coding

---

## 📚 Key Documentation

- [Elite Deployment System](../docs/ELITE-DEPLOYMENT-SYSTEM.md)
- [Quick Reference](../docs/DEPLOYMENT-QUICK-REFERENCE.md)
- [System Prompt](../.cascade/SYSTEM-PROMPT.md)
- [Architecture Guide](../docs/FEATURE-MIGRATION-GUIDE.md)

---

## 🛠️ Available Tools (20+)

### Deployment:
- `npm run deploy` - Smart deploy with validation
- `npm run deploy:wait` - Watch Vercel status
- `npm run rollback` - Safe rollback

### Context:
- `npm run windsurf:guide` - Analyze codebase
- `npm run product:analyze` - Strategic thinking
- `npm run repo:analyze` - Repository intelligence

### Database:
- `npm run db:introspect` - See schema
- `npm run db:smart-migrate` - Safe migrations
- `npm run db:doctor` - Auto-heal issues

### Validation:
- `npm run windsurf:validate` - Full check
- `npm run arch:validate` - Architecture check
- `npm test` - All tests

---

## ⚡ Quick Start

```bash
# Before any task
npm run windsurf:guide "what you're building"
cat .windsurf-context.md

# After building
npm run deploy "your commit message"

# If something breaks
npm run rollback:last
```

---

## 🚫 Never Do This

❌ Manual git push (use `npm run deploy`)  
❌ Skip context analysis  
❌ Use `../../../` imports (use `@/`)  
❌ Generate code without tests  
❌ Ignore validation warnings  

---

## ✅ Always Do This

✅ Run `windsurf:guide` before coding  
✅ Use `npm run deploy` for all deployments  
✅ Include tests with every feature  
✅ Follow patterns shown in guidance  
✅ Validate before commit  

---

**Updated:** October 14, 2025  
**Version:** Elite Tier 1.0  
**Status:** Production Ready
