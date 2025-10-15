#!/usr/bin/env node
/**
 * Route Protection Script
 * Automatically wraps API routes with withTenantIsolation middleware
 */

const fs = require('fs')
const path = require('path')

// Priority 1: User Data Routes (15 routes)
const PRIORITY_1_ROUTES = [
  'pages/api/vehicles/[id]/update.ts',
  'pages/api/vehicles/[id]/delete.ts',
  'pages/api/vehicles/[id]/images.ts',
  'pages/api/vehicles/[id]/photos/process.ts',
  'pages/api/vehicles/[id]/photos/upload-temp.ts',
  'pages/api/vehicles/[id]/photos/upload.ts',
  'pages/api/vehicles/[id]/mileage.ts',
  'pages/api/vehicles/[id]/maintenance-preferences.ts',
  'pages/api/vehicles/[id]/specs/index.ts',
  'pages/api/vehicles/[id]/specs/enhance.ts',
  'pages/api/vehicles/[id]/specs/enhance-ai.ts',
  'pages/api/vehicles/[id]/specs/update-category.ts',
  'pages/api/vehicles/[id]/timeline/[eventId].ts',
  'pages/api/vehicles/list.ts',
  'pages/api/vehicles/decode-vin.ts',
]

// Priority 2: Event Routes (10 routes)
const PRIORITY_2_ROUTES = [
  'pages/api/events/[id].ts',
  'pages/api/events/[id]/delete.ts',
  'pages/api/events/[id]/edit.ts',
  'pages/api/events/[id]/restore.ts',
  'pages/api/events/[id]/weather.ts',
  'pages/api/events/[id]/geocode.ts',
  'pages/api/events/[id]/related.ts',
  'pages/api/vehicles/[id]/events/[eventId].ts',
  'pages/api/vehicles/[id]/events/[eventId]/correct.ts',
  'pages/api/vehicles/[id]/move.ts',
]

// Priority 3: Vision/VIN Routes (5 routes)
const PRIORITY_3_ROUTES = [
  'pages/api/vision/process.ts',
  'pages/api/vin/decodeVin.ts',
  'pages/api/vin/extractVin.ts',
  'pages/api/vin/scanVin.ts',
  'pages/api/ocr/extract-vin.ts',
]

function protectRoute(routePath) {
  const fullPath = path.join(process.cwd(), routePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  SKIP: ${routePath} (file not found)`)
    return { status: 'skipped', reason: 'not found' }
  }
  
  let content = fs.readFileSync(fullPath, 'utf8')
  
  // Already protected?
  if (content.includes('withTenantIsolation')) {
    console.log(`✅ ALREADY PROTECTED: ${routePath}`)
    return { status: 'already_protected' }
  }
  
  // Add import if missing
  if (!content.includes("from '@/lib/middleware/tenant-context'")) {
    const importLine = "import { withTenantIsolation } from '@/lib/middleware/tenant-context'\n"
    
    // Find first import and add after it
    const firstImportMatch = content.match(/^import .+$/m)
    if (firstImportMatch) {
      const insertPos = firstImportMatch.index + firstImportMatch[0].length
      content = content.slice(0, insertPos) + '\n' + importLine + content.slice(insertPos)
    } else {
      // No imports, add at top
      content = importLine + '\n' + content
    }
  }
  
  // Find and wrap the handler
  // Pattern 1: export default async function handler
  if (content.match(/export default async function handler/)) {
    content = content.replace(
      /export default async function handler/,
      'async function handler'
    )
    content += '\n\nexport default withTenantIsolation(handler)\n'
  }
  // Pattern 2: export default function handler
  else if (content.match(/export default function handler/)) {
    content = content.replace(
      /export default function handler/,
      'function handler'
    )
    content += '\n\nexport default withTenantIsolation(handler)\n'
  }
  // Pattern 3: const handler = ... export default handler
  else if (content.match(/export default handler/)) {
    content = content.replace(
      /export default handler/,
      'export default withTenantIsolation(handler)'
    )
  }
  else {
    console.log(`⚠️  MANUAL FIX NEEDED: ${routePath} (unknown export pattern)`)
    return { status: 'manual_fix_needed', reason: 'unknown export pattern' }
  }
  
  // Remove mock users
  content = content.replace(/const mockUserId = ['"]temp-user-id['"]/g, '// Removed mock user')
  content = content.replace(/const mockUserId = .+$/gm, '// Removed mock user')
  
  // Write back
  fs.writeFileSync(fullPath, content, 'utf8')
  console.log(`🔒 PROTECTED: ${routePath}`)
  return { status: 'protected' }
}

function protectBatch(routes, batchName) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`📦 ${batchName}`)
  console.log('='.repeat(80))
  
  const results = {
    protected: 0,
    already_protected: 0,
    skipped: 0,
    manual_fix: 0
  }
  
  for (const route of routes) {
    const result = protectRoute(route)
    if (result.status === 'protected') results.protected++
    else if (result.status === 'already_protected') results.already_protected++
    else if (result.status === 'skipped') results.skipped++
    else if (result.status === 'manual_fix_needed') results.manual_fix++
  }
  
  console.log(`\n📊 ${batchName} Summary:`)
  console.log(`  Protected: ${results.protected}`)
  console.log(`  Already Protected: ${results.already_protected}`)
  console.log(`  Skipped: ${results.skipped}`)
  console.log(`  Manual Fix Needed: ${results.manual_fix}`)
  
  return results
}

// Execute
console.log('\n🚀 ROUTE PROTECTION SCRIPT - STARTING\n')

const p1 = protectBatch(PRIORITY_1_ROUTES, 'PRIORITY 1: User Data Routes (15 routes)')
const p2 = protectBatch(PRIORITY_2_ROUTES, 'PRIORITY 2: Event Routes (10 routes)')
const p3 = protectBatch(PRIORITY_3_ROUTES, 'PRIORITY 3: Vision/VIN Routes (5 routes)')

console.log(`\n${'='.repeat(80)}`)
console.log('🎯 TOTAL SUMMARY')
console.log('='.repeat(80))
console.log(`  Total Routes Targeted: 30`)
console.log(`  Protected: ${p1.protected + p2.protected + p3.protected}`)
console.log(`  Already Protected: ${p1.already_protected + p2.already_protected + p3.already_protected}`)
console.log(`  Skipped: ${p1.skipped + p2.skipped + p3.skipped}`)
console.log(`  Manual Fix Needed: ${p1.manual_fix + p2.manual_fix + p3.manual_fix}`)
console.log('\n✅ DAY 1 MORNING: COMPLETE\n')
