# .cascade Directory

This directory contains instructions specifically for AI-powered development tools like Windsurf Cascade.

## What's Here

### `instructions.md`
**Mandatory workflow for AI assistants** working on this codebase.

This file tells AI tools like Windsurf to:
1. **Analyze first** - Run `npm run windsurf:guide` before generating code
2. **Study examples** - Look at similar features in the codebase
3. **Follow patterns** - Use the same structure and conventions
4. **Validate after** - Run checks to ensure quality

### `TOOL_CHECKLIST.md` ⭐ NEW!
**Quick reference checklist** for Cascade (me!) to use before ANY work.

Contains:
- Pre-flight checklist (what to do before building)
- Tool reference table (all 13 tools with commands)
- Critical reminders (don't forget to use the tools!)
- Why it matters (10-20x productivity gains!)

## Why This Exists

AI tools are powerful but can generate code that doesn't fit your codebase:
- Deep imports instead of `@/` aliases
- Missing tests
- Different patterns than existing features
- Security issues

This directory ensures AI learns from **your** codebase before making changes.

## For AI Assistants

**Read `instructions.md` before every task!**

It contains:
- Critical rules (especially imports!)
- Available tools
- Examples of good vs bad execution
- Success criteria

## For Developers

You don't need to read these files directly. They're written for AI consumption.

Instead, read:
- `CONTRIBUTING.md` - Your developer guide
- `docs/COMPLETE-SYSTEM-OVERVIEW.md` - Full system documentation
- `.windsurf-context.md` - Generated per-task guidance (after running `windsurf:guide`)

## How It Works

```bash
# Before starting a task
npm run windsurf:guide "add notifications"

# AI reads:
# 1. .cascade/instructions.md (general rules)
# 2. .windsurf-context.md (task-specific guidance)

# Then generates code following both
```

## Future

As AI development tools evolve, this directory will be the standard place for:
- Tool configurations
- Project-specific AI instructions
- Context files

We're ahead of the curve. When tools add native support, we're ready.

---

**Built as part of the MotoMind Elite Autonomous System**
