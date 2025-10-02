#!/usr/bin/env node
// Fix all import path issues for clean deployment

const fs = require('fs')
const path = require('path')

// Files and their import fixes
const fixes = [
  {
    file: 'pages/api/events/save.ts',
    fixes: [
      { from: "from '@/lib/errors'", to: "from '../../lib/utils/errors'" },
      { from: "from '@/lib/middleware/tenant-context'", to: "from '../../lib/middleware/tenant-context'" }
    ]
  },
  {
    file: 'pages/api/vehicles/index.ts', 
    fixes: [
      { from: "from '@/lib/utils/errors'", to: "from '../../lib/utils/errors'" },
      { from: "from '@/lib/http/envelope'", to: "from '../../lib/utils/http-envelope'" },
      { from: "from '@/lib/domain/types'", to: "from '../../lib/domain/types'" },
      { from: "from '@/lib/middleware/tenant-context'", to: "from '../../lib/middleware/tenant-context'" }
    ]
  },
  {
    file: 'pages/api/vehicles/onboard.ts',
    fixes: [
      { from: "from '@/lib/errors'", to: "from '../../lib/utils/errors'" },
      { from: "from '@/lib/middleware/tenant-context'", to: "from '../../lib/middleware/tenant-context'" }
    ]
  }
]

function fixFile(filePath, fixes) {
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`)
    return
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  let modified = false

  fixes.forEach(fix => {
    if (content.includes(fix.from)) {
      content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to)
      modified = true
      console.log(`✅ Fixed: ${filePath} - ${fix.from} → ${fix.to}`)
    }
  })

  if (modified) {
    fs.writeFileSync(fullPath, content)
  }
}

console.log('🔧 Fixing all import paths...')

fixes.forEach(({ file, fixes: fileFixes }) => {
  fixFile(file, fileFixes)
})

// Also remove the problematic backup file from build
const backupFile = path.join(__dirname, '..', 'pages/api/vision/process-original-backup.ts')
if (fs.existsSync(backupFile)) {
  fs.unlinkSync(backupFile)
  console.log('✅ Removed problematic backup file from build')
}

console.log('✅ All import fixes complete')
