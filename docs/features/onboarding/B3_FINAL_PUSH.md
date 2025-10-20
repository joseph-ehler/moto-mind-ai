# B-3 Data Source Registry: Final Push to 100%

**Current Status:** 90% Complete  
**Target:** 100% Production-Ready  
**Time Estimate:** 6-10 hours  
**Date:** October 20, 2025

---

## 🎯 **Mission: Complete B-3 and Ship**

We're 90% done with all the hard infrastructure work complete. Now it's time to wire everything together, add comprehensive tests, and ship a production-grade declarative data layer!

---

## ✅ **What's Already Complete (90%)**

### **Infrastructure (2,780+ lines)**
- ✅ Schema extensions
- ✅ Core modules (5 files)
- ✅ Production hardening (8 files)
- ✅ DataSourceManager integration
- ✅ All production features active
- ✅ All tests passing (79/79)

### **Features Active**
- ✅ SSRF protection
- ✅ HTTPS enforcement
- ✅ Retry with jitter
- ✅ Idempotency headers
- ✅ Response validation
- ✅ Abort signals
- ✅ Error taxonomy
- ✅ User messages
- ✅ Circuit breakers
- ✅ Privacy enforcement

---

## 🚀 **Final Push Tasks (10%)**

### **Task 1: In-Flight Dedupe Wiring** ⏱️ 30 min
**Status:** Infrastructure ready, needs wiring

**Goal:** Coalesce concurrent requests to same source

**Implementation:**
```typescript
// In fetch() method, after mock check and analytics start
const cacheKey = source.cache 
  ? this.getCacheKey(flowId, sourceName, source, context)
  : `${flowId}:${sourceName}:${Date.now()}`

const inFlightKey = getInFlightKey(flowId, sourceName, cacheKey)

if (this.config.featureFlags.enableInFlightDedupe) {
  // Wrap execution in dedupe
  return await this.inFlight.execute(
    inFlightKey,
    async () => {
      // Execute cache check + fetch + store logic
      return await this.executeSourceFetch(...)
    }
  )
}
```

**Files to Update:**
- `lib/wizard/data-sources/data-source-manager.ts`

**Validation:**
- Test concurrent requests coalesce
- Test subscriber counting
- Test cleanup after completion

---

### **Task 2: StepRenderer Integration** ⏱️ 2-3 hours
**Status:** Needs implementation

**Goal:** Wire data sources to wizard UI

**Implementation Steps:**

#### **2.1: Register Sources** (15 min)
```typescript
// In StepRenderer or flow context
useEffect(() => {
  if (flow.dataSources) {
    dataSourceManager.register(flow.id, flow.dataSources)
  }
}, [flow.id])
```

#### **2.2: Handle onEnter.fetch** (1h)
```typescript
useEffect(() => {
  if (!step.onEnter?.fetch) return
  
  const abortController = new AbortController()
  setLoading(true)
  setError(null)
  
  async function fetchOnEnter() {
    const results = await Promise.allSettled(
      step.onEnter.fetch.map(sourceName =>
        dataSourceManager.fetch(flow.id, sourceName, context, {
          signal: abortController.signal,
          traceId: `${flow.id}:${step.id}:${Date.now()}`
        })
      )
    )
    
    // Check for failures
    const failures = results.filter(
      r => r.status === 'rejected' || !r.value.success
    )
    
    if (failures.length > 0) {
      // Show safe mode banner
      const firstFailure = failures[0]
      const error = firstFailure.status === 'rejected' 
        ? firstFailure.reason 
        : firstFailure.value.error
      
      const message = getUserMessage(error?.code || DataSourceErrorCode.UNKNOWN)
      setSafeModeMessage(message)
    }
    
    setLoading(false)
  }
  
  fetchOnEnter()
  
  return () => abortController.abort()
}, [step.id])
```

#### **2.3: Evaluate continueWhen** (30 min)
```typescript
useEffect(() => {
  if (!step.onEnter?.continueWhen) return
  
  const result = evaluateExpression(step.onEnter.continueWhen, context)
  
  if (result.success && result.value === true) {
    // Auto-advance with dwell
    const timer = setTimeout(() => {
      onContinue()
    }, 500) // 500ms dwell for smooth UX
    
    return () => clearTimeout(timer)
  }
}, [context, step.onEnter?.continueWhen])
```

#### **2.4: Loading Scene Integration** (30 min)
```typescript
// Show loading scene while fetching
if (loading && step.onEnter?.fetch) {
  return <LoadingScene 
    title={step.title}
    subtitle="Loading data..."
    ticker={step.loading?.ticker}
    onTimeout={() => {
      setError({
        code: DataSourceErrorCode.TIMEOUT,
        message: 'Request timed out'
      })
    }}
  />
}

// Show safe mode banner if needed
{safeModeMessage && (
  <SafeModeBanner
    level="warning"
    title={safeModeMessage.title}
    message={safeModeMessage.message}
    action={safeModeMessage.action}
    onDismiss={() => setSafeModeMessage(null)}
  />
)}
```

**Files to Update:**
- Find StepRenderer component
- Add data source integration hooks
- Wire to LoadingScene
- Add safe mode banner component

---

### **Task 3: Field Async Validation** ⏱️ 2 hours
**Status:** Needs implementation

**Goal:** Debounced async validation via data sources

**Implementation:**
```typescript
// In field component or validation hook
const [validating, setValidating] = useState(false)
const [asyncError, setAsyncError] = useState<string>()

useEffect(() => {
  if (!field.validationAsync) return
  
  const debounceMs = field.validationAsync.debounceMs || 300
  const controller = new AbortController()
  
  const timer = setTimeout(async () => {
    setValidating(true)
    setAsyncError(undefined)
    
    try {
      const result = await dataSourceManager.fetch(
        flow.id,
        field.validationAsync.source,
        context,
        { signal: controller.signal }
      )
      
      if (result.success) {
        // Validation passed
        updateFieldState(field.id, { 
          valid: true,
          error: undefined 
        })
      } else {
        // Validation failed
        const message = result.error?.message || 'Validation failed'
        setAsyncError(message)
        updateFieldState(field.id, { 
          valid: false, 
          error: message 
        })
      }
    } catch (error) {
      // Handle abort or other errors
      if (error.name !== 'AbortError') {
        const message = 'Validation error'
        setAsyncError(message)
        updateFieldState(field.id, { 
          valid: false, 
          error: message 
        })
      }
    } finally {
      setValidating(false)
    }
  }, debounceMs)
  
  return () => {
    clearTimeout(timer)
    controller.abort()
  }
}, [fieldValue, field.validationAsync])

// Show validating state
{validating && (
  <span className="text-sm text-muted-foreground">
    Validating...
  </span>
)}
```

**Files to Update:**
- Find field validation logic
- Add async validation hook
- Show validating state in UI
- Cancel on blur

---

### **Task 4: Comprehensive Tests** ⏱️ 2-3 hours
**Status:** Needs implementation

**Goal:** Lock in all features with tests

#### **4.1: URL Validator Tests** (30 min)
```typescript
describe('URL Validator', () => {
  test('blocks private IPs')
  test('enforces host allowlist')
  test('requires HTTPS in production')
  test('allows relative URLs')
  test('rejects invalid URLs')
})
```

#### **4.2: Retry Tests** (30 min)
```typescript
describe('Retry with Jitter', () => {
  test('retries on retryable errors')
  test('does not retry on non-retryable errors')
  test('respects max retries')
  test('applies jitter to backoff')
  test('POST without idempotent flag skips retry')
  test('emits retry analytics')
})
```

#### **4.3: In-Flight Dedupe Tests** (30 min)
```typescript
describe('In-Flight Deduplication', () => {
  test('coalesces concurrent requests')
  test('fans out result to all subscribers')
  test('cleans up after completion')
  test('tracks subscriber count')
  test('bypasses when disabled')
})
```

#### **4.4: Response Validation Tests** (30 min)
```typescript
describe('Response Validation', () => {
  test('validates against schema')
  test('throws on validation failure')
  test('logs redacted preview')
  test('passes valid responses')
})
```

#### **4.5: Integration Tests** (1h)
```typescript
describe('Data Source Manager Integration', () => {
  test('end-to-end fetch with all features')
  test('cache hit/miss flow')
  test('circuit breaker states')
  test('abort signal cancels request')
  test('error taxonomy classification')
  test('mock support')
})
```

**Files to Create:**
- `tests/unit/wizard/data-sources/url-validator.test.ts`
- `tests/unit/wizard/data-sources/retry.test.ts`
- `tests/unit/wizard/data-sources/in-flight.test.ts`
- `tests/unit/wizard/data-sources/response-validator.test.ts`
- `tests/integration/wizard/data-source-manager.test.ts`

---

### **Task 5: Documentation** ⏱️ 1 hour
**Status:** Needs implementation

**Goal:** Enable team to use the system

#### **5.1: Usage Guide** (30 min)
**File:** `docs/features/onboarding/DATA_SOURCE_USAGE.md`

**Contents:**
- Quick start
- JSON schema reference
- Template syntax
- Caching strategies
- Privacy configuration
- Error handling
- Examples (HTTP, computed, chain)

#### **5.2: Security Guide** (30 min)
**File:** `docs/features/onboarding/DATA_SOURCE_SECURITY.md`

**Contents:**
- Host allowlist management
- SSRF protection explained
- Idempotency best practices
- Privacy enforcement
- Secrets management
- Environment policies

---

## 📋 **Execution Checklist**

### **Session 1: Quick Wins** (1-2h)
- [ ] Wire in-flight dedupe (30 min)
- [ ] Test in-flight dedupe (30 min)
- [ ] Register sources in StepRenderer (15 min)
- [ ] Handle onEnter.fetch (1h)

### **Session 2: Polish** (2-3h)
- [ ] Evaluate continueWhen (30 min)
- [ ] LoadingScene integration (30 min)
- [ ] Field async validation (2h)

### **Session 3: Lock It In** (3-4h)
- [ ] URL validator tests (30 min)
- [ ] Retry tests (30 min)
- [ ] In-flight tests (30 min)
- [ ] Response validation tests (30 min)
- [ ] Integration tests (1h)
- [ ] Usage documentation (30 min)
- [ ] Security documentation (30 min)

---

## 🎯 **Success Criteria**

### **Functional**
- [ ] In-flight dedupe reduces concurrent requests
- [ ] StepRenderer fetches on enter
- [ ] continueWhen auto-advances
- [ ] LoadingScene shows during fetch
- [ ] Safe mode works on errors
- [ ] Field async validation debounces
- [ ] Abort cancels requests
- [ ] All tests pass

### **Non-Functional**
- [ ] Type-safe throughout
- [ ] Observable (analytics)
- [ ] Documented (usage + security)
- [ ] Tested (>80% coverage)
- [ ] Production-ready

---

## 🚀 **Ship Checklist**

Before marking B-3 complete:
- [ ] All tasks complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Performance validated
- [ ] Security validated
- [ ] Demo recorded
- [ ] Team trained

---

## 📈 **Impact**

**For Product:**
- Declarative data fetching
- AI-authorable flows
- Privacy-first by default
- Resilient + fast

**For Engineering:**
- Type-safe
- Observable
- Testable
- Maintainable

**For Business:**
- Faster development
- Lower costs
- Better UX
- Fewer bugs

---

**LET'S FINISH THIS AND SHIP! 🚀**
