#!/usr/bin/env node
// Quick script to fix import paths for deployment

const fs = require('fs')
const path = require('path')

const importFixes = [
  {
    from: "from '@/lib/errors'",
    to: "from '../../lib/utils/errors'"
  },
  {
    from: "from '@/lib/http/envelope'",
    to: "from '../../lib/utils/http-envelope'"
  },
  {
    from: "from '../../lib/clients/api-usage-tracker'",
    to: "// from '../../lib/clients/api-usage-tracker' // Commented out for deployment"
  },
  {
    from: "from '../../scripts/seed-smartphone'",
    to: "// from '../../scripts/seed-smartphone' // Commented out for deployment"
  }
]

function fixImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`)
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  importFixes.forEach(fix => {
    if (content.includes(fix.from)) {
      content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to)
      modified = true
      console.log(`Fixed import in ${filePath}: ${fix.from} -> ${fix.to}`)
    }
  })

  if (modified) {
    fs.writeFileSync(filePath, content)
  }
}

// Files that need import fixes
const filesToFix = [
  'pages/api/events/save.ts',
  'pages/api/vehicles/onboard.ts', 
  'pages/api/vehicles/index.ts',
  'pages/api/demo/demoSeed.ts',
  'pages/api/vin/extractVin.ts'
]

console.log('🔧 Fixing import paths for deployment...')

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, '..', file)
  fixImportsInFile(fullPath)
})

console.log('✅ Import fixes complete')
