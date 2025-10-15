#!/usr/bin/env node
/**
 * Auth Audit Script
 * Scans all API routes and identifies auth status
 */

const fs = require('fs')
const path = require('path')

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const relativePath = filePath.replace(process.cwd(), '')

  // Check for protection patterns
  if (content.includes('withTenantIsolation')) {
    return { file: relativePath, status: 'protected', pattern: 'withTenantIsolation' }
  }

  // Check for mock patterns
  if (content.includes('mockUserId') || content.includes('temp-user-id')) {
    return { file: relativePath, status: 'mock_user', pattern: 'mockUserId/temp-user-id' }
  }

  // Check for hardcoded tenant
  if (content.match(/tenantId\s*=\s*['"][0-9a-f-]{36}['"]/)) {
    return { file: relativePath, status: 'hardcoded_tenant', pattern: 'hardcoded UUID' }
  }

  // Check for getServerSession (manual auth)
  if (content.includes('getServerSession') && content.includes('authOptions')) {
    return { file: relativePath, status: 'protected', pattern: 'manual getServerSession' }
  }

  // Check for public routes (health, auth)
  if (relativePath.includes('/auth/') || relativePath.includes('/system/health')) {
    return { file: relativePath, status: 'protected', pattern: 'public endpoint' }
  }

  // No clear auth pattern
  return { file: relativePath, status: 'no_auth' }
}

function scanDirectory(dir) {
  const results = []
  
  const items = fs.readdirSync(dir)
  
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      results.push(...scanDirectory(fullPath))
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      results.push(scanFile(fullPath))
    }
  }
  
  return results
}

// Run audit
const apiDir = path.join(process.cwd(), 'pages/api')
const results = scanDirectory(apiDir)

// Group by status
const grouped = {
  protected: [],
  mock_user: [],
  hardcoded_tenant: [],
  no_auth: [],
  unclear: []
}

results.forEach(r => {
  grouped[r.status].push(r)
})

// Print report
console.log('\n🔒 AUTH AUDIT REPORT\n')
console.log('=' .repeat(80))

console.log(`\n✅ PROTECTED (${grouped.protected.length} routes):`)
grouped.protected.forEach(r => console.log(`  ${r.file} (${r.pattern})`))

console.log(`\n⚠️  MOCK USER (${grouped.mock_user.length} routes):`)
grouped.mock_user.forEach(r => console.log(`  ${r.file}`))

console.log(`\n❌ HARDCODED TENANT (${grouped.hardcoded_tenant.length} routes):`)
grouped.hardcoded_tenant.forEach(r => console.log(`  ${r.file}`))

console.log(`\n🚨 NO AUTH (${grouped.no_auth.length} routes):`)
grouped.no_auth.forEach(r => console.log(`  ${r.file}`))

console.log(`\n❓ UNCLEAR (${grouped.unclear.length} routes):`)
grouped.unclear.forEach(r => console.log(`  ${r.file}`))

// Summary
const vulnerable = grouped.mock_user.length + grouped.hardcoded_tenant.length + grouped.no_auth.length
const total = results.length
const protectedPercent = ((grouped.protected.length / total) * 100).toFixed(1)

console.log('\n' + '='.repeat(80))
console.log(`\n📊 SUMMARY:`)
console.log(`  Total Routes: ${total}`)
console.log(`  Protected: ${grouped.protected.length} (${protectedPercent}%)`)
console.log(`  Vulnerable: ${vulnerable} (${((vulnerable/total)*100).toFixed(1)}%)`)
console.log(`\n⚠️  ${vulnerable} routes need immediate attention!\n`)
