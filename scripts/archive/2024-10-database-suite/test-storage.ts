#!/usr/bin/env ts-node

/**
 * Quick Storage Bucket Test
 * 
 * Usage:
 *   npx ts-node scripts/test-storage.ts
 * 
 * Or add to package.json:
 *   "test:storage": "ts-node scripts/test-storage.ts"
 */

import { testStoragePermissions } from '../lib/test-storage-permissions'

console.log('🚀 Starting Storage Bucket Permission Test\n')
console.log('This will test:')
console.log('  1. Upload file to vehicle-events bucket')
console.log('  2. Get public URL')
console.log('  3. List files')
console.log('  4. Delete file')
console.log('\n' + '='.repeat(50) + '\n')

testStoragePermissions()
  .then((results) => {
    const allPassed = results.every(r => r.passed)
    process.exit(allPassed ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Fatal Error:', error.message)
    process.exit(1)
  })
