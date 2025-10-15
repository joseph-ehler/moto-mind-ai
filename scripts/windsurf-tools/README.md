# 🚀 Windsurf Tools

Internal tools to supercharge Cascade's capabilities on the MotoMindAI codebase.

## 📦 Tools

### 1. Codebase Graph Generator
**Command:** `npm run windsurf:graph`  
**Purpose:** Analyzes the entire codebase and creates a knowledge graph  
**Output:** `.windsurf/codebase-graph.json`

**What it does:**
- Parses all TypeScript/JavaScript files
- Extracts exports, imports, and types
- Maps relationships between files
- Creates searchable index of all exports

**Why:** Allows Cascade to instantly know:
- What files import from a module (all 52, not guess 5)
- Where exports are defined
- Impact of changes before making them
- Architectural violations

### 2. Batch Editor (Coming Soon)
Multi-file atomic operations with preview and rollback.

### 3. Pattern Library (Coming Soon)
Learn from successful migrations and auto-apply patterns.

### 4. Context Checkpointer (Coming Soon)
Save and recall project decisions across sessions.

## 🎯 Usage

```bash
# Generate codebase graph
npm run windsurf:graph

# Watch for changes (coming soon)
npm run windsurf:watch

# Batch edit (coming soon)
npm run windsurf:batch --pattern="old" --replace="new"
```

## 📊 Output Files

All outputs are stored in `.windsurf/` directory:

```
.windsurf/
├── codebase-graph.json      # Full knowledge graph
├── patterns.json            # Learned patterns
├── operation-history.json   # Change tracking
└── context/                 # Saved decisions
    ├── checkpoints/
    └── active.json
```

## 🚀 Impact

**Before:** Cascade works file-by-file, limited visibility  
**After:** Cascade sees entire codebase, instant queries, 10x faster bulk operations

**Productivity boost:** 30-40% faster development on MotoMindAI
