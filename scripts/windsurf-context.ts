#!/usr/bin/env tsx
/**
 * Windsurf Context Engine
 * 
 * MANDATORY pre-flight system that analyzes codebase before generating code.
 * 
 * Provides:
 * - Architectural guidelines
 * - Import path suggestions  
 * - Pattern examples from existing code
 * - Structure recommendations
 * - Validation rules
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface ContextAnalysis {
  architecture: ArchitectureGuide
  patterns: CodePatterns
  importStrategy: ImportStrategy
  validationRules: ValidationRules
  examples: CodeExample[]
}

interface ArchitectureGuide {
  structure: string
  conventions: string[]
  antiPatterns: string[]
  bestPractices: string[]
}

interface CodePatterns {
  fileStructure: Record<string, string[]>
  namingConventions: string[]
  importPatterns: string[]
  commonUtilities: string[]
}

interface ImportStrategy {
  hasPathAlias: boolean
  pathAlias: string
  averageNesting: number
  maxNesting: number
  recommendations: string[]
  rules: string[]
  problematicFiles: Array<{ file: string; issue: string }>
}

interface ValidationRules {
  required: string[]
  forbidden: string[]
  recommended: string[]
}

interface CodeExample {
  feature: string
  files: string[]
  structure: Record<string, number>
  hasTests: boolean
  why: string
}

class WindsurfContextEngine {
  private gitRoot: string
  
  constructor() {
    this.gitRoot = process.cwd()
  }
  
  /**
   * MANDATORY: Run this before ANY code generation
   */
  async analyzeContext(intent: string): Promise<ContextAnalysis> {
    console.log('🧠 WINDSURF CONTEXT ENGINE\n')
    console.log('='.repeat(60))
    console.log(`Intent: ${intent}`)
    console.log('='.repeat(60))
    console.log('\n📊 Analyzing codebase before proceeding...\n')
    
    // 1. Understand current architecture
    const architecture = await this.analyzeArchitecture()
    
    // 2. Extract patterns from existing code
    const patterns = await this.extractPatterns(intent)
    
    // 3. Analyze import strategy
    const importStrategy = await this.analyzeImports()
    
    // 4. Get validation rules
    const validationRules = this.getValidationRules()
    
    // 5. Find similar examples in codebase
    const examples = await this.findExamples(intent)
    
    return {
      architecture,
      patterns,
      importStrategy,
      validationRules,
      examples
    }
  }
  
  /**
   * Step 1: Understand architecture
   */
  private async analyzeArchitecture(): Promise<ArchitectureGuide> {
    console.log('📐 Step 1: Analyzing architecture...\n')
    
    const hasAppDir = fs.existsSync(path.join(this.gitRoot, 'app'))
    const hasPagesDir = fs.existsSync(path.join(this.gitRoot, 'pages'))
    const hasLibDir = fs.existsSync(path.join(this.gitRoot, 'lib'))
    const hasComponentsDir = fs.existsSync(path.join(this.gitRoot, 'components'))
    
    let structure = 'Unknown'
    const conventions: string[] = []
    const antiPatterns: string[] = []
    const bestPractices: string[] = []
    
    // Next.js App Router
    if (hasAppDir) {
      structure = 'Next.js 13+ App Router'
      conventions.push(
        'Routes in /app directory',
        'API routes in /app/api',
        'Server components by default',
        'Client components marked with "use client"',
        'Layout hierarchy for shared UI'
      )
      antiPatterns.push(
        '❌ Creating pages in /pages when using App Router',
        '❌ Mixing App Router and Pages Router',
        '❌ Client components without "use client"',
        '❌ Deeply nested route structures'
      )
      bestPractices.push(
        '✅ Colocate route components with their routes',
        '✅ Use route groups (folder) for organization',
        '✅ Extract shared logic to /lib',
        '✅ Keep reusable components in /components'
      )
    }
    
    // Detect domain organization in lib/
    if (hasLibDir) {
      const libPath = path.join(this.gitRoot, 'lib')
      const libDirs = fs.readdirSync(libPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
      
      if (libDirs.length > 0) {
        conventions.push('\nDomain Organization in lib/:')
        libDirs.slice(0, 10).forEach(dir => {
          conventions.push(`  - lib/${dir}/ (domain logic)`)
        })
        
        bestPractices.push(
          '✅ New features should follow existing domain structure',
          '✅ Keep business logic in lib/, not in components or routes',
          '✅ One domain = one folder in lib/'
        )
      }
    }
    
    console.log(`   Structure: ${structure}`)
    console.log('   ✅ Analysis complete\n')
    
    return {
      structure,
      conventions,
      antiPatterns,
      bestPractices
    }
  }
  
  /**
   * Step 2: Extract patterns from existing code
   */
  private async extractPatterns(intent: string): Promise<CodePatterns> {
    console.log('📋 Step 2: Extracting code patterns...\n')
    
    const patterns: CodePatterns = {
      fileStructure: {},
      namingConventions: [],
      importPatterns: [],
      commonUtilities: []
    }
    
    // Detect naming conventions
    const allFiles = await glob('**/*.{ts,tsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**'],
      cwd: this.gitRoot
    })
    
    // Analyze file naming
    const components = allFiles.filter(f => f.includes('/components/'))
    const hasTests = allFiles.some(f => f.includes('.test.') || f.includes('/tests/'))
    
    if (components.length > 0) {
      const usesIndexFiles = components.some(f => f.endsWith('/index.tsx') || f.endsWith('/index.ts'))
      
      patterns.namingConventions.push(
        'Components use PascalCase (VehicleCard.tsx)',
        usesIndexFiles ? 'Uses index files for exports' : 'Named exports (no index files)'
      )
    }
    
    if (hasTests) {
      patterns.namingConventions.push('Tests use .test.ts or .test.tsx suffix')
    }
    
    console.log('   ✅ Patterns extracted\n')
    
    return patterns
  }
  
  /**
   * Step 3: Analyze import strategy (CRITICAL!)
   */
  private async analyzeImports(): Promise<ImportStrategy> {
    console.log('📦 Step 3: Analyzing import strategy...\n')
    
    const allFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**'],
      cwd: this.gitRoot
    })
    
    const importAnalysis = {
      pathAliases: new Set<string>(),
      deepestNesting: 0,
      totalImports: 0,
      deepImports: [] as Array<{ file: string; nesting: number; path: string }>
    }
    
    let totalNesting = 0
    
    for (const file of allFiles.slice(0, 100)) {
      const fullPath = path.join(this.gitRoot, file)
      if (!fs.existsSync(fullPath)) continue
      
      const content = fs.readFileSync(fullPath, 'utf8')
      const imports = content.match(/import .+ from ['"](.+)['"]/g) || []
      
      for (const imp of imports) {
        const match = imp.match(/from ['"](.+)['"]/)
        if (!match) continue
        
        const importPath = match[1]
        importAnalysis.totalImports++
        
        // Track path aliases
        if (importPath.startsWith('@/')) {
          importAnalysis.pathAliases.add('@/')
        }
        
        // Count nesting level for relative imports
        if (importPath.startsWith('.')) {
          const nesting = (importPath.match(/\.\.\//g) || []).length
          totalNesting += nesting
          
          if (nesting > importAnalysis.deepestNesting) {
            importAnalysis.deepestNesting = nesting
          }
          
          if (nesting > 2) {
            importAnalysis.deepImports.push({
              file: path.basename(file),
              nesting,
              path: importPath
            })
          }
        }
      }
    }
    
    const averageNesting = importAnalysis.totalImports > 0 
      ? totalNesting / importAnalysis.totalImports 
      : 0
    
    // Generate recommendations
    const recommendations: string[] = []
    const problematicFiles: Array<{ file: string; issue: string }> = []
    
    if (importAnalysis.deepestNesting > 3) {
      recommendations.push('🚨 CRITICAL: Deeply nested imports detected!')
      recommendations.push(`   Deepest nesting: ${importAnalysis.deepestNesting} levels`)
      recommendations.push('   Solution: Use path alias (@/) instead of ../../../')
    }
    
    if (importAnalysis.pathAliases.has('@/')) {
      recommendations.push('✅ Path alias @/ is configured and in use')
      recommendations.push('   ALWAYS use: import X from "@/lib/..."')
      recommendations.push('   NEVER use: import X from "../../lib/..."')
    } else {
      recommendations.push('⚠️  No path alias configured!')
      recommendations.push('   Add @/ alias to tsconfig.json paths')
    }
    
    // Track problematic files
    importAnalysis.deepImports.forEach(imp => {
      problematicFiles.push({
        file: imp.file,
        issue: `${imp.nesting} levels: ${imp.path}`
      })
    })
    
    if (problematicFiles.length > 0) {
      console.log(`   ⚠️  Found ${problematicFiles.length} files with deep imports\n`)
      problematicFiles.slice(0, 5).forEach(p => {
        console.log(`      ${p.file}: ${p.issue}`)
      })
      console.log()
    }
    
    console.log('   ✅ Import analysis complete\n')
    
    return {
      hasPathAlias: importAnalysis.pathAliases.size > 0,
      pathAlias: '@/',
      averageNesting,
      maxNesting: importAnalysis.deepestNesting,
      recommendations,
      problematicFiles,
      rules: [
        'ALWAYS use @/ for absolute imports',
        'NEVER nest more than 2 levels (../../ max)',
        'Prefer @/lib/domain/module over relative paths',
        'Keep imports flat and discoverable',
        'Use consistent import order: external → @/ → relative'
      ]
    }
  }
  
  /**
   * Step 4: Get validation rules
   */
  private getValidationRules(): ValidationRules {
    return {
      required: [
        '✅ Every new feature MUST have tests',
        '✅ Every API route MUST use withTenantIsolation middleware',
        '✅ Every database table MUST have tenant_id column',
        '✅ Every migration MUST have a rollback script',
        '✅ Every component MUST use TypeScript (not JavaScript)'
      ],
      forbidden: [
        '❌ NO auth.uid() in RLS policies (use app.current_tenant_id)',
        '❌ NO localStorage in server components',
        '❌ NO hardcoded tenant IDs anywhere',
        '❌ NO mock users in production code',
        '❌ NO deeply nested imports (>2 levels of ../)',
        '❌ NO unprotected API routes'
      ],
      recommended: [
        '💡 Use path aliases (@/) for all imports',
        '💡 Extract common logic to lib/ directory',
        '💡 Follow existing domain structure',
        '💡 Add JSDoc comments for public APIs',
        '💡 Use meaningful, descriptive variable names',
        '💡 Keep files under 300 lines when possible'
      ]
    }
  }
  
  /**
   * Step 5: Find examples from codebase
   */
  private async findExamples(intent: string): Promise<CodeExample[]> {
    console.log('📚 Step 4: Finding examples from codebase...\n')
    
    const examples: CodeExample[] = []
    
    // Check lib/ for domain folders
    const libPath = path.join(this.gitRoot, 'lib')
    if (!fs.existsSync(libPath)) return examples
    
    const domains = fs.readdirSync(libPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    
    // Analyze each domain as a potential example
    for (const domain of domains.slice(0, 5)) {
      const domainFiles = await glob(`{lib,app,components,tests}/${domain}/**/*.{ts,tsx}`, {
        cwd: this.gitRoot
      })
      
      if (domainFiles.length === 0) continue
      
      const structure: Record<string, number> = {
        logic: 0,
        routes: 0,
        components: 0,
        tests: 0
      }
      
      domainFiles.forEach(file => {
        if (file.startsWith('lib/')) structure.logic++
        else if (file.startsWith('app/')) structure.routes++
        else if (file.startsWith('components/')) structure.components++
        else if (file.startsWith('tests/') || file.includes('.test.')) structure.tests++
      })
      
      const hasTests = structure.tests > 0
      const isComplete = structure.logic > 0 && structure.routes > 0 && hasTests
      
      if (isComplete || domainFiles.length > 5) {
        let why = 'Good structure'
        if (hasTests) why += ', has tests'
        if (isComplete) why += ', complete feature'
        
        examples.push({
          feature: domain,
          files: domainFiles,
          structure,
          hasTests,
          why
        })
        
        console.log(`   ✅ Found example: ${domain}`)
        console.log(`      Files: ${domainFiles.length}`)
        console.log(`      Logic: ${structure.logic}, Routes: ${structure.routes}, Tests: ${structure.tests}`)
        console.log()
      }
    }
    
    console.log(`   ✅ Found ${examples.length} examples\n`)
    
    return examples
  }
  
  /**
   * Generate actionable guidance document
   */
  async generateGuidance(intent: string): Promise<string> {
    const context = await this.analyzeContext(intent)
    
    let guidance = '# 🎯 WINDSURF CONTEXT & GUIDANCE\n\n'
    guidance += `**Generated:** ${new Date().toISOString()}\n`
    guidance += `**Intent:** ${intent}\n\n`
    guidance += '---\n\n'
    
    // Architecture
    guidance += '## 📐 Architecture & Structure\n\n'
    guidance += `**Current Setup:** ${context.architecture.structure}\n\n`
    guidance += '### Conventions You MUST Follow:\n\n'
    context.architecture.conventions.forEach(c => {
      guidance += `- ${c}\n`
    })
    guidance += '\n'
    
    if (context.architecture.antiPatterns.length > 0) {
      guidance += '### Anti-Patterns to AVOID:\n\n'
      context.architecture.antiPatterns.forEach(a => {
        guidance += `- ${a}\n`
      })
      guidance += '\n'
    }
    
    if (context.architecture.bestPractices.length > 0) {
      guidance += '### Best Practices:\n\n'
      context.architecture.bestPractices.forEach(bp => {
        guidance += `- ${bp}\n`
      })
      guidance += '\n'
    }
    
    // Import Strategy (CRITICAL!)
    guidance += '## 📦 Import Strategy (CRITICAL!)\n\n'
    
    if (context.importStrategy.maxNesting > 2) {
      guidance += '### 🚨 WARNING: Deep Import Nesting Detected!\n\n'
      guidance += `This codebase has imports nested up to **${context.importStrategy.maxNesting} levels deep**.\n\n`
      guidance += '**DO NOT add more deeply nested imports!** Use path aliases instead.\n\n'
      
      if (context.importStrategy.problematicFiles.length > 0) {
        guidance += '#### Examples of problematic imports in this codebase:\n\n'
        context.importStrategy.problematicFiles.slice(0, 3).forEach(p => {
          guidance += `- \`${p.file}\`: ${p.issue}\n`
        })
        guidance += '\n**You must NOT repeat these patterns!**\n\n'
      }
    }
    
    guidance += '### Rules You MUST Follow:\n\n'
    context.importStrategy.rules.forEach(r => {
      guidance += `- ${r}\n`
    })
    guidance += '\n'
    
    guidance += '### Examples:\n\n'
    guidance += '```typescript\n'
    guidance += '// ✅ CORRECT - Use path alias\n'
    guidance += 'import { VehicleService } from "@/lib/vehicles/api"\n'
    guidance += 'import { VehicleCard } from "@/components/vehicles/VehicleCard"\n'
    guidance += 'import { withTenantIsolation } from "@/lib/middleware/tenant-isolation"\n\n'
    guidance += '// ❌ WRONG - Deep relative imports\n'
    guidance += 'import { VehicleService } from "../../../../lib/vehicles/api"\n'
    guidance += 'import { VehicleCard } from "../../../components/vehicles/VehicleCard"\n'
    guidance += '```\n\n'
    
    // Validation Rules
    guidance += '## ✅ Validation Rules\n\n'
    guidance += '### REQUIRED (CI will fail if missing):\n\n'
    context.validationRules.required.forEach(r => {
      guidance += `- ${r}\n`
    })
    guidance += '\n'
    
    guidance += '### FORBIDDEN (CI will fail if present):\n\n'
    context.validationRules.forbidden.forEach(f => {
      guidance += `- ${f}\n`
    })
    guidance += '\n'
    
    guidance += '### RECOMMENDED:\n\n'
    context.validationRules.recommended.forEach(r => {
      guidance += `- ${r}\n`
    })
    guidance += '\n'
    
    // Examples
    if (context.examples.length > 0) {
      guidance += '## 📚 Examples from This Codebase\n\n'
      guidance += '**Study these existing features before creating new code:**\n\n'
      
      context.examples.slice(0, 3).forEach(ex => {
        guidance += `### ${ex.feature}\n\n`
        guidance += `**Why this is a good example:** ${ex.why}\n\n`
        guidance += '**Structure:**\n'
        guidance += `- Business Logic: ${ex.structure.logic} files\n`
        guidance += `- Routes: ${ex.structure.routes} files\n`
        guidance += `- Components: ${ex.structure.components} files\n`
        guidance += `- Tests: ${ex.structure.tests} files\n\n`
        guidance += '**Key files to study:**\n'
        ex.files.slice(0, 8).forEach(f => {
          guidance += `- \`${f}\`\n`
        })
        guidance += '\n'
      })
    }
    
    // Recommended Structure
    guidance += '## 🏗️ Recommended Structure for Your Task\n\n'
    guidance += 'Based on the analysis above, here\'s the recommended structure:\n\n'
    
    // Extract domain from intent
    const keywords = intent.toLowerCase().split(/\s+/)
    const domain = keywords.find(k => k.length > 3) || 'feature'
    
    guidance += '```\n'
    guidance += `lib/${domain}/\n`
    guidance += '  ├── types.ts           # TypeScript types\n'
    guidance += '  ├── api.ts             # API client functions\n'
    guidance += '  ├── validation.ts      # Validation schemas\n'
    guidance += '  └── utils.ts           # Helper functions\n\n'
    guidance += `app/${domain}/\n`
    guidance += '  └── page.tsx           # Route page\n\n'
    guidance += `components/${domain}/\n`
    guidance += '  ├── List.tsx           # List component\n'
    guidance += '  └── Form.tsx           # Form component\n\n'
    guidance += `tests/${domain}/\n`
    guidance += '  ├── api.test.ts        # Unit tests\n'
    guidance += '  └── integration.test.ts # Integration tests\n'
    guidance += '```\n\n'
    
    // Pre-Flight Checklist
    guidance += '## 📋 Pre-Flight Checklist\n\n'
    guidance += 'Before generating ANY code, verify you have:\n\n'
    guidance += '- [ ] Read and understood the architecture\n'
    guidance += '- [ ] Reviewed the import strategy rules\n'
    guidance += '- [ ] Studied at least one example feature\n'
    guidance += '- [ ] Planned the file structure\n'
    guidance += '- [ ] Confirmed you will use @/ imports\n'
    guidance += '- [ ] Confirmed you will add tests\n'
    guidance += '- [ ] Confirmed you understand validation rules\n\n'
    
    // Workflow
    guidance += '## 🚀 Recommended Workflow\n\n'
    guidance += '1. **Study Examples** - Look at similar features first\n'
    guidance += '2. **Plan Structure** - Match existing patterns exactly\n'
    guidance += '3. **Use Path Aliases** - Never use deeply nested imports\n'
    guidance += '4. **Generate Code** - Follow all rules above\n'
    guidance += '5. **Add Tests** - Required for all features\n'
    guidance += '6. **Validate** - Run checks before committing\n\n'
    
    guidance += '### Validation Commands:\n\n'
    guidance += '```bash\n'
    guidance += '# Check if code fits patterns\n'
    guidance += 'npm run repo:analyze\n\n'
    guidance += '# Clean up any issues\n'
    guidance += 'npm run repo:clean\n\n'
    guidance += '# Validate database (if applicable)\n'
    guidance += 'npm run db:validate\n\n'
    guidance += '# Run security tests\n'
    guidance += 'npm run test:security\n\n'
    guidance += '# Run all tests\n'
    guidance += 'npm test\n'
    guidance += '```\n\n'
    
    // Footer
    guidance += '---\n\n'
    guidance += '**Remember:**\n'
    guidance += '- This guidance was generated by analyzing YOUR codebase\n'
    guidance += '- Following these rules ensures your code fits perfectly\n'
    guidance += '- When in doubt, copy the structure of existing features\n'
    guidance += '- Use @/ imports, always!\n\n'
    guidance += '*Generated by Windsurf Context Engine*\n'
    
    return guidance
  }
}

// CLI
const [command, ...args] = process.argv.slice(2)

async function main() {
  const engine = new WindsurfContextEngine()
  
  switch (command) {
    case 'analyze': {
      const intent = args.join(' ') || 'general analysis'
      await engine.analyzeContext(intent)
      console.log('\n✅ Analysis complete!')
      console.log('\nNext: npm run windsurf:guide "<your task>"\n')
      break
    }
    
    case 'guide': {
      const intent = args.join(' ')
      if (!intent) {
        console.error('❌ Error: Please provide intent\n')
        console.error('Usage: npm run windsurf:guide "add document storage"\n')
        process.exit(1)
      }
      
      const guidance = await engine.generateGuidance(intent)
      
      // Save to file
      const outputPath = path.join(process.cwd(), '.windsurf-context.md')
      fs.writeFileSync(outputPath, guidance)
      
      console.log('\n' + '='.repeat(60))
      console.log('✅ GUIDANCE GENERATED')
      console.log('='.repeat(60))
      console.log(`\nSaved to: .windsurf-context.md`)
      console.log('\n📖 READ THIS FILE BEFORE GENERATING CODE!\n')
      console.log('This file contains:')
      console.log('  - Architecture guidelines')
      console.log('  - Import strategy rules')
      console.log('  - Validation requirements')
      console.log('  - Examples from your codebase')
      console.log('  - Recommended structure\n')
      break
    }
    
    default:
      console.log('Windsurf Context Engine\n')
      console.log('Usage:')
      console.log('  npm run windsurf:analyze              # Analyze codebase')
      console.log('  npm run windsurf:guide "<task>"       # Generate guidance\n')
      console.log('Examples:')
      console.log('  npm run windsurf:guide "add document storage"')
      console.log('  npm run windsurf:guide "refactor vehicle imports"')
      console.log('  npm run windsurf:guide "add user notifications"\n')
  }
}

main().catch(console.error)
