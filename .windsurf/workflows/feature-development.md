# 🚀 Feature Development Workflow

**Use this checklist for every new feature**

---

## Phase 1: Strategic Analysis (AI-Powered)

**Before writing any code:**

- [ ] **Run Product Intelligence AI**
  ```bash
  npm run product:analyze:ai "<feature description>"
  ```
  
- [ ] **Review AI Analysis:**
  - What user REALLY needs (vs what they asked)
  - Critical questions to answer
  - Alternative approaches
  - AI recommendation (with confidence %)
  - Success metrics
  - Risk assessment

- [ ] **Discuss with user:**
  - Share AI insights
  - Answer critical questions
  - Choose approach
  - Get approval to proceed

- [ ] **Save decision to context:**
  ```bash
  npm run windsurf:context decision \
    "Feature: [NAME]" \
    "AI recommended [APPROACH] with [X]% confidence. [KEY_INSIGHTS]" \
    "product" \
    "high"
  ```

---

## Phase 2: Planning

- [ ] **Create feature structure:**
  - Domain logic (pure functions)
  - Data layer (API calls, DB)
  - UI components
  - Hooks/utilities

- [ ] **Plan implementation:**
  - Break into small tasks
  - Identify dependencies
  - Estimate timeline

- [ ] **Check architecture before starting:**
  ```bash
  npm run arch:validate:ai
  ```
  - Baseline health score
  - Note any concerns

---

## Phase 3: Implementation

- [ ] **Build feature:**
  - Follow feature-first architecture
  - Write clean, testable code
  - Use TypeScript strictly

- [ ] **Handle errors gracefully:**
  - If build fails:
    ```bash
    npm run build:errors:ai <log-file>
    ```
  - Get friendly explanations
  - Apply fixes quickly

- [ ] **Test thoroughly:**
  - Unit tests for domain logic
  - Integration tests for data layer
  - Manual testing in UI

---

## Phase 4: Quality Validation

- [ ] **Architecture health check:**
  ```bash
  npm run arch:validate:ai
  ```
  - Compare with baseline
  - Address any new concerns
  - Ensure health didn't degrade

- [ ] **Type checking:**
  ```bash
  npm run type-check
  ```

- [ ] **Linting:**
  ```bash
  npm run lint
  ```

---

## Phase 5: Deploy Preparation

- [ ] **Deploy risk assessment:**
  ```bash
  npm run deploy:risk:ai
  ```
  
- [ ] **Review risk report:**
  - Risk score and level
  - Specific risk factors
  - Deployment strategy
  - Monitoring checklist

- [ ] **Based on risk level:**
  - **LOW:** Safe to deploy normally
  - **MEDIUM:** Gradual rollout, monitor closely
  - **HIGH:** Discuss concerns, deploy with caution

- [ ] **Commit with descriptive message:**
  ```bash
  git add .
  git commit -m "feat: [feature] - [description]
  
  - [What it does]
  - [Why we built it]
  - [Key decisions made]
  
  AI Analysis:
  - Recommended approach: [APPROACH]
  - Confidence: [X]%
  - Deploy Risk: [LEVEL]
  "
  ```

---

## Phase 6: Deploy & Monitor

- [ ] **Deploy to staging first** (if available)

- [ ] **Deploy to production:**
  - Follow recommended deployment strategy
  - Monitor metrics from AI checklist

- [ ] **Watch for issues:**
  - Error rates
  - Response times
  - User adoption
  - Performance metrics

- [ ] **If issues arise:**
  - Have rollback plan ready
  - Run diagnostics
  - Fix quickly

---

## Phase 7: Post-Deploy Validation

- [ ] **Measure success metrics** (from AI analysis):
  - Track adoption rate
  - Monitor engagement
  - Validate assumptions

- [ ] **Database health check** (if feature touches DB):
  ```bash
  npm run db:doctor:ai
  ```

- [ ] **Save learnings to context:**
  ```bash
  npm run windsurf:context decision \
    "Feature [NAME] Results" \
    "Shipped successfully. [METRICS]. Learnings: [INSIGHTS]" \
    "product" \
    "medium"
  ```

---

## 🎯 Success Criteria

Feature is COMPLETE when:

✅ AI strategic analysis validated the approach  
✅ Code is clean, tested, and type-safe  
✅ Architecture health maintained or improved  
✅ Deploy risk assessed and mitigated  
✅ Successfully deployed to production  
✅ Success metrics being tracked  
✅ Learnings documented for future  

---

## 💡 Pro Tips

**Always:**
- Start with AI analysis (saves time later)
- Run arch validator before AND after
- Assess deploy risk (prevent incidents)
- Save decisions to context (build memory)

**Never:**
- Skip AI analysis (it's 30 seconds!)
- Deploy without risk assessment
- Ignore architecture concerns
- Forget to document learnings

**Remember:**
This workflow makes us 3-4x faster than competitors while maintaining higher quality. Follow it religiously.

---

**Estimated Time:**
- Phase 1 (AI Analysis): 5 minutes
- Phase 2 (Planning): 15 minutes
- Phase 3 (Implementation): 4-40 hours (varies)
- Phase 4 (Validation): 10 minutes
- Phase 5 (Deploy Prep): 5 minutes
- Phase 6 (Deploy): 10 minutes
- Phase 7 (Post-Deploy): 15 minutes

**Total Overhead:** ~60 minutes of process  
**Value:** Prevents hours of debugging, ensures success, maintains quality

🚀 **Ship it!**
