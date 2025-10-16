# 🔄 Feature Migration Workflow

**Use this checklist when migrating features to new architecture**

---

## Phase 1: Pre-Migration Analysis (AI-Powered)

**Before touching any code:**

- [ ] **Analyze migration complexity:**
  ```bash
  npm run migrate:analyze:ai <feature-name>
  ```
  
- [ ] **Predict potential issues:**
  ```bash
  npm run migrate:predict <feature-name>
  ```

- [ ] **Review AI analysis:**
  - Complexity score
  - Estimated effort
  - Key challenges
  - Dependency impact
  - Recommended approach

- [ ] **Baseline architecture health:**
  ```bash
  npm run arch:validate:ai
  ```
  - Record current health score
  - Note existing concerns
  - Will compare after migration

- [ ] **Map dependencies:**
  ```bash
  npm run windsurf:graph
  ```
  - Understand what imports this feature
  - Identify circular dependencies
  - Plan update order

---

## Phase 2: Migration Planning

- [ ] **Create migration checklist:**
  ```bash
  npm run migrate:checklist <feature-name>
  ```

- [ ] **Review generated checklist:**
  - File moves
  - Import updates
  - Type changes
  - Test updates

- [ ] **Estimate timeline:**
  - Small: 1-2 hours
  - Medium: 4-8 hours
  - Large: 1-3 days

- [ ] **Get user approval:**
  - Share AI complexity analysis
  - Discuss timeline
  - Confirm approach

---

## Phase 3: Execute Migration

- [ ] **Create feature branch:**
  ```bash
  git checkout -b migrate/<feature-name>
  ```

- [ ] **Follow AI-generated checklist step-by-step**

- [ ] **For each moved file:**
  - Update imports
  - Update exports
  - Update barrel files (index.ts)
  - Verify TypeScript types

- [ ] **Run type-check frequently:**
  ```bash
  npm run type-check
  ```
  - If errors:
    ```bash
    npm run build:errors:ai <log-file>
    ```
  - Get friendly explanations
  - Fix quickly

- [ ] **Update tests:**
  - Update import paths
  - Verify tests still pass
  - Add new tests if needed

---

## Phase 4: Validation

- [ ] **Type checking:**
  ```bash
  npm run type-check
  ```
  - Should be clean (no errors)

- [ ] **Run tests:**
  ```bash
  npm run test
  ```
  - All tests passing

- [ ] **Architecture validation:**
  ```bash
  npm run arch:validate:ai
  ```
  - Compare with baseline
  - Health score should improve (or stay same)
  - Check for new concerns

- [ ] **Manual testing:**
  - Test feature in UI
  - Verify functionality unchanged
  - Check for edge cases

---

## Phase 5: Deploy Preparation

- [ ] **Deploy risk assessment:**
  ```bash
  npm run deploy:risk:ai
  ```

- [ ] **Review risk:**
  - Should be LOW (no logic changes)
  - If MEDIUM/HIGH, investigate why
  - Address concerns before deploying

- [ ] **Commit migration:**
  ```bash
  git add .
  git commit -m "refactor: migrate <feature> to new architecture
  
  Migration Summary:
  - Moved to: features/<feature>/
  - Updated: X files
  - Complexity: [AI score]
  - Architecture health: [before] → [after]
  - Deploy risk: [LEVEL]
  
  All tests passing. No logic changes.
  "
  ```

---

## Phase 6: Post-Migration

- [ ] **Record pattern for future:**
  ```bash
  npm run windsurf:patterns record
  ```
  - What worked well
  - What was challenging
  - Time estimate accuracy
  - Lessons learned

- [ ] **Update context:**
  ```bash
  npm run windsurf:context decision \
    "Migration: <feature>" \
    "Migrated to new architecture. Complexity: [X]. Time: [Y]. Health: [before]→[after]. Learnings: [insights]" \
    "architecture" \
    "high"
  ```

- [ ] **Improve estimates for next time:**
  ```bash
  npm run migrate:improve
  ```
  - Helps AI get better at predictions

- [ ] **Update documentation:**
  - Feature README if needed
  - Architecture docs
  - Migration tracking

---

## 🎯 Success Criteria

Migration is COMPLETE when:

✅ AI complexity analysis validated approach  
✅ All files moved to correct locations  
✅ All imports updated correctly  
✅ Type checking passes (no errors)  
✅ All tests passing  
✅ Architecture health maintained or improved  
✅ Deploy risk is LOW  
✅ Manual testing confirms functionality  
✅ Pattern recorded for future migrations  

---

## 💡 Pro Tips

**Do:**
- Run AI analysis first (know what you're getting into)
- Follow the generated checklist exactly
- Validate frequently (type-check after each change)
- Use Error Parser AI when stuck
- Record patterns (get better over time)

**Don't:**
- Skip complexity analysis (surprises are bad)
- Change logic during migration (refactor separately)
- Ignore architecture warnings
- Deploy without risk assessment
- Forget to record learnings

**Remember:**
Migrations are risky. AI tools help us:
- Predict complexity accurately
- Catch issues early
- Learn from patterns
- Ship safely

---

## 🚨 Common Issues

### **Import errors after migration:**
```bash
# Use Error Parser AI
npm run build:errors:ai <log-file>

# Usually: Update barrel exports (index.ts)
# Or: Update path aliases in tsconfig.json
```

### **Circular dependencies:**
```bash
# Check dependency graph
npm run windsurf:graph

# Solution: Break cycles with event-driven patterns
```

### **Tests failing:**
```bash
# Update test imports first
# Then verify feature behavior
# Use Error Parser AI for cryptic test errors
```

### **Architecture health decreased:**
```bash
# Run validator to see why
npm run arch:validate:ai

# Address concerns before merging
```

---

## 📊 Estimated Times

**Small Feature** (1-3 files):
- Analysis: 5 minutes
- Planning: 10 minutes
- Migration: 1-2 hours
- Validation: 15 minutes
- **Total: 1.5-2.5 hours**

**Medium Feature** (4-10 files):
- Analysis: 10 minutes
- Planning: 20 minutes
- Migration: 4-8 hours
- Validation: 30 minutes
- **Total: 5-9 hours**

**Large Feature** (10+ files):
- Analysis: 15 minutes
- Planning: 30 minutes
- Migration: 1-3 days
- Validation: 1 hour
- **Total: 1-3 days**

**AI helps us estimate accurately and avoid surprises.**

---

🔄 **Migrate with confidence!**
