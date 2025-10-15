#!/usr/bin/env node
/**
 * Dead Code Deletion Script
 * Removes debug, demo, and unused routes from production
 */

const fs = require('fs')
const path = require('path')

// Routes to delete - these should NOT be in production
const ROUTES_TO_DELETE = [
  // Debug routes (development only)
  'pages/api/debug/check-fuel-event.ts',
  'pages/api/debug/cleanup-test-fuel.ts',
  
  // Demo routes (seed data, not for production)
  'pages/api/demo/demoReset.ts',
  'pages/api/demo/demoSeed.ts',
  
  // Admin routes (unused or need reimplementation)
  'pages/api/admin/vehicles.ts',
  
  // Old backup files (technical debt)
  'pages/api/vision/process-backup-20250929.ts',
  'pages/api/vision/process-refactored.ts', // Duplicate
  'pages/api/vision/process-json.ts', // Duplicate
  'pages/api/vision/process-batch.ts', // Duplicate
  
  // Hardcoded tenant routes (security issues)
  'pages/api/core/photoUpload.ts', // Has hardcoded demo tenant
  'pages/api/uploads/uploadVehiclePhoto.ts', // Duplicate of protected route
  'pages/api/vehicles/uploadPhoto.ts', // Duplicate of protected route
  'pages/api/system/notifications.ts', // Hardcoded tenant
  'pages/api/system/reminders.ts', // Hardcoded tenant
  
  // Deprecated monitoring routes
  'pages/api/monitoring/simulate-metrics.ts', // Test code
  
  // Deprecated stats route
  'pages/api/vehicles/[id]/stats.ts', // Hardcoded tenant
  
  // Conversation routes (not implemented yet - will reimplement properly)
  'pages/api/conversations/[threadId]/delete.ts',
  'pages/api/conversations/[threadId]/index.ts',
  'pages/api/conversations/[threadId]/messages/[messageId]/approve.ts',
  'pages/api/conversations/[threadId]/messages.ts',
  'pages/api/conversations/messages/[messageId]/feedback.ts',
]

function deleteRoute(routePath) {
  const fullPath = path.join(process.cwd(), routePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⏭️  SKIP: ${routePath} (already deleted or not found)`)
    return { status: 'skipped' }
  }
  
  try {
    fs.unlinkSync(fullPath)
    console.log(`🗑️  DELETED: ${routePath}`)
    return { status: 'deleted' }
  } catch (error) {
    console.error(`❌ FAILED to delete: ${routePath}`, error.message)
    return { status: 'failed', error: error.message }
  }
}

function cleanupEmptyDirs(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath)
  
  if (!fs.existsSync(fullPath)) {
    return
  }
  
  try {
    const items = fs.readdirSync(fullPath)
    
    // If directory is empty, delete it
    if (items.length === 0) {
      fs.rmdirSync(fullPath)
      console.log(`🗑️  DELETED EMPTY DIR: ${dirPath}`)
    }
  } catch (error) {
    // Ignore errors (directory might not be empty or have other issues)
  }
}

// Execute
console.log('\n🚀 DEAD CODE DELETION SCRIPT - STARTING\n')
console.log('='.repeat(80))

const results = {
  deleted: 0,
  skipped: 0,
  failed: 0
}

for (const route of ROUTES_TO_DELETE) {
  const result = deleteRoute(route)
  if (result.status === 'deleted') results.deleted++
  else if (result.status === 'skipped') results.skipped++
  else if (result.status === 'failed') results.failed++
}

// Cleanup empty directories
console.log('\n' + '='.repeat(80))
console.log('🧹 CLEANING UP EMPTY DIRECTORIES\n')

const dirsToCheck = [
  'pages/api/debug',
  'pages/api/demo',
  'pages/api/admin',
  'pages/api/core',
  'pages/api/uploads',
  'pages/api/monitoring',
  'pages/api/conversations/[threadId]/messages/[messageId]',
  'pages/api/conversations/[threadId]/messages',
  'pages/api/conversations/[threadId]',
  'pages/api/conversations/messages/[messageId]',
  'pages/api/conversations/messages',
  'pages/api/conversations',
]

for (const dir of dirsToCheck) {
  cleanupEmptyDirs(dir)
}

console.log('\n' + '='.repeat(80))
console.log('🎯 DELETION SUMMARY')
console.log('='.repeat(80))
console.log(`  Total Routes Targeted: ${ROUTES_TO_DELETE.length}`)
console.log(`  Deleted: ${results.deleted}`)
console.log(`  Skipped (not found): ${results.skipped}`)
console.log(`  Failed: ${results.failed}`)
console.log('\n✅ DAY 1 AFTERNOON: COMPLETE\n')
console.log(`📊 PROGRESS: ${results.deleted} dead routes removed from production`)
