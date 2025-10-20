# Expression Engine: God-Tier Roadmap

**Status:** B-2 Complete, Enhancement Roadmap  
**Goal:** Take from "great" to "god-tier" - Fast, debuggable, AI-authorable

---

## 🎯 **Current State (B-2 Complete)**

✅ Safe, allowlisted operations  
✅ Readonly context binding  
✅ Comprehensive tests (50+ cases)  
✅ Validator integration  
✅ Beautiful error messages  

**Now: Make it blazing fast, debuggable, and AI-friendly!**

---

## 🚀 **The 6 Key Enhancements (High ROI)**

### **1. Dependency Tracking + Memoization**

**Problem:** Re-evaluating on every keystroke wastes CPU  
**Solution:** Track which `ctx` paths expression touches

```typescript
{
  expression: "ctx.vehicle.mileage > 100000 && ctx.state.level == 'active'",
  dependencies: ['ctx.vehicle.mileage', 'ctx.state.level'],
  compiled: /* AST */
}
```

**React Integration:**
```typescript
const deps = useMemo(() => compiled.getDeps(), [compiled])
const result = useMemo(
  () => evaluate(compiled, context),
  deps.map(path => get(context, path))
)
```

**Benefits:**
- 10-100x faster in forms (only re-eval on relevant changes)
- Fine-grained React memoization
- Explicit in dev overlay ("depends on: vehicle.mileage, state.level")

---

### **2. Expression Playground (Dev Overlay)**

**Problem:** Hard to debug expressions in flows  
**Solution:** Live playground in dev mode

**Features:**
```
┌─ Expression Playground (Dev Only) ──────────────┐
│ Expression: ctx.vehicle.mileage > 100000        │
│                                                  │
│ Compiled AST:                                    │
│ { type: 'binary', op: '>', left: {...} }        │
│                                                  │
│ Dependencies:                                    │
│ • ctx.vehicle.mileage                           │
│                                                  │
│ Context Snapshot:                                │
│ { vehicle: { mileage: 150000 } }                │
│                                                  │
│ Result: true                                     │
│ Eval Time: 0.12ms                               │
│                                                  │
│ ⚠ Warnings: None                                │
└──────────────────────────────────────────────────┘
```

**Triggers:**
- Click expression in dev mode
- Error occurred → auto-open with snapshot
- Toggle in dev shell (Cmd+Shift+E)

---

### **3. Preflight Analyzer (Dead Code Detection)**

**Problem:** Expressions might be impossible or trivial  
**Solution:** Static analysis at flow load

**Detects:**
```typescript
// Always false (dead step)
"shouldExistWhen": "ctx.state.level == 'active' && ctx.state.level == 'inactive'"

// Always true (tautology)
"continueEnabledWhen": "true"

// Unreachable
Step 5 requires: ctx.flags.completed == true
Step 3 sets: ctx.flags.completed = false
→ Step 5 is unreachable
```

**Output:**
```typescript
{
  warnings: [
    {
      type: 'DEAD_STEP',
      stepId: 'fluids',
      message: 'Expression is always false',
      expression: 'ctx.state.level == "active" && ctx.state.level == "inactive"'
    }
  ]
}
```

---

### **4. Expression Lint Rules**

**Problem:** Long/complex expressions are hard to maintain  
**Solution:** Automated linting

**Rules:**

1. **Length Warning** (>300 chars)
   ```
   ⚠ Expression too long (345 chars)
   💡 Consider using computed field: ctx.flags.isHighMileage
   ```

2. **Depth Warning** (>6 nested levels)
   ```
   ⚠ Expression too deeply nested (8 levels)
   💡 Split into helper flags
   ```

3. **Type Coercion Warning** (`==` with mixed types)
   ```
   ⚠ Using == with mixed types: ctx.value == "5"
   💡 Prefer === for type safety
   ```

4. **Regex Safety** (ReDoS patterns)
   ```
   ⚠ Potentially catastrophic regex: (a+)+
   💡 Simplify pattern or add length cap
   ```

---

### **5. Computed Flags (Readable Expressions)**

**Problem:** Repeated complex expressions  
**Solution:** Define once, reference everywhere

**Before:**
```json
{
  "step1": {
    "shouldExistWhen": "ctx.vehicle.mileage > 100000 && ctx.vehicle.year < 2010"
  },
  "step2": {
    "shouldExistWhen": "ctx.vehicle.mileage > 100000 && ctx.vehicle.year < 2010"
  }
}
```

**After:**
```json
{
  "computed": {
    "isOldHighMileage": "ctx.vehicle.mileage > 100000 && ctx.vehicle.year < 2010"
  },
  "steps": [
    { "shouldExistWhen": "ctx.flags.isOldHighMileage" },
    { "shouldExistWhen": "ctx.flags.isOldHighMileage" }
  ]
}
```

**Benefits:**
- DRY (Don't Repeat Yourself)
- More readable
- AI generates cleaner expressions
- One place to update logic

---

### **6. Safe Mode (No Blank Screens)**

**Problem:** Expression errors crash UI  
**Solution:** Graceful degradation

**Rendering:**
```tsx
{expressionError ? (
  <ConfigErrorCard
    title="Expression Error"
    message={error.message}
    expression={step.shouldExistWhen}
    showInDev={true}
  />
) : (
  <StepRenderer step={step} />
)}
```

**Production:**
```tsx
// Continue disabled, show generic message
<Alert variant="warning">
  Unable to validate form. Please check your inputs.
</Alert>
```

**Never:**
- ❌ Blank screen
- ❌ Unhandled errors
- ❌ Crashes

---

## 📊 **Performance & Observability**

### **Performance Budget:**
```typescript
{
  "p95_eval_time": "< 0.2ms",
  "p99_eval_time": "< 2ms",
  "error_rate": "< 0.5%"
}
```

**Tracking:**
```typescript
trackExpressionEval({
  flowId,
  stepId,
  expressionPath: 'shouldExistWhen',
  expressionHash: hash(expr),
  durationMs: 0.15,
  success: true,
  cacheHit: true
})
```

**Alerts:**
```
⚠ Expression error rate: 2.1% (threshold: 0.5%)
  Flow: vehicle-onboarding
  Step: vin
  Last 1000 sessions
```

---

## 🧠 **AI Authoring Enhancements**

### **1. Helper Aliases (Readable)**

```typescript
// Aliases for common patterns
present(x) ≡ !empty(x)
oneOf(x, arr) ≡ in(x, arr)
matches(x, pattern) ≡ match(x, pattern)
allTrue(arr) ≡ all(arr, true)
anyTrue(arr) ≡ any(arr, true)
```

**Example:**
```json
// Before
"continueEnabledWhen": "!empty(fields.vin.value) && !empty(fields.make.value)"

// After (more readable)
"continueEnabledWhen": "present(fields.vin.value) && present(fields.make.value)"
```

### **2. Expression Cookbook (Few-Shot Examples)**

**For AI to reference:**

```typescript
const EXPRESSION_COOKBOOK = {
  // VIN validation
  vinValid: "fields.vin.valid && present(fields.vin.value) && length(fields.vin.value) === 17",
  
  // Mileage bands
  highMileage: "ctx.vehicle.mileage > 100000",
  veryHighMileage: "ctx.vehicle.mileage > 200000",
  
  // Consent gates
  canCollectData: "fields.shareData.value === true && fields.acceptedTerms.value === true",
  
  // Membership checks
  isPremium: "oneOf('premium', ctx.user.subscriptions)",
  isActive: "ctx.state.level === 'active'",
  
  // Complex conditions
  needsMaintenance: "ctx.vehicle.mileage > 100000 && empty(ctx.vehicle.lastService)",
  
  // Any/All patterns
  allFieldsValid: "allTrue([fields.vin.valid, fields.make.valid, fields.model.valid])",
  anyFieldEmpty: "anyTrue([empty(fields.vin.value), empty(fields.make.value)])"
}
```

### **3. Auto-Repair Pass**

**Common Mistakes:**
```typescript
// AI generates (wrong)
"ctx.vehicle.vin?.length === 17"  // TS syntax

// Auto-repair
"has(ctx.vehicle.vin) && length(ctx.vehicle.vin) === 17"

// AI generates (wrong)
"ctx.options.includes('premium')"  // JS method

// Auto-repair
"in('premium', ctx.options)"
```

**Flow:**
```
Parse fails
  ↓
Try auto-repairs
  ↓
Re-validate
  ↓
Success? → Store diff in warnings
  ↓
Fail? → Return error with suggestions
```

---

## 🔒 **Privacy & Security**

### **Field Access Control:**

```typescript
// Disallow reading SENSITIVE fields in expressions
// unless privacy.allowInAI === false

const field = resolveField('fields.ssn.value')
if (field.privacy.classification === 'SENSITIVE' && 
    field.privacy.allowInAI === true) {
  throw new Error('Cannot reference SENSITIVE field in expression')
}
```

**Validator Check:**
```typescript
// At flow load
for (const expr of allExpressions) {
  const deps = getDependencies(expr)
  for (const dep of deps) {
    const field = resolveField(dep)
    if (field?.privacy.classification === 'SENSITIVE') {
      errors.push({
        code: 'SENSITIVE_FIELD_REFERENCE',
        path: expr.path,
        suggestion: 'Remove reference to sensitive field or use computed flag'
      })
    }
  }
}
```

---

## 🛠️ **Implementation Priority**

### **Phase 1: Performance (Week 1)**
1. ✅ Dependency tracking (getDeps)
2. ✅ Compile cache (LRU with TTL)
3. ✅ Memoization helpers

### **Phase 2: Dev Tools (Week 2)**
4. ✅ Expression Playground component
5. ✅ Snapshot recorder
6. ✅ Storybook stories

### **Phase 3: Hardening (Week 3)**
7. ✅ Preflight analyzer
8. ✅ Lint rules
9. ✅ Safe mode rendering

### **Phase 4: Ergonomics (Week 4)**
10. ✅ Helper aliases
11. ✅ Computed flags
12. ✅ Expression cookbook

### **Phase 5: AI Authoring (Week 5)**
13. ✅ Auto-repair pass
14. ✅ Machine-readable fixes
15. ✅ Privacy enforcement

---

## 📈 **Success Metrics**

**Performance:**
- ✅ p95 eval time < 0.2ms
- ✅ Cache hit rate > 90%
- ✅ Re-eval only on dependency changes

**Reliability:**
- ✅ Expression error rate < 0.5%
- ✅ Zero blank screens
- ✅ All errors have recovery path

**Developer Experience:**
- ✅ Playground usage > 50% of devs
- ✅ Lint warnings < 5% of expressions
- ✅ Computed flags > 30% of complex logic

**AI Authoring:**
- ✅ Auto-repair success > 80%
- ✅ Cookbook patterns > 70% of AI expressions
- ✅ First-attempt valid > 90%

---

## 🎯 **Quick Wins (Today)**

### **1. Dependency Tracking (2h)**
```typescript
function getDependencies(ast: ASTNode): string[] {
  const deps: Set<string> = new Set()
  
  function walk(node: ASTNode) {
    if (node.type === 'identifier') {
      deps.add(node.path.join('.'))
    }
    // Recurse...
  }
  
  walk(ast)
  return Array.from(deps)
}
```

### **2. Helper Aliases (1h)**
```typescript
const BUILT_IN_FUNCTIONS = {
  empty: (args) => /* existing */,
  present: (args) => !BUILT_IN_FUNCTIONS.empty(args),
  oneOf: (args) => BUILT_IN_FUNCTIONS.in(args),
  // ...
}
```

### **3. Lint Rule: Length (30min)**
```typescript
if (expression.length > 300) {
  warnings.push({
    code: 'EXPRESSION_TOO_LONG',
    message: `Expression is ${expression.length} chars (max 300)`,
    suggestion: 'Use computed field for complex logic'
  })
}
```

---

## 🔥 **The Impact**

### **Before (Current):**
- ✅ Safe, validated expressions
- ✅ Comprehensive tests
- ⚠️ Re-evaluates on every change
- ⚠️ Hard to debug
- ⚠️ No lint rules
- ⚠️ Repeated logic

### **After (God-Tier):**
- ✅ Safe, validated, **fast** (memoized)
- ✅ Comprehensive tests + **property tests**
- ✅ **Playground for debugging**
- ✅ **Preflight analyzer** (dead code)
- ✅ **Lint rules** (length, depth, coercion)
- ✅ **Computed flags** (DRY)
- ✅ **Auto-repair** for AI
- ✅ **Privacy enforcement**
- ✅ **Zero blank screens**

---

**This roadmap transforms the expression engine from "production-ready" to "industry-leading"!** 🚀
