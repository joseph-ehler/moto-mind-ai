# 🛠️ Available Tools

**Quick reference for all elite-tier tools in this project.**

---

## 🚀 Deployment (Use These Instead of Git)

```bash
npm run deploy "message"         # Full pipeline: validate → commit → push → verify
npm run deploy:fast "message"    # Emergency (skip checks)
npm run deploy:wait              # Watch Vercel status after manual push
npm run rollback                 # Interactive rollback
npm run rollback:last            # Instant rollback to last commit
```

**Why? These tools:**
- ✅ Validate before deploying (prevents broken production)
- ✅ Show deployment status in terminal (AI can see it)
- ✅ Verify production health automatically
- ✅ Enable one-command rollback (<1 minute recovery)

**Never:** `git push origin main` directly (breaks feedback loop)

---

## 🧠 AI Context (Use Before Coding)

```bash
npm run windsurf:guide "<task>"      # MANDATORY before any code generation
npm run product:analyze "<feature>"  # Strategic product thinking
npm run repo:analyze                 # Repository intelligence
```

**Output:** `.windsurf-context.md` - Read this before coding!

---

## 🗄️ Database

```bash
npm run db:introspect           # See complete schema
npm run db:generate-migration   # Create migration
npm run db:smart-migrate        # Apply with safety checks
npm run db:doctor               # Auto-heal issues
```

---

## ✅ Validation

```bash
npm run windsurf:validate       # Full validation suite
npm run arch:validate           # Architecture compliance
npm run type-check              # TypeScript types
npm test                        # All tests
```

---

## 📚 Documentation

- **[Elite Deployment System](./docs/ELITE-DEPLOYMENT-SYSTEM.md)** - Complete guide
- **[Quick Reference](./docs/DEPLOYMENT-QUICK-REFERENCE.md)** - Cheat sheet
- **[Architecture Guide](./docs/FEATURE-MIGRATION-GUIDE.md)** - Patterns
- **[AI System Prompt](./.cascade/SYSTEM-PROMPT.md)** - AI guidance

---

## 🤖 For AI Assistants

**Read [.windsurf/README.md](./.windsurf/README.md) at the start of every session.**

This ensures:
- ✅ Awareness of all available tools
- ✅ Correct deployment workflow
- ✅ No breaking of feedback loops
- ✅ Consistent elite-tier execution
