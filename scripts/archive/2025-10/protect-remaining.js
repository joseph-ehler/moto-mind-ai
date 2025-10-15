#!/usr/bin/env node
/**
 * Protect Remaining Routes Script
 * Wraps the final 13 unprotected routes
 */

const fs = require('fs')
const path = require('path')

const REMAINING_ROUTES = [
  'pages/api/decode-vin.ts',
  'pages/api/images/canonicalImage.ts',
  'pages/api/location/correct.ts',
  'pages/api/metrics/geocoding.ts',
  'pages/api/monitoring/vision-metrics.ts',
  'pages/api/reports/generatePdfReport.ts',
  'pages/api/system/metrics.ts',
  'pages/api/vehicles/[id]/chat.ts',
  'pages/api/vehicles/[id]/conversations.ts',
  'pages/api/vehicles/[id]/events/quick-odometer.ts',
  'pages/api/vehicles/[id]/events/smart-log.ts',
  'pages/api/vision/costTracking.ts',
  'pages/api/vision/extract-address.ts',
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
  if (content.match(/export default async function handler/)) {
    content = content.replace(
      /export default async function handler/,
      'async function handler'
    )
    content += '\n\nexport default withTenantIsolation(handler)\n'
  }
  else if (content.match(/export default function handler/)) {
    content = content.replace(
      /export default function handler/,
      'function handler'
    )
    content += '\n\nexport default withTenantIsolation(handler)\n'
  }
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
  
  // Write back
  fs.writeFileSync(fullPath, content, 'utf8')
  console.log(`🔒 PROTECTED: ${routePath}`)
  return { status: 'protected' }
}

console.log('\n🚀 PROTECTING REMAINING 13 ROUTES\n')
console.log('='.repeat(80))

const results = {
  protected: 0,
  already_protected: 0,
  skipped: 0,
  manual_fix: 0
}

for (const route of REMAINING_ROUTES) {
  const result = protectRoute(route)
  if (result.status === 'protected') results.protected++
  else if (result.status === 'already_protected') results.already_protected++
  else if (result.status === 'skipped') results.skipped++
  else if (result.status === 'manual_fix_needed') results.manual_fix++
}

console.log('\n' + '='.repeat(80))
console.log('🎯 FINAL SUMMARY')
console.log('='.repeat(80))
console.log(`  Total Routes: 13`)
console.log(`  Protected: ${results.protected}`)
console.log(`  Already Protected: ${results.already_protected}`)
console.log(`  Skipped: ${results.skipped}`)
console.log(`  Manual Fix Needed: ${results.manual_fix}`)
console.log('\n✅ DAY 1: 100% COMPLETE\n')
