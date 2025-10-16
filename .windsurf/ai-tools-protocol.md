# 🤖 Cascade AI Tool Integration Protocol

**Last Updated:** October 15, 2025  
**Status:** ACTIVE - Follow these protocols in every session

---

## 🎯 Core Principle

**PROACTIVELY suggest and use our AI tools when relevant.**

Don't wait to be asked - these tools are our competitive advantage.  
Using them makes us 3-4x faster and prevents production incidents.

---

## 🛠️ Available AI Tools

### **1. Product Intelligence AI** ⭐⭐⭐⭐⭐
**Command:** `npm run product:analyze:ai "<feature>"`  
**Cost:** ~$0.08 per analysis  
**Time:** 30 seconds

**When to Use:**
- User requests new feature
- Discussing product decisions
- Planning roadmap
- Prioritizing features
- Evaluating feature ideas

**What It Provides:**
- Strategic analysis (what user REALLY needs)
- Critical questions to answer
- Alternative approaches
- Recommendations with confidence scores
- Success metrics
- Risk assessment

**Standard Response:**
```
💡 I notice you're planning [FEATURE]. Let me analyze this 
   strategically with our Product Intelligence AI.
   
   Running: npm run product:analyze:ai "[FEATURE]"
   
   This will give us:
   - What the user really needs (not just what they asked)
   - Critical questions to answer first
   - Alternative approaches to consider
   - Strategic recommendation with confidence score
   - Success metrics and risks
   
   Takes 30 seconds...
```

---

### **2. Error Parser AI** ⭐⭐⭐⭐⭐
**Command:** `npm run build:errors:ai <log-file>`  
**Cost:** ~$0.03 per error  
**Time:** 20 seconds

**When to Use:**
- Build fails
- TypeScript errors
- Deployment failures
- User mentions error they don't understand
- Any cryptic error messages

**What It Provides:**
- Plain English explanations
- Root cause analysis
- Step-by-step fixes
- Prevention tips
- Related issues to watch

**Standard Response:**
```
💡 I see build errors. Let me parse these with our Error Parser AI
   for friendly explanations and actionable fixes.
   
   Running: npm run build:errors:ai [LOG_FILE]
   
   This will provide:
   - Plain English: What this error REALLY means
   - Root Cause: Why it happened
   - How to Fix: Step-by-step instructions
   - Prevention: How to avoid it next time
   
   Takes 20 seconds...
```

---

### **3. Architecture Validator AI** ⭐⭐⭐⭐⭐
**Command:** `npm run arch:validate:ai`  
**Cost:** ~$0.12 per review  
**Time:** 30-45 seconds

**When to Use:**
- Before major refactoring
- After significant code changes
- Weekly health check (suggest Mondays)
- User mentions architecture concerns
- Before large migrations
- When discussing codebase organization

**What It Provides:**
- Overall health score (0-100)
- Strategic strengths
- Prioritized concerns
- Refactoring opportunities
- Best practice recommendations

**Standard Response:**
```
💡 Let me check our architecture health before we proceed.
   
   Running: npm run arch:validate:ai
   
   This will show:
   - Overall health score (0-100)
   - What's working well
   - Strategic concerns (prioritized)
   - Refactoring opportunities
   - Best practices to adopt
   
   Takes 30 seconds...
```

---

### **4. Deploy Risk AI** ⭐⭐⭐⭐⭐
**Command:** `npm run deploy:risk:ai`  
**Cost:** ~$0.12 per assessment  
**Time:** 30-45 seconds

**When to Use:**
- User mentions deploying
- Before production deploys (ALWAYS)
- After major changes
- When pushing to main branch
- User asks "should we deploy?"

**What It Provides:**
- Overall risk score (0-100)
- Risk level (LOW/MEDIUM/HIGH)
- Specific risk factors
- Recommended deployment strategy
- Monitoring checklist
- Rollback plan

**Standard Response:**
```
💡 Before deploying, let me assess the risk with our Deploy Risk AI.
   
   Running: npm run deploy:risk:ai
   
   This will check:
   - Risk score (0-100) and level
   - Specific risk factors from git changes
   - Recommended deployment strategy
   - What to monitor after deploy
   - Rollback plan if needed
   
   Takes 30 seconds...
```

---

### **5. Database Doctor AI** ⭐⭐⭐⭐⭐
**Command:** `npm run db:doctor:ai`  
**Cost:** ~$0.18 per diagnosis  
**Time:** 45-60 seconds

**When to Use:**
- Performance issues mentioned
- Database queries slow
- Weekly health check (suggest Fridays)
- After schema changes
- User mentions database concerns
- Proactive maintenance

**What It Provides:**
- Overall health score (0-100)
- Root cause analysis
- Prescriptive SQL fixes
- Performance optimization insights
- Security recommendations
- Preventive maintenance plan

**Standard Response:**
```
💡 Let me run a database health check with our Database Doctor AI.
   
   Running: npm run db:doctor:ai
   
   This will provide:
   - Database health score (0-100)
   - Root cause of any issues
   - Prescriptive SQL fixes (actual SQL!)
   - Performance optimization opportunities
   - Security and prevention recommendations
   
   Takes 60 seconds...
```

---

## 📋 Standard Workflows

### **Workflow: New Feature Request**

```
User: "Let's add [FEATURE]"

Me:
1. ✅ "Let me analyze this strategically first..."
2. ✅ Run: npm run product:analyze:ai "[FEATURE]"
3. ✅ Share AI insights:
   - What user really needs
   - Critical questions
   - Alternative approaches
   - Recommendation (with confidence)
   - Success metrics
   - Risks
4. ✅ Discuss with user
5. ✅ If approved: Save decision to context
   npm run windsurf:context decision \
     "Feature: [NAME]" \
     "AI recommended [APPROACH] with [X]% confidence. Key insight: [INSIGHT]" \
     "product" \
     "high"
6. ✅ Then proceed with implementation
```

---

### **Workflow: Feature Migration**

```
User: "Let's migrate [FEATURE] to new structure"

Me:
1. ✅ "Let me analyze this migration first..."
2. ✅ Run: npm run migrate:analyze:ai [FEATURE]
3. ✅ Run: npm run migrate:predict [FEATURE]
4. ✅ Run: npm run arch:validate:ai (baseline)
5. ✅ Share analysis:
   - Complexity estimate
   - Predicted issues
   - Current architecture health
6. ✅ Create migration plan
7. ✅ Execute migration
8. ✅ Run: npm run arch:validate:ai (verify improvement)
9. ✅ Record pattern: npm run windsurf:patterns record
10. ✅ Update context with learnings
```

---

### **Workflow: Build Failure**

```
Build fails or TypeScript errors occur

Me:
1. ✅ "Let me parse these errors with our AI for friendly explanations..."
2. ✅ Capture error log to file
3. ✅ Run: npm run build:errors:ai [LOG_FILE]
4. ✅ Share with user:
   - Plain English: What it means
   - Root Cause: Why it happened
   - How to Fix: Step-by-step
   - Prevention: How to avoid
5. ✅ Apply fixes
6. ✅ Clean up temp files
```

---

### **Workflow: Before Deploy**

```
User: "Let's deploy" or "Push to production"

Me:
1. ✅ "Before deploying, let me assess the risk..."
2. ✅ Run: npm run deploy:risk:ai
3. ✅ Share assessment:
   - Risk score and level
   - Specific risk factors
   - Deployment strategy
   - Monitoring plan
4. ✅ Based on risk:
   - LOW: "Risk is low, safe to proceed"
   - MEDIUM: "Medium risk - recommend gradual rollout"
   - HIGH: "HIGH RISK - let's discuss these concerns first"
5. ✅ If approved, proceed with deploy
6. ✅ Remind user of monitoring checklist
```

---

### **Workflow: Architecture Review**

```
User mentions: refactoring, architecture, organization, structure

Me:
1. ✅ "Let me check our current architecture health..."
2. ✅ Run: npm run arch:validate:ai
3. ✅ Share insights:
   - Health score (trend if available)
   - Strengths
   - Top 3 priority concerns
   - Recommended actions
4. ✅ Discuss findings
5. ✅ If changes needed, plan refactoring
6. ✅ Save insights to context
```

---

### **Workflow: Performance Issues**

```
User mentions: slow, performance, database, query optimization

Me:
1. ✅ "Let me run a database health check..."
2. ✅ Run: npm run db:doctor:ai
3. ✅ Share diagnosis:
   - Health score
   - Root causes
   - Prescriptive SQL fixes
   - Performance optimizations
4. ✅ Discuss priority fixes
5. ✅ Apply approved fixes
6. ✅ Verify improvement
```

---

## 🔄 Proactive Suggestions

### **Weekly Rhythm (Suggest These):**

**Monday Morning:**
```
💡 "Good morning! Should we start the week with an architecture 
   health check? 
   
   Run: npm run arch:validate:ai
   
   This helps us catch issues early and plan the week."
```

**Friday Afternoon:**
```
💡 "Before the weekend, should we run a database health check?
   
   Run: npm run db:doctor:ai
   
   This ensures we're optimized for next week's work."
```

**Before Any Production Deploy:**
```
💡 "Before deploying, I should run our Deploy Risk AI.
   
   Run: npm run deploy:risk:ai
   
   This prevents production incidents. Takes 30 seconds."
```

---

## 💾 Memory Integration

### **After Using AI Tools, Save Important Findings:**

```bash
# Product decision
npm run windsurf:context decision \
  "Feature: Notifications - AI Analysis" \
  "AI recommended MVP push notifications (85% confidence). Key insight: Users need real-time updates, not just badges. Success: 70% adoption in 30d. Risk: Low adoption if too noisy." \
  "product" \
  "high"

# Architecture insight
npm run windsurf:context decision \
  "Architecture Health: 70/100" \
  "Top concerns: Inconsistent feature structure, potential coupling between features. AI recommends standardizing feature folders and using event-driven communication." \
  "architecture" \
  "high"

# Deploy risk
npm run windsurf:context decision \
  "Deploy Risk: MEDIUM (45/100)" \
  "Risk factors: package.json changes, recent deployment. Strategy: Blue-green deployment. Monitor: error rates, response times." \
  "deployment" \
  "medium"
```

### **Reference Past AI Analyses:**

```bash
# Search for previous product decisions
npm run windsurf:context search "notification"

# Search for architecture insights
npm run windsurf:context search "architecture"

# Search for deploy risks
npm run windsurf:context search "deploy"
```

---

## 🎯 Trigger Patterns

### **Automatic Triggers (Always Suggest):**

| User Says | My Response |
|-----------|-------------|
| "Let's add...", "Build...", "Create..." | Suggest Product Intelligence AI |
| "Deploy", "Push to prod", "Release" | **ALWAYS** run Deploy Risk AI |
| "Error", "Build failed", "Cannot find" | **ALWAYS** run Error Parser AI |
| "Slow", "Performance", "Database" | Suggest Database Doctor AI |
| "Refactor", "Organize", "Architecture" | Suggest Architecture Validator AI |
| "Migrate [feature]" | Run migration analyzers + arch validator |

### **Weekly Triggers (Proactive):**

| When | What |
|------|------|
| Monday start | Suggest arch:validate:ai |
| Friday end | Suggest db:doctor:ai |
| After 5+ file changes | Suggest arch:validate:ai |
| Before any deploy | **REQUIRE** deploy:risk:ai |

---

## 🚀 Best Practices

### **1. Always Run Before Major Actions:**
- ✅ Product Intelligence AI BEFORE building features
- ✅ Deploy Risk AI BEFORE production deploys
- ✅ Architecture Validator AI BEFORE major refactoring
- ✅ Database Doctor AI BEFORE schema changes
- ✅ Error Parser AI WHEN builds fail

### **2. Share Full AI Output:**
- Don't just say "AI suggests X"
- Share the actual insights, confidence scores, reasoning
- Let user see the strategic thinking
- Build trust in AI recommendations

### **3. Save Important Decisions:**
- Use windsurf:context to save AI insights
- Reference them in future sessions
- Build institutional memory
- Learn from past decisions

### **4. Cost Awareness:**
- Each tool costs $0.03-$0.18
- Total monthly budget: ~$11
- Worth it for 3-4x velocity gain
- Don't hesitate to use them

### **5. Be Proactive:**
- Suggest tools BEFORE being asked
- Integrate into standard workflows
- Make them invisible/automatic
- These tools are our advantage

---

## 📊 Success Metrics

**Track These:**
- How often we use each AI tool
- Time saved debugging (Error Parser)
- Features shipped faster (Product Intelligence)
- Incidents prevented (Deploy Risk)
- Architecture improvements (Validator)
- Database optimizations (Doctor)

**Expected Impact:**
- 3-4x faster feature delivery
- 80% fewer production incidents
- Better product decisions
- Healthier codebase
- Optimized database

---

## 🎓 Learning Over Time

### **Pattern Recognition:**
```
As we use these tools more:
- Learn which features the AI recommends
- Notice patterns in errors (prevent them)
- See architecture anti-patterns early
- Understand deploy risk factors
- Recognize database optimization opportunities

Build these patterns into our workflow.
```

### **Continuous Improvement:**
```
Every month, review:
- Which AI insights were most valuable?
- Which tools saved the most time?
- What patterns emerged?
- How can we use them better?

Refine this protocol based on learnings.
```

---

## 💡 Remember

**These AI tools are our unfair competitive advantage.**

**Traditional companies:**
- Guess at product decisions
- Debug errors manually for hours
- Ship code hoping for the best
- React to database issues
- Accumulate technical debt

**We:**
- Make data-driven product decisions (AI)
- Debug in minutes with friendly explanations (AI)
- Assess risk before every deploy (AI)
- Optimize proactively (AI)
- Maintain healthy architecture (AI)

**Result: 3-4x faster, higher quality, fewer incidents.**

**Use these tools. Be proactive. Ship legendary work.** 🚀

---

**Last Updated:** October 15, 2025  
**Review This Protocol:** At the start of every session  
**Status:** ACTIVE - Follow religiously

🏆 **These tools make us legendary. Use them.** 🏆
