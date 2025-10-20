# 🔥 DATABASE QUICK REFERENCE CARD

**MEMORIZE THIS - USE CONSTANTLY!**

---

## ONE COMMAND TO RULE THEM ALL
```bash
npm run db [command]
```

---

## 🚨 MOST CRITICAL (Use These Daily)

```bash
npm run db health                    # Check DB health
npm run db rls:validate              # Validate RLS (NextAuth!)
npm run db schema:inspect            # See schema
npm run db perf:metrics              # Performance
```

---

## 📊 ALL 41 COMMANDS

### Health & Query (2)
```bash
npm run db health
npm run db query <sql>
```

### Schema (5)
```bash
npm run db schema:inspect
npm run db schema:tables
npm run db schema:compare <s1> <s2>
```

### Migrations (6)
```bash
npm run db migrate:run
npm run db migrate:list
npm run db migrate:create <name>
npm run db migrate:generate <name>      # ⭐ NEW
npm run db migrate:templates            # ⭐ NEW
npm run db migrate:diff <s1> <s2>       # ⭐ NEW
```

### Backup & Restore (2)
```bash
npm run db backup <file>
npm run db restore <backup>
```

### Performance (7)
```bash
npm run db perf:metrics
npm run db perf:bottlenecks
npm run db perf:slow-queries
npm run db perf:cache-hit
npm run db perf:index-usage
npm run db perf:table-sizes
npm run db perf:vacuum-stats
```

### RLS Management (5) ⭐ CRITICAL
```bash
npm run db rls:list
npm run db rls:enable <table>
npm run db rls:disable <table>
npm run db rls:validate              # Detects auth.uid()!
npm run db rls:apply-nextauth <table> # Fix NextAuth RLS!
```

### Storage Management (5) ⭐ NEW
```bash
npm run db storage:list
npm run db storage:create <name>
npm run db storage:delete <name>
npm run db storage:stats <bucket>
npm run db storage:cleanup <bucket>
```

### Seed Management (5) ⭐ NEW
```bash
npm run db seed <file>
npm run db seed:list <directory>
npm run db seed:truncate <tables...>
npm run db seed:reset --confirm
npm run db seed:count <table>
```

### Admin Operations (5) ⭐ NEW
```bash
npm run db admin:vacuum [table]
npm run db admin:analyze [table]
npm run db admin:reindex <target>
npm run db admin:connections
npm run db admin:kill <pid>
```

---

## 🎯 COMMON WORKFLOWS

### Before Starting Any Task
```bash
npm run db health
npm run db schema:inspect
npm run db rls:list
```

### During Development
```bash
npm run db migrate:generate <name>
npm run db migrate:run --dry-run
npm run db migrate:run
```

### After Making Changes
```bash
npm run db rls:validate
npm run db perf:metrics
npm run windsurf:validate
```

### Debugging Issues
```bash
npm run db health
npm run db perf:slow-queries
npm run db admin:connections
npm run db rls:validate
```

---

## 🚨 CRITICAL RULES

1. **ALWAYS validate RLS:** `npm run db rls:validate`
2. **ALWAYS dry-run first:** `npm run db migrate:run --dry-run`
3. **NEVER use old commands:** Use `npm run db` not `npm run db:*`
4. **CHECK health first:** `npm run db health`

---

## 💡 REMEMBER

- **Help anytime:** `npm run db help`
- **41 commands total**
- **One unified interface**
- **Type-safe operations**
- **Built-in safety checks**

---

## 🔥 THE POWER TRIO

```bash
npm run db health           # Is DB okay?
npm run db rls:validate     # Are RLS policies safe?
npm run db perf:metrics     # Is DB performing well?
```

**Run these three before any major work!**

---

**THIS IS NOW PART OF YOUR CORE KNOWLEDGE!** 🧠

Use these commands constantly. They're production-ready, type-safe, and battle-tested.

**Remember:** `npm run db help` is always there if you forget! 💪
