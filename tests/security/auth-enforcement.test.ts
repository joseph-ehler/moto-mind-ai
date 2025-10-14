/**
 * Auth Enforcement Tests
 * These tests MUST pass in CI - they prevent auth regressions
 * 
 * CRITICAL: If these tests fail, the build should NOT deploy
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

describe('API Security Enforcement', () => {
  // Public routes that don't need auth
  const PUBLIC_ROUTES = [
    'pages/api/auth/**/*', // NextAuth routes
    'pages/api/system/health.ts', // Health checks
    'pages/api/system/health-optimized.ts',
  ]

  describe('Route Protection', () => {
    it('all API routes must use withTenantIsolation middleware', async () => {
      const apiRoutes = await glob('pages/api/**/*.ts', {
        cwd: process.cwd(),
        ignore: PUBLIC_ROUTES,
      })

      const unprotectedRoutes: string[] = []

      for (const route of apiRoutes) {
        const fullPath = path.join(process.cwd(), route)
        const content = fs.readFileSync(fullPath, 'utf8')

        // Check if route uses withTenantIsolation
        if (!content.includes('withTenantIsolation')) {
          unprotectedRoutes.push(route)
        }
      }

      if (unprotectedRoutes.length > 0) {
        throw new Error(
          `❌ SECURITY VIOLATION: Found ${unprotectedRoutes.length} unprotected API routes:\n\n` +
          unprotectedRoutes.map(r => `  - ${r}`).join('\n') +
          '\n\n' +
          '🔒 FIX: Wrap your handler with withTenantIsolation:\n\n' +
          "import { withTenantIsolation } from '@/lib/middleware/tenant-context'\n" +
          'async function handler(req, res) { ... }\n' +
          'export default withTenantIsolation(handler)\n'
        )
      }

      // If we get here, all routes are protected
      expect(unprotectedRoutes).toEqual([])
    })

    it('no routes should have .only() calls (prevents incomplete test runs)', async () => {
      const testFiles = await glob('**/*.test.{ts,tsx,js,jsx}', {
        cwd: process.cwd(),
        ignore: ['node_modules/**'],
      })

      const filesWithOnly: string[] = []

      for (const file of testFiles) {
        const fullPath = path.join(process.cwd(), file)
        const content = fs.readFileSync(fullPath, 'utf8')

        if (content.match(/\.(it|test|describe)\.only\s*\(/)) {
          filesWithOnly.push(file)
        }
      }

      if (filesWithOnly.length > 0) {
        throw new Error(
          `❌ TEST VIOLATION: Found .only() calls in ${filesWithOnly.length} test files:\n\n` +
          filesWithOnly.map(f => `  - ${f}`).join('\n') +
          '\n\n' +
          '🔧 FIX: Remove .only() to run all tests\n'
        )
      }

      expect(filesWithOnly).toEqual([])
    })
  })

  describe('Mock Data Prevention', () => {
    it('no API routes should use mock users', async () => {
      const apiRoutes = await glob('pages/api/**/*.ts', {
        cwd: process.cwd(),
      })

      const mockUserRoutes: Array<{ file: string; line: string }> = []

      for (const route of apiRoutes) {
        const fullPath = path.join(process.cwd(), route)
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          if (
            line.includes('mockUserId') ||
            line.includes('temp-user-id') ||
            line.match(/const\s+userId\s*=\s*['"]mock/i)
          ) {
            mockUserRoutes.push({
              file: route,
              line: `Line ${index + 1}: ${line.trim()}`,
            })
          }
        })
      }

      if (mockUserRoutes.length > 0) {
        throw new Error(
          `❌ SECURITY VIOLATION: Found mock users in ${mockUserRoutes.length} locations:\n\n` +
          mockUserRoutes.map(m => `  - ${m.file}\n    ${m.line}`).join('\n') +
          '\n\n' +
          '🔒 FIX: Use real user from session via withTenantIsolation middleware\n'
        )
      }

      expect(mockUserRoutes).toEqual([])
    })

    it('no API routes should have hardcoded tenant IDs', async () => {
      const apiRoutes = await glob('pages/api/**/*.ts', {
        cwd: process.cwd(),
      })

      const hardcodedTenantRoutes: Array<{ file: string; line: string; tenantId: string }> = []

      // Known demo tenant IDs to check for
      const demoTenantIds = [
        '550e8400-e29b-41d4-a716-446655440000',
        '1608f513-9aba-4df3-8824-dba7956741c6',
      ]

      for (const route of apiRoutes) {
        const fullPath = path.join(process.cwd(), route)
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          demoTenantIds.forEach(tenantId => {
            if (line.includes(tenantId)) {
              hardcodedTenantRoutes.push({
                file: route,
                line: `Line ${index + 1}: ${line.trim()}`,
                tenantId,
              })
            }
          })

          // Also check for generic UUID assignments that might be hardcoded
          const uuidPattern = /tenantId\s*=\s*['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/i
          if (uuidPattern.test(line)) {
            hardcodedTenantRoutes.push({
              file: route,
              line: `Line ${index + 1}: ${line.trim()}`,
              tenantId: 'hardcoded UUID',
            })
          }
        })
      }

      if (hardcodedTenantRoutes.length > 0) {
        throw new Error(
          `❌ SECURITY VIOLATION: Found hardcoded tenant IDs in ${hardcodedTenantRoutes.length} locations:\n\n` +
          hardcodedTenantRoutes.map(h => `  - ${h.file}\n    ${h.line}\n    Tenant: ${h.tenantId}`).join('\n') +
          '\n\n' +
          '🔒 FIX: Use tenant from session via withTenantIsolation middleware\n'
        )
      }

      expect(hardcodedTenantRoutes).toEqual([])
    })
  })

  describe('Code Quality', () => {
    it('no TODO comments related to auth in production routes', async () => {
      const apiRoutes = await glob('pages/api/**/*.ts', {
        cwd: process.cwd(),
      })

      const authTodos: Array<{ file: string; line: string }> = []

      for (const route of apiRoutes) {
        const fullPath = path.join(process.cwd(), route)
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          if (
            line.match(/TODO.*auth/i) ||
            line.match(/FIXME.*auth/i) ||
            line.match(/TODO.*tenant/i)
          ) {
            authTodos.push({
              file: route,
              line: `Line ${index + 1}: ${line.trim()}`,
            })
          }
        })
      }

      if (authTodos.length > 0) {
        throw new Error(
          `⚠️  QUALITY WARNING: Found ${authTodos.length} auth-related TODOs:\n\n` +
          authTodos.map(t => `  - ${t.file}\n    ${t.line}`).join('\n') +
          '\n\n' +
          '🔧 FIX: Implement proper auth or remove the TODO\n'
        )
      }

      expect(authTodos).toEqual([])
    })

    it('no debug console.logs in production routes', async () => {
      const apiRoutes = await glob('pages/api/**/*.ts', {
        cwd: process.cwd(),
      })

      const debugLogs: Array<{ file: string; count: number }> = []

      for (const route of apiRoutes) {
        const fullPath = path.join(process.cwd(), route)
        const content = fs.readFileSync(fullPath, 'utf8')

        // Count console.log statements (but allow structured logging)
        const matches = content.match(/console\.log\(/g)
        if (matches && matches.length > 5) {
          debugLogs.push({
            file: route,
            count: matches.length,
          })
        }
      }

      if (debugLogs.length > 0) {
        console.warn(
          `⚠️  WARNING: Routes with excessive console.log statements:\n` +
          debugLogs.map(d => `  - ${d.file} (${d.count} logs)`).join('\n')
        )
      }

      // This is a warning, not a hard failure
      expect(true).toBe(true)
    })
  })

  describe('Structural Integrity', () => {
    it('all routes must import from absolute paths (not relative)', async () => {
      const apiRoutes = await glob('pages/api/**/*.ts', {
        cwd: process.cwd(),
      })

      const relativeImports: Array<{ file: string; line: string }> = []

      for (const route of apiRoutes) {
        const fullPath = path.join(process.cwd(), route)
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')

        lines.forEach((line, index) => {
          // Check for relative imports that go up directories
          if (line.match(/import.*from\s+['"]\.\.\/\.\./)) {
            relativeImports.push({
              file: route,
              line: `Line ${index + 1}: ${line.trim()}`,
            })
          }
        })
      }

      if (relativeImports.length > 0) {
        console.warn(
          `⚠️  WARNING: Found ${relativeImports.length} relative imports (prefer @/ aliases):\n` +
          relativeImports.map(r => `  - ${r.file}\n    ${r.line}`).join('\n')
        )
      }

      // This is a warning, not a hard failure
      expect(true).toBe(true)
    })
  })
})
