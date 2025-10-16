#!/usr/bin/env node

/**
 * WINDSURF FILE NUMBERING PROTECTION
 * Creates stable symlinks to bypass Windsurf's file numbering bug
 */

const fs = require('fs')
const path = require('path')

const PROTECTED_FILES = [
  'pages/garage.tsx',
  'pages/onboard.tsx', 
  'pages/api/vehicles.ts',
  'pages/api/upload-vehicle-photo.ts',
  'pages/api/upload.ts',
  'components/vehicle/VehicleRow.tsx'
]

class WindsurfProtection {
  constructor() {
    this.stableDir = path.join(process.cwd(), '.stable')
    this.ensureStableDir()
  }

  ensureStableDir() {
    if (!fs.existsSync(this.stableDir)) {
      fs.mkdirSync(this.stableDir, { recursive: true })
      console.log('📁 Created .stable directory')
    }
  }

  log(message) {
    console.log(`🛡️  ${message}`)
  }

  // Create stable version of a file
  protectFile(filePath) {
    const fullPath = path.join(process.cwd(), filePath)
    const stableName = filePath.replace(/[\/\\]/g, '_')
    const stablePath = path.join(this.stableDir, stableName)
    
    // Find the actual file (might be numbered)
    const dir = path.dirname(fullPath)
    const baseName = path.basename(fullPath, path.extname(fullPath))
    const ext = path.extname(fullPath)
    
    let sourceFile = null
    
    // Check for exact file
    if (fs.existsSync(fullPath)) {
      sourceFile = fullPath
    } else {
      // Look for numbered versions
      try {
        const files = fs.readdirSync(dir)
        const numberedFile = files.find(f => {
          const match = f.match(new RegExp(`^${baseName}\\s+\\d+${ext.replace('.', '\\.')}$`))
          return match
        })
        
        if (numberedFile) {
          sourceFile = path.join(dir, numberedFile)
          this.log(`Found numbered file: ${numberedFile}`)
        }
      } catch (error) {
        // Directory might not exist
      }
    }
    
    if (sourceFile) {
      // Copy to stable location
      fs.copyFileSync(sourceFile, stablePath)
      
      // Remove original (numbered) file
      if (sourceFile !== fullPath) {
        fs.unlinkSync(sourceFile)
        this.log(`Removed numbered file: ${path.basename(sourceFile)}`)
      } else if (fs.lstatSync(fullPath).isSymbolicLink()) {
        // Don't remove if it's already our symlink
        return
      } else {
        fs.unlinkSync(fullPath)
      }
      
      // Create symlink
      fs.symlinkSync(stablePath, fullPath)
      this.log(`Protected: ${filePath} → .stable/${stableName}`)
    } else {
      this.log(`⚠️  File not found: ${filePath}`)
    }
  }

  // Protect all critical files
  protectAll() {
    this.log('🚀 Starting Windsurf protection...')
    
    for (const filePath of PROTECTED_FILES) {
      try {
        this.protectFile(filePath)
      } catch (error) {
        this.log(`❌ Failed to protect ${filePath}: ${error.message}`)
      }
    }
    
    this.log('✅ Protection complete!')
  }

  // Check if files are still protected
  checkProtection() {
    let allProtected = true
    
    for (const filePath of PROTECTED_FILES) {
      const fullPath = path.join(process.cwd(), filePath)
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.lstatSync(fullPath)
        if (stats.isSymbolicLink()) {
          this.log(`✅ ${filePath} - Protected`)
        } else {
          this.log(`⚠️  ${filePath} - Not protected (regular file)`)
          allProtected = false
        }
      } else {
        this.log(`❌ ${filePath} - Missing`)
        allProtected = false
      }
    }
    
    return allProtected
  }
}

// CLI usage
if (require.main === module) {
  const protection = new WindsurfProtection()
  
  const command = process.argv[2]
  
  switch (command) {
    case 'protect':
      protection.protectAll()
      break
    case 'check':
      protection.checkProtection()
      break
    default:
      console.log('Usage: node windsurf-protection.js [protect|check]')
      console.log('  protect - Create symlinks to protect files from numbering')
      console.log('  check   - Verify protection status')
  }
}

module.exports = WindsurfProtection
