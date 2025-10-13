# 🧪 MotoMind Testing Guide

**Status:** ✅ Implemented (Phase 1B)  
**Purpose:** Comprehensive testing infrastructure for confidence to ship fast

---

## 📖 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Helpers](#test-helpers)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

---

## 🎯 **OVERVIEW**

MotoMind uses a multi-layered testing approach:

```
Unit Tests (Jest)           → Fast, isolated, specific
Integration Tests (Jest)    → API + DB interactions
E2E Tests (Playwright)      → Full user flows, real browsers
```

**Coverage Goals:**
- **Unit tests:** 80%+ for business logic
- **Integration tests:** Critical API routes
- **E2E tests:** Core user flows

---

## 🧪 **TEST TYPES**

### **1. Unit Tests (Jest)**

**Location:** `tests/unit/`  
**Purpose:** Test individual functions/components in isolation  
**Speed:** Very fast (milliseconds)

**What to test:**
- Pure functions
- Business logic
- Feature flags
- Utilities
- React components (shallow)

**Example:**
```typescript
// tests/unit/lib/features.test.ts
import { isFeatureEnabled } from '@/lib/config/features'

describe('Feature Flags', () => {
  it('should return false for disabled features', () => {
    const enabled = isFeatureEnabled('patternRecognition', {
      userId: 'test-user',
      userTier: 'pro'
    })

    expect(enabled).toBe(false)
  })
})
```

---

### **2. Integration Tests (Jest)**

**Location:** `tests/integration/`  
**Purpose:** Test interactions between modules  
**Speed:** Medium (seconds)

**What to test:**
- API routes
- Database operations
- External API calls
- Service layer

**Example:**
```typescript
// tests/integration/api/events.test.ts
import { createEvent } from '@/lib/actions/events'

describe('Event API', () => {
  it('should create fuel event', async () => {
    const event = await createEvent({
      vehicleId: 'test-vehicle',
      type: 'fuel',
      date: new Date().toISOString(),
      totalAmount: 50.00
    })

    expect(event).toHaveProperty('id')
    expect(event.type).toBe('fuel')
  })
})
```

---

### **3. E2E Tests (Playwright)**

**Location:** `tests/e2e/`  
**Purpose:** Test complete user flows in real browsers  
**Speed:** Slow (seconds to minutes)

**What to test:**
- Critical user journeys
- Capture flow
- AI chat
- Timeline navigation
- Offline mode

**Example:**
```typescript
// tests/e2e/capture-flow.test.ts
import { test, expect } from '@playwright/test'

test('should capture and save photo', async ({ page }) => {
  await page.goto('/capture')
  await page.context().grantPermissions(['camera'])
  
  await page.click('[data-testid="capture-button"]')
  await page.waitForSelector('[data-testid="photo-preview"]')
  await page.click('[data-testid="save-button"]')
  
  await expect(page).toHaveURL('**/capture/details')
})
```

---

## 🚀 **RUNNING TESTS**

### **All Tests**
```bash
npm test
```

### **Unit Tests Only**
```bash
npm run test:unit
```

### **Integration Tests Only**
```bash
npm run test:integration
```

### **E2E Tests**
```bash
npm run test:e2e
```

### **Watch Mode** (for development)
```bash
npm run test:watch
```

### **Coverage Report**
```bash
npm run test:coverage
```

### **Specific Test File**
```bash
npm test -- tests/unit/lib/features.test.ts
```

### **Specific Test**
```bash
npm test -- -t "should return false for disabled features"
```

---

## ✍️ **WRITING TESTS**

### **Unit Test Template**

```typescript
/**
 * UNIT TESTS: [Component/Function Name]
 * 
 * Tests for [describe what you're testing]
 */

import { functionToTest } from '@/lib/path/to/function'

describe('[Component/Function Name]', () => {
  describe('[method/function name]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = 'test data'
      
      // Act
      const result = functionToTest(input)
      
      // Assert
      expect(result).toBe('expected output')
    })
  })
})
```

### **Integration Test Template**

```typescript
/**
 * INTEGRATION TESTS: [API/Service Name]
 * 
 * Tests for [describe what you're testing]
 */

import { apiFunction } from '@/lib/actions/api'

describe('[API Name]', () => {
  beforeEach(() => {
    // Setup database, mocks, etc.
  })

  afterEach(() => {
    // Cleanup
  })

  it('should [expected behavior]', async () => {
    // Arrange
    const input = { ... }
    
    // Act
    const result = await apiFunction(input)
    
    // Assert
    expect(result).toHaveProperty('id')
  })
})
```

### **E2E Test Template**

```typescript
/**
 * E2E TESTS: [User Flow Name]
 * 
 * Tests for [describe the flow]
 */

import { test, expect } from '@playwright/test'

test.describe('[Flow Name]', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to starting page
    await page.goto('/page')
  })

  test('should [user action]', async ({ page }) => {
    // Act
    await page.click('[data-testid="button"]')
    
    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })
})
```

---

## 🛠️ **TEST HELPERS**

### **Setup Helpers**

**Location:** `tests/helpers/setup.ts`

```typescript
import { 
  mockUser, 
  mockVehicle, 
  mockEvent,
  setupGlobalMocks,
  cleanupGlobalMocks 
} from '@/tests/helpers/setup'

describe('My Test', () => {
  beforeEach(() => {
    setupGlobalMocks()
  })

  afterEach(() => {
    cleanupGlobalMocks()
  })

  it('should work with mocked user', () => {
    const user = mockUser
    // user.id === 'test-user-id'
  })
})
```

### **Available Mocks:**

- `mockUser` - Test user object
- `mockProfile` - User profile with tier
- `mockVehicle` - Test vehicle
- `mockEvent` - Test event
- `mockSupabaseClient` - Mocked Supabase
- `mockLocalStorage` - Mocked localStorage
- `mockIndexedDB` - Mocked IndexedDB
- `mockServiceWorker` - Mocked service worker

### **Custom Matchers:**

```typescript
// From @testing-library/jest-dom
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toHaveTextContent('text')
expect(element).toHaveClass('className')
```

---

## 📋 **BEST PRACTICES**

### **✅ DO:**

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Good
   expect(button).toHaveTextContent('Submit')
   
   // ❌ Bad
   expect(button.props.children).toBe('Submit')
   ```

2. **Use descriptive test names**
   ```typescript
   // ✅ Good
   it('should show error message when email is invalid', () => {})
   
   // ❌ Bad
   it('test email', () => {})
   ```

3. **Follow AAA pattern** (Arrange, Act, Assert)
   ```typescript
   it('should add numbers', () => {
     // Arrange
     const a = 1
     const b = 2
     
     // Act
     const result = add(a, b)
     
     // Assert
     expect(result).toBe(3)
   })
   ```

4. **Mock external dependencies**
   ```typescript
   jest.mock('@/lib/supabase', () => ({
     supabase: mockSupabaseClient
   }))
   ```

5. **Test error cases**
   ```typescript
   it('should throw error for invalid input', () => {
     expect(() => validateEmail('invalid')).toThrow()
   })
   ```

### **❌ DON'T:**

1. **Don't test implementation details**
2. **Don't write tests that depend on each other**
3. **Don't mock everything** (test real interactions when possible)
4. **Don't skip cleanup** (always use afterEach)
5. **Don't ignore flaky tests** (fix or remove them)

---

## 🔄 **CI/CD INTEGRATION**

### **GitHub Actions**

**File:** `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      
      - name: Run E2E tests
        run: npx playwright install && npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### **Pre-commit Hooks**

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
npm run test:unit
```

---

## 📊 **COVERAGE**

### **View Coverage Report**

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### **Coverage Thresholds**

Currently set to 70%:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

To adjust, edit `jest.config.js`:
```javascript
coverageThresholds: {
  global: {
    branches: 80,  // Increase to 80%
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

---

## 🎯 **TESTING STRATEGY**

### **What to Test:**

**High Priority:**
- Feature flags (core infrastructure)
- Offline queue (data integrity)
- Event creation/editing (business logic)
- Vision API integration (external dependency)
- AI chat (core feature)

**Medium Priority:**
- UI components
- Form validation
- Navigation
- Authentication

**Low Priority:**
- Styling
- Animations
- Static content

### **Test Pyramid:**

```
      /\
     /E2E\      ← Few (10-20 tests)
    /------\
   /  Integ \   ← Some (50-100 tests)
  /----------\
 /    Unit    \ ← Many (200+ tests)
/--------------\
```

---

## 🐛 **DEBUGGING TESTS**

### **Debug Single Test**

```bash
node --inspect-brk node_modules/.bin/jest tests/unit/lib/features.test.ts
```

### **Playwright Debug Mode**

```bash
npx playwright test --debug
```

### **Verbose Output**

```bash
npm test -- --verbose
```

### **No Cache**

```bash
npm test -- --no-cache
```

---

## 📝 **CHECKLIST**

### **Before Committing:**
- [ ] All tests pass
- [ ] Coverage above threshold
- [ ] No console errors/warnings
- [ ] Tests run in CI

### **For New Features:**
- [ ] Unit tests for business logic
- [ ] Integration tests for API routes
- [ ] E2E test for critical user flow
- [ ] Update coverage thresholds if needed

### **For Bug Fixes:**
- [ ] Add test that reproduces bug
- [ ] Verify test fails before fix
- [ ] Verify test passes after fix
- [ ] Add regression test

---

## 📚 **RESOURCES**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

**Status:** ✅ Testing Infrastructure Complete  
**Next:** Monitoring & Logging (Phase 1B.4)
