#!/usr/bin/env tsx
/**
 * Refine Vehicles Structure
 * 
 * Fixes categorization issues from Week 1 migration:
 * - Moves API routes from domain/ to data/
 * - Moves hooks to correct location
 * - Updates imports automatically
 * 
 * Usage: npm run refine:vehicles
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

class VehiclesStructureRefiner {
  private gitRoot = process.cwd()
  private vehiclesPath = path.join(this.gitRoot, 'features/vehicles')
  
  async refine(): Promise<void> {
    console.log('🔧 REFINING VEHICLES STRUCTURE\n')
    console.log('='.repeat(60))
    console.log('Fixing categorization issues from Week 1 migration')
    console.log('='.repeat(60))
    console.log()
    
    // Step 1: Find API routes in domain/
    const apiRoutes = this.findApiRoutesInDomain()
    console.log(`📁 Found ${apiRoutes.length} API routes in domain/\n`)
    
    // Step 2: Show what will be moved
    console.log('Files to move:')
    apiRoutes.forEach(file => {
      console.log(`   ${file}`)
      console.log(`   → features/vehicles/data/${path.basename(file)}`)
      console.log()
    })
    
    // Step 3: Confirm
    console.log(`\nThis will move ${apiRoutes.length} files from domain/ to data/`)
    console.log('Continue? (Ctrl+C to cancel, Enter to proceed)')
    
    // Wait for user confirmation
    await new Promise(resolve => {
      process.stdin.once('data', resolve)
    })
    
    // Step 4: Move files
    console.log('\n🚀 Moving files...\n')
    apiRoutes.forEach(file => {
      const fileName = path.basename(file)
      const newPath = path.join(this.vehiclesPath, 'data', fileName)
      
      try {
        execSync(`git mv "${file}" "${newPath}"`, { 
          cwd: this.gitRoot,
          stdio: 'pipe'
        })
        console.log(`   ✅ Moved ${fileName}`)
      } catch (e: any) {
        console.log(`   ❌ Error moving ${fileName}: ${e.message}`)
      }
    })
    
    // Step 5: Update imports
    console.log('\n🔧 Updating imports...\n')
    const updated = this.updateImports(apiRoutes)
    console.log(`   ✅ Updated imports in ${updated} files`)
    
    // Step 6: Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ REFINEMENT COMPLETE')
    console.log('='.repeat(60))
    console.log()
    console.log('Next steps:')
    console.log('1. Verify: npm run typecheck')
    console.log('2. Test: npm test features/vehicles')
    console.log('3. Commit: git commit -m "refactor(vehicles): correct file categorization"')
    console.log()
  }
  
  private findApiRoutesInDomain(): string[] {
    const domainPath = path.join(this.vehiclesPath, 'domain')
    
    if (!fs.existsSync(domainPath)) {
      return []
    }
    
    const files = fs.readdirSync(domainPath)
    
    // API routes typically have patterns like:
    // - [id].ts, [param].ts (dynamic routes)
    // - route-name.ts that contain API handlers
    return files
      .filter(file => {
        const fullPath = path.join(domainPath, file)
        
        // Skip if not a TypeScript file
        if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
          return false
        }
        
        // Check file contents for API patterns
        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          
          // Has API route patterns
          return (
            content.includes('NextApiRequest') ||
            content.includes('NextApiResponse') ||
            content.includes('export default async function handler') ||
            file.startsWith('[') // Dynamic route
          )
        } catch {
          return false
        }
      })
      .map(file => path.join(domainPath, file))
  }
  
  private updateImports(movedFiles: string[]): number {
    let updatedCount = 0
    
    // Find all TypeScript files in the project
    try {
      const allFiles = execSync('git ls-files "*.ts" "*.tsx"', {
        encoding: 'utf8',
        cwd: this.gitRoot
      }).split('\n').filter(f => f.trim())
      
      allFiles.forEach(file => {
        const fullPath = path.join(this.gitRoot, file)
        
        try {
          let content = fs.readFileSync(fullPath, 'utf8')
          const originalContent = content
          
          // Update imports for moved files
          movedFiles.forEach(movedFile => {
            const fileName = path.basename(movedFile, '.ts')
            
            // Pattern: @/features/vehicles/domain/[filename]
            const oldImport = `@/features/vehicles/domain/${fileName}` 
            const newImport = `@/features/vehicles/data/${fileName}` 
            
            content = content.replace(
              new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              newImport
            )
          })
          
          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8')
            updatedCount++
          }
        } catch (e) {
          // Skip files we can't read
        }
      })
    } catch (e) {
      console.error('Error updating imports:', e)
    }
    
    return updatedCount
  }
}

// CLI
const refiner = new VehiclesStructureRefiner()
refiner.refine().catch(console.error)
