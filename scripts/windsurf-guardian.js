#!/usr/bin/env node

/**
 * WINDSURF GUARDIAN - CONTINUOUS PROTECTION
 * Runs every 2 seconds to immediately fix numbered files
 * Nuclear option to defeat Windsurf's persistent file numbering
 */

const fs = require('fs')
const path = require('path')

class WindsurfGuardian {
  constructor() {
    this.stableDir = path.join(process.cwd(), '.stable')
    this.isRunning = false
    this.fixCount = 0
  }

  log(message) {
    const timestamp = new Date().toTimeString().split(' ')[0]
    console.log(`🛡️  [${timestamp}] ${message}`)
  }

  // Fix numbered files immediately
  fixNumberedFiles() {
    const pagesDir = path.join(process.cwd(), 'pages')
    let fixed = 0

    try {
      const files = fs.readdirSync(pagesDir)
      
      for (const file of files) {
        // Match numbered files like "garage 5.tsx", "onboard 2.tsx"
        const match = file.match(/^(.+)\s+\d+(\.[^.]+)$/)
        
        if (match) {
          const baseName = match[1]
          const ext = match[2]
          const correctName = baseName + ext
          const numberedPath = path.join(pagesDir, file)
          const correctPath = path.join(pagesDir, correctName)
          const stableName = `pages_${correctName.replace(/[\/\\]/g, '_')}`
          const stablePath = path.join(this.stableDir, stableName)
          
          this.log(`🚨 FOUND NUMBERED FILE: ${file}`)
          
          try {
            // Remove the numbered file
            fs.unlinkSync(numberedPath)
            this.log(`🗑️  Removed: ${file}`)
            
            // Recreate correct symlink if it doesn't exist
            if (!fs.existsSync(correctPath)) {
              if (fs.existsSync(stablePath)) {
                fs.symlinkSync(stablePath, correctPath)
                this.log(`🔗 Restored symlink: ${correctName}`)
              }
            }
            
            fixed++
            this.fixCount++
          } catch (error) {
            this.log(`❌ Failed to fix ${file}: ${error.message}`)
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return fixed
  }

  // Start continuous guardian
  start() {
    if (this.isRunning) {
      this.log('⚠️  Guardian already running')
      return
    }

    this.isRunning = true
    this.log('🚀 WINDSURF GUARDIAN STARTED - Continuous protection active')
    this.log('🔍 Monitoring every 2 seconds for numbered files...')

    const guardianInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(guardianInterval)
        return
      }

      const fixed = this.fixNumberedFiles()
      if (fixed > 0) {
        this.log(`⚡ Fixed ${fixed} numbered files (Total: ${this.fixCount})`)
      }
    }, 2000) // Check every 2 seconds

    // Log status every 30 seconds
    const statusInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(statusInterval)
        return
      }
      
      this.log(`📊 Guardian active - ${this.fixCount} files fixed so far`)
    }, 30000)
  }

  stop() {
    this.isRunning = false
    this.log(`🛑 Guardian stopped - Fixed ${this.fixCount} files total`)
  }
}

// CLI usage
if (require.main === module) {
  const guardian = new WindsurfGuardian()
  
  process.on('SIGINT', () => {
    guardian.stop()
    process.exit(0)
  })
  
  guardian.start()
}

module.exports = WindsurfGuardian
