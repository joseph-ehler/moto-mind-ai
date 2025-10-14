# Integration Tests - Enterprise Grade

## Overview

These tests validate the **complete auth stack** including:
- NextAuth session management
- Tenant isolation middleware
- Cross-tenant access prevention
- API route protection
- Session validation
- Data leakage prevention

**These tests use a real database and make actual API calls.**

---

## Prerequisites

### 1. Database Setup

Integration tests require a **test database**. Options:

#### Option A: Local Supabase (Recommended)
```bash
# Start local Supabase
npx supabase start

# Runs on http://localhost:54321
```

#### Option B: Dedicated Test Database
Create a separate Supabase project for testing:
1. Go to supabase.com
2. Create new project: "motomind-test"
3. Get credentials from Settings → API

### 2. Environment Variables

Create `.env.test.local`:

```bash
# Test Database
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # or your test DB URL
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth (can use same as dev)
NEXTAUTH_SECRET=your-test-secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Schema

Ensure your test database has the latest schema:

```bash
# Run migrations on test DB
npm run db:migrate
```

---

## Running Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Test File
```bash
npm test tests/integration/api-tenant-isolation.test.ts
```

### Watch Mode (Development)
```bash
npm run test:integration:watch
```

### CI Mode
```bash
npm run test:integration:ci
```

---

## Test Structure

### Test Fixtures

Each test suite creates isolated test data:
- **2 Tenants** (tenant1, tenant2)
- **2 Users** (user1 → tenant1, user2 → tenant2)
- **2 Vehicles** (vehicle1 → tenant1, vehicle2 → tenant2)

### Cleanup

All test data is automatically cleaned up in `afterAll()`:
```typescript
afterAll(async () => {
  await testDb.cleanup()
})
```

---

## Test Categories

### 1. Unauthenticated Access
Tests that requests without sessions are rejected.

**Expected:** All requests return `401 Unauthorized`

```typescript
it('rejects requests without session', async () => {
  // Mock no session
  (getServerSession as jest.Mock).mockResolvedValue(null)
  
  // Make request
  await handler(req, res)
  
  // Verify rejection
  expect(res._getStatusCode()).toBe(401)
})
```

### 2. Cross-Tenant Access Prevention
Tests that User A cannot access User B's data.

**Expected:** Cross-tenant requests return `403 Forbidden` or `404 Not Found`

```typescript
it('user 1 cannot see user 2 vehicles', async () => {
  // Mock user 1 session
  mockSession(user1)
  
  // Try to access user 2's vehicle
  await handler({ query: { id: vehicle2.id } })
  
  // Verify rejection
  expect([403, 404]).toContain(res._getStatusCode())
})
```

### 3. Same-Tenant Access (Authorized)
Tests that users CAN access their own tenant's data.

**Expected:** Same-tenant requests succeed with `200 OK`

```typescript
it('user 1 CAN see own vehicles', async () => {
  mockSession(user1)
  
  await handler({ query: { id: vehicle1.id } })
  
  expect(res._getStatusCode()).toBe(200)
})
```

### 4. Session Validation
Tests proper session validation logic.

**Expected:** Invalid sessions are rejected

```typescript
it('rejects session without tenantId', async () => {
  mockSession({ email: user1.email, role: 'owner' })
  // Missing tenantId!
  
  await handler(req, res)
  
  expect(res._getStatusCode()).toBe(401)
})
```

### 5. Data Leakage Prevention
Tests that error messages don't reveal sensitive info.

**Expected:** Errors don't expose tenant IDs or cross-tenant data existence

```typescript
it('error messages do not leak tenant information', async () => {
  mockSession(user1)
  
  // Try to access tenant 2's vehicle
  await handler({ query: { id: vehicle2.id } })
  
  const error = JSON.parse(res._getData()).error
  
  // Should not reveal tenant info
  expect(error).not.toContain('tenant')
  expect(error).not.toContain(tenant2.id)
})
```

---

## Writing New Tests

### Basic Pattern

```typescript
import { TestDatabase, createMockSession } from '../utils/test-database'

describe('My New Test Suite', () => {
  const testDb = new TestDatabase()
  let tenant, user, vehicle

  beforeAll(async () => {
    // Create test data
    tenant = await testDb.createTenant()
    user = await testDb.createUser(tenant.id)
    vehicle = await testDb.createVehicle(tenant.id)
  })

  afterAll(async () => {
    // Cleanup
    await testDb.cleanup()
  })

  it('tests something', async () => {
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue(
      createMockSession(user)
    )

    // Test your API
    const handler = (await import('@/pages/api/your-route')).default
    const { req, res } = createMocks({ method: 'GET' })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
  })
})
```

### Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Data**: Always cleanup in `afterAll()`
3. **Mock Sessions**: Use `createMockSession()` helper
4. **Test Both Sides**: Test both success and failure cases
5. **Real Database**: Integration tests should use real DB (not mocks)

---

## Troubleshooting

### Tests Failing with "Database not found"
- Ensure test database is running
- Check `.env.test.local` credentials
- Verify schema is up to date: `npm run db:migrate`

### Tests Failing with "Table does not exist"
- Run migrations on test database
- Check that test database has all tables

### Cleanup Errors
- Tests may fail to cleanup if database is in use
- Stop tests and manually clean test data:
  ```sql
  DELETE FROM vehicle_events WHERE tenant_id LIKE 'test%';
  DELETE FROM vehicles WHERE vin LIKE 'TEST%';
  DELETE FROM user_tenants WHERE user_id LIKE 'test%';
  DELETE FROM tenants WHERE name LIKE 'Test Tenant%';
  ```

### Slow Tests
- Integration tests are slower than unit tests (expected)
- Use `test:integration:watch` for faster feedback during development
- Run full suite in CI only

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: supabase/postgres:latest
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
      
      - name: Run integration tests
        run: npm run test:integration:ci
        env:
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SERVICE_ROLE_KEY }}
```

---

## Coverage Goals

**Target:** 90%+ coverage on critical paths

### Critical Paths (Must Cover)
- ✅ Unauthenticated rejection
- ✅ Cross-tenant access prevention
- ✅ Same-tenant access authorization
- ✅ Session validation
- ✅ Data leakage prevention

### Nice to Have
- Role-based access control (owner vs member vs viewer)
- Concurrent request handling
- Session expiry handling
- Rate limiting

---

## Performance Benchmarks

Integration tests should complete in:
- **< 30 seconds** for full suite
- **< 5 seconds** per test file
- **< 500ms** per individual test

If tests are slower:
1. Check database connection
2. Reduce test data volume
3. Optimize cleanup logic
4. Consider test parallelization

---

## Security Considerations

### Test Data
- All test data uses prefix "TEST" or "test-"
- Easy to identify and clean up
- Never uses real user data

### Test Credentials
- Use dedicated test database
- Never test against production
- Rotate test credentials regularly

### Sensitive Data
- No real API keys in tests
- No real user emails
- No real credit card numbers

---

## Next Steps

After passing integration tests:
1. ✅ Run security enforcement tests
2. ✅ Run integration tests
3. ⏭️ Deploy to staging
4. ⏭️ Run smoke tests
5. ⏭️ Deploy to production

---

## Support

**Questions?** Check:
- Main README: `/README.md`
- Auth docs: `/lib/auth/README.md`
- Security tests: `/tests/security/README.md`
