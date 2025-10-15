#!/usr/bin/env node
// Batch Apply Validation to API Endpoints

const fs = require('fs').promises
const path = require('path')

// Endpoints that need validation and their corresponding schemas
const VALIDATION_TARGETS = [
  {
    file: 'pages/api/vin/extractVin.ts',
    schema: 'validationSchemas.vin.extractVin',
    import: 'import { withValidation, validationSchemas } from \'../../../lib/utils/api-validation\''
  },
  {
    file: 'pages/api/vin/scanVin.ts', 
    schema: 'validationSchemas.vin.scanVin',
    import: 'import { withValidation, validationSchemas } from \'../../../lib/utils/api-validation\''
  },
  {
    file: 'pages/api/demo/demoReset.ts',
    schema: 'validationSchemas.demo.demoReset',
    import: 'import { withValidation, validationSchemas } from \'../../../lib/utils/api-validation\''
  },
  {
    file: 'pages/api/demo/demoSeed.ts',
    schema: 'validationSchemas.demo.demoSeed', 
    import: 'import { withValidation, validationSchemas } from \'../../../lib/utils/api-validation\''
  },
  {
    file: 'pages/api/garages/index.ts',
    schema: 'validationSchemas.garage.createGarage',
    import: 'import { withValidation, validationSchemas } from \'../../../lib/utils/api-validation\''
  }
]

class ValidationApplier {
  async applyValidationToEndpoint(target) {
    const filePath = path.join(process.cwd(), target.file)
    
    try {
      console.log(`🔧 Processing ${target.file}...`)
      
      // Read current file content
      const content = await fs.readFile(filePath, 'utf-8')
      
      // Check if validation is already applied
      if (content.includes('withValidation') || content.includes('api-validation')) {
        console.log(`✅ ${target.file} already has validation`)
        return { success: true, skipped: true }
      }
      
      // Apply validation based on file structure
      const updatedContent = this.addValidationToFile(content, target)
      
      if (updatedContent === content) {
        console.log(`⚠️ ${target.file} - No changes needed`)
        return { success: true, skipped: true }
      }
      
      // Write updated content
      await fs.writeFile(filePath, updatedContent)
      console.log(`✅ ${target.file} - Validation added`)
      
      return { success: true, modified: true }
      
    } catch (error) {
      console.error(`❌ ${target.file} - Error:`, error.message)
      return { success: false, error: error.message }
    }
  }
  
  addValidationToFile(content, target) {
    // Add import if not present
    if (!content.includes('api-validation')) {
      // Find the last import statement
      const lines = content.split('\n')
      let lastImportIndex = -1
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i
        }
      }
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, target.import)
        content = lines.join('\n')
      }
    }
    
    // Find and replace POST handler
    const postHandlerRegex = /if\s*\(\s*req\.method\s*===\s*['"]POST['"]\s*\)\s*{[\s\S]*?(?=\s*if\s*\(\s*req\.method|$)/
    const match = content.match(postHandlerRegex)
    
    if (match) {
      const originalHandler = match[0]
      
      // Extract the handler logic (everything after the if statement)
      const handlerBodyRegex = /if\s*\(\s*req\.method\s*===\s*['"]POST['"]\s*\)\s*{\s*([\s\S]*)/
      const bodyMatch = originalHandler.match(handlerBodyRegex)
      
      if (bodyMatch) {
        const handlerBody = bodyMatch[1].trim()
        
        // Create new validated handler
        const newHandler = `if (req.method === 'POST') {
    return withValidation(req, res, ${target.schema}, async (validatedData) => {
      ${this.adaptHandlerBody(handlerBody)}
    })
  }`
        
        content = content.replace(originalHandler, newHandler)
      }
    }
    
    return content
  }
  
  adaptHandlerBody(handlerBody) {
    // Remove the closing brace and adapt variable access
    let adapted = handlerBody.replace(/}\s*$/, '')
    
    // Replace req.body with validatedData
    adapted = adapted.replace(/req\.body/g, 'validatedData')
    
    // Ensure proper return statements
    if (!adapted.includes('return ')) {
      // If no explicit return, add one
      adapted = adapted.replace(/res\.status\(\d+\)\.json\([^)]+\)/, 'return $&')
    }
    
    return adapted.trim()
  }
  
  async applyValidationBatch() {
    console.log('🚀 Starting batch validation application...\n')
    
    const results = []
    
    for (const target of VALIDATION_TARGETS) {
      const result = await this.applyValidationToEndpoint(target)
      results.push({ ...result, file: target.file })
    }
    
    // Summary
    console.log('\n📊 BATCH VALIDATION SUMMARY:')
    const modified = results.filter(r => r.modified).length
    const skipped = results.filter(r => r.skipped).length
    const errors = results.filter(r => !r.success).length
    
    console.log(`✅ Modified: ${modified}`)
    console.log(`⏭️ Skipped: ${skipped}`) 
    console.log(`❌ Errors: ${errors}`)
    
    if (errors > 0) {
      console.log('\n❌ ERRORS:')
      results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.file}: ${r.error}`)
      })
    }
    
    if (modified > 0) {
      console.log('\n✅ SUCCESSFULLY MODIFIED:')
      results.filter(r => r.modified).forEach(r => {
        console.log(`- ${r.file}`)
      })
    }
    
    return results
  }
}

// Main execution
async function main() {
  const applier = new ValidationApplier()
  
  try {
    await applier.applyValidationBatch()
    console.log('\n🎉 Batch validation application complete!')
  } catch (error) {
    console.error('❌ Batch validation failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { ValidationApplier }
