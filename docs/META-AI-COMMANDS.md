# 🤖 Meta-AI Command Reference

Quick reference for all meta-AI commands.

---

## 🚀 **Main Commands**

### **Start Migration (Template Mode)**
```bash
npm run migrate <feature>
```
Fast, free, proven. Uses template-based analysis.

### **Start Migration (AI Mode)**
```bash
npm run migrate:ai <feature>
```
Smart, adaptive, ~$0.01 cost. Uses AI analysis and predictions.

### **Complete Migration**
```bash
npm run migrate:complete
```
Analyzes results, saves to history, triggers learning (if 3+ migrations).

---

## 🔍 **Analysis Commands**

### **Template Analysis**
```bash
npm run migrate:analyze <feature>
```
Counts files, measures depth, assigns complexity. Free.

### **AI Analysis**
```bash
npm run migrate:analyze:ai <feature>
```
Reads code, detects issues, provides recommendations. ~$0.005.

### **Predict Issues**
```bash
npm run migrate:predict <feature>
```
Predicts problems based on history + AI. ~$0.003.

---

## 📋 **Checklist Commands**

### **Template Checklist**
```bash
npm run migrate:checklist <feature>
```
Generic checklist based on complexity. Free.

### **AI Checklist**
```bash
npm run migrate:checklist:ai <feature>
```
Custom checklist adapted to YOUR code. Uses AI analysis + predictions.

---

## 🧠 **Learning Commands**

### **Pattern Detection**
```bash
npm run migrate:patterns
```
Finds patterns in migration history. Needs 3+ migrations.

### **Improve Estimates**
```bash
npm run migrate:improve
```
Calculates better estimates from data. Needs 3+ per complexity.

### **Full Learning Cycle**
```bash
npm run migrate:learn
```
Runs both pattern detection and estimate improvement.

---

## 📊 **Typical Workflows**

### **First Migration (Learning Mode)**
```bash
# 1. Start
npm run migrate auth

# 2. Work through checklist
git commit -m "test: add auth tests (Phase 1)"
git commit -m "feat: migrate auth components (Phase 2)"
git commit -m "feat: migrate auth domain (Phase 3)"

# 3. Complete
npm run migrate:complete
```

### **AI-Enhanced Migration (After 1+ examples)**
```bash
# 1. Start with AI
npm run migrate:ai chat

# 2. Review AI-generated checklist
code docs/CHAT-MIGRATION-CHECKLIST-AI.md

# 3. Follow checklist (AI warns about YOUR specific issues)

# 4. Complete
npm run migrate:complete
# → Auto-runs pattern detection if 3+ migrations
```

### **Batch Learning (After 5+ migrations)**
```bash
# 1. Run learning cycle
npm run migrate:learn

# 2. Review output

# 3. Apply suggested changes to analyzer

# 4. Next migrations use improved estimates
```

---

## ⚡ **Quick Tips**

- **Use `--ai` flag** for single-command AI mode
- **Pattern detection** auto-runs after migrate:complete (3+ migrations)
- **All AI tools** gracefully fall back to templates if they fail
- **Template mode** is always available and always free
- **Learning tools** work with any amount of data (better with more)

---

## 📈 **Command Costs**

| Command | Cost | Speed |
|---------|------|-------|
| `migrate` | Free | Fast |
| `migrate:ai` | ~$0.01 | Medium |
| `migrate:analyze` | Free | Fast |
| `migrate:analyze:ai` | ~$0.005 | Medium |
| `migrate:predict` | ~$0.003 | Medium |
| `migrate:checklist` | Free | Fast |
| `migrate:checklist:ai` | ~$0.002 | Fast |
| `migrate:complete` | Free | Fast |
| `migrate:learn` | Free | Fast |

**Total AI migration:** ~$0.01  
**10 AI migrations:** ~$0.10  
**Template migrations:** $0.00

---

## 🎯 **When to Use What**

### **Use Template Mode When:**
- First time migrating
- Learning the pattern
- Want it fast and free
- No API key available

### **Use AI Mode When:**
- Have 1+ example migrations
- Want to catch hidden issues
- Feature seems complex
- Have API key

### **Run Learning When:**
- Have 3+ migrations total
- Estimates seem off
- Want to improve accuracy
- Curious about patterns

---

## 💡 **Pro Moves**

```bash
# Analyze without starting migration
npm run migrate:analyze vision
npm run migrate:analyze:ai vision

# Generate checklist without starting
npm run migrate:checklist vision
npm run migrate:checklist:ai vision

# Learn from history anytime
npm run migrate:learn

# Check pattern detection only
npm run migrate:patterns

# Check estimate improvements only
npm run migrate:improve
```

---

**Keep this file handy!** 📌
