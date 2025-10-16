#!/usr/bin/env node

/**
 * BULLETPROOF FILE HEALER
 * Automatically detects and fixes the file numbering bug
 * Runs continuously to protect the entire codebase
 */

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const WATCH_DIRECTORIES = [
  'pages',
  'components', 
  'lib',
  'utils',
  'hooks'
]

const CRITICAL_FILES = [
  'pages/garage.tsx',
  'pages/onboard.tsx',
  'pages/api/vehicles.ts',
  'pages/api/upload-vehicle-photo.ts',
  'components/vehicle/VehicleRow.tsx'
]

class FileHealer {
  constructor() {
    this.healingLog = []
    this.isRunning = false
  }

  log(message) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(`🔧 ${logEntry}`)
    this.healingLog.push(logEntry)
  }

  // Detect numbered files (e.g., "garage 3.tsx", "upload-vehicle-photo 2.ts")
  findNumberedFiles(directory) {
    const numberedFiles = []
    
    try {
      const items = fs.readdirSync(directory, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = path.join(directory, item.name)
        
        if (item.isDirectory()) {
          // Recursively check subdirectories
          numberedFiles.push(...this.findNumberedFiles(fullPath))
        } else if (item.isFile()) {
          // Check if filename has numbers (e.g., "garage 3.tsx")
          const numberedPattern = /^(.+)\s+\d+(\.[^.]+)$/
          const match = item.name.match(numberedPattern)
          
          if (match) {
            const originalName = match[1] + match[2]
            const originalPath = path.join(directory, originalName)
            
            numberedFiles.push({
              numberedPath: fullPath,
              originalPath: originalPath,
              numberedName: item.name,
              originalName: originalName
            })
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }
    
    return numberedFiles
  }

  // Heal a numbered file by renaming it back
  async healFile(fileInfo) {
    try {
      // Check if original file already exists
      if (fs.existsSync(fileInfo.originalPath)) {
        this.log(`⚠️  Original file exists: ${fileInfo.originalName}, backing up numbered version`)
        
        // Move numbered file to backup
        const backupPath = fileInfo.numberedPath + '.backup'
        fs.renameSync(fileInfo.numberedPath, backupPath)
        this.log(`📦 Backed up: ${fileInfo.numberedName} → ${path.basename(backupPath)}`)
      } else {
        // Safe to rename numbered file back to original
        fs.renameSync(fileInfo.numberedPath, fileInfo.originalPath)
        this.log(`✅ HEALED: ${fileInfo.numberedName} → ${fileInfo.originalName}`)
      }
    } catch (error) {
      this.log(`❌ Failed to heal ${fileInfo.numberedName}: ${error.message}`)
    }
  }

  // Create backup copies of critical files
  backupCriticalFiles() {
    const backupDir = path.join(process.cwd(), '.file-backups')
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    for (const filePath of CRITICAL_FILES) {
      const fullPath = path.join(process.cwd(), filePath)
      
      if (fs.existsSync(fullPath)) {
        const backupPath = path.join(backupDir, filePath.replace(/\//g, '_'))
        fs.copyFileSync(fullPath, backupPath)
        this.log(`📦 Backed up: ${filePath}`)
      }
    }
  }

  // Single healing scan
  async healScan() {
    let totalHealed = 0
    
    for (const directory of WATCH_DIRECTORIES) {
      const dirPath = path.join(process.cwd(), directory)
      
      if (fs.existsSync(dirPath)) {
        const numberedFiles = this.findNumberedFiles(dirPath)
        
        for (const fileInfo of numberedFiles) {
          await this.healFile(fileInfo)
          totalHealed++
        }
      }
    }
    
    if (totalHealed > 0) {
      this.log(`🎯 Healing complete: ${totalHealed} files restored`)
    }
    
    return totalHealed
  }

  // Start continuous monitoring
  async startHealing() {
    if (this.isRunning) {
      this.log('⚠️  Healer already running')
      return
    }

    this.isRunning = true
    this.log('🚀 BULLETPROOF FILE HEALER STARTED')
    this.log(`📁 Monitoring directories: ${WATCH_DIRECTORIES.join(', ')}`)
    
    // Initial backup
    this.backupCriticalFiles()
    
    // Initial healing scan
    await this.healScan()
    
    // Continuous monitoring every 5 seconds
    const healingInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(healingInterval)
        return
      }
      
      await this.healScan()
    }, 5000)
    
    // Backup critical files every 60 seconds
    const backupInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(backupInterval)
        return
      }
      
      this.backupCriticalFiles()
    }, 60000)
    
    this.log('🛡️  Continuous protection active (5s healing, 60s backup)')
  }

  stop() {
    this.isRunning = false
    this.log('🛑 File healer stopped')
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      healingLog: this.healingLog.slice(-10), // Last 10 entries
      watchDirectories: WATCH_DIRECTORIES,
      criticalFiles: CRITICAL_FILES
    }
  }
}

// CLI usage
if (require.main === module) {
  const healer = new FileHealer()
  
  process.on('SIGINT', () => {
    healer.stop()
    process.exit(0)
  })
  
  healer.startHealing().catch(console.error)
}

module.exports = FileHealer
