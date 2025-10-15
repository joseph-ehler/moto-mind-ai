#!/usr/bin/env tsx
/**
 * Migration Checklist Generator
 * 
 * Generates a custom migration checklist based on feature complexity.
 * Uses templates from 3 validated migrations.
 */

import * as fs from 'fs'
import * as path from 'path'

interface FeatureComplexity {
  featureName: string
  componentCount: number
  totalFiles: number
  maxNestingDepth: number
  hasSubdirectories: boolean
  hasInternalImports: boolean
  complexityLevel: 'low' | 'medium' | 'high'
  estimatedTime: string
  similarTo: string
  recommendations: string[]
  warnings: string[]
}

function generateChecklist(analysis: FeatureComplexity): string {
  const feature = analysis.featureName
  const complexity = analysis.complexityLevel.toUpperCase()
  
  // Adjust times based on complexity and learning curve
  const phase1Time = analysis.complexityLevel === 'high' ? '40' : '30'
  const phase2Time = analysis.complexityLevel === 'high' ? '30' : '20'
  const phase3Time = analysis.complexityLevel === 'high' ? '20' : '15'
  const totalTime = analysis.estimatedTime

  return `# 🎯 ${feature.toUpperCase()} FEATURE MIGRATION - EXECUTION CHECKLIST

**Complexity:** ${complexity}  
**Estimated Time:** ${totalTime}  
**Similar To:** ${analysis.similarTo}  
**Components:** ${analysis.componentCount}  
**Total Files:** ${analysis.totalFiles}

---

## ⚠️  **PRE-MIGRATION ANALYSIS**

${analysis.warnings.length > 0 ? `### **Warnings:**
${analysis.warnings.map(w => `- ${w}`).join('\n')}
` : ''}
### **Recommendations:**
${analysis.recommendations.map(r => `- ${r}`).join('\n')}

---

## ✅ **PHASE 1: TEST INFRASTRUCTURE (${phase1Time} MIN)**

**Goal:** Create comprehensive tests before moving any code.

### **Step 1.1: Create Test Directories (5 min)**
\`\`\`bash
cd features/${feature}
mkdir -p __tests__/domain __tests__/mocks
${analysis.complexityLevel === 'medium' || analysis.complexityLevel === 'high' ? `mkdir -p __tests__/data  # If feature has API calls` : ''}
\`\`\`

### **Step 1.2: Generate Domain Tests (${parseInt(phase1Time) - 15} min)**

Create test files based on complexity:

**Required:**
- [ ] \`__tests__/domain/${feature}-validation.test.ts\` - Input validation
- [ ] \`__tests__/domain/${feature}-types.test.ts\` - Type checking

${analysis.complexityLevel === 'medium' || analysis.complexityLevel === 'high' ? `**Recommended:**
- [ ] \`__tests__/domain/${feature}-logic.test.ts\` - Business logic
- [ ] \`__tests__/domain/${feature}-flow.test.ts\` - Flow logic` : ''}

**Example test pattern (from ${analysis.similarTo}):**
\`\`\`typescript
describe('${feature.charAt(0).toUpperCase() + feature.slice(1)} Validation', () => {
  it('should validate required fields', () => {
    // Test validation logic
  })
})
\`\`\`

### **Step 1.3: Create Mock Fixtures (5 min)**
\`\`\`bash
# Create fixtures file
touch __tests__/mocks/${feature}-fixtures.ts
\`\`\`

**Mock pattern:**
\`\`\`typescript
export const mock${feature.charAt(0).toUpperCase() + feature.slice(1)} = {
  id: 'test-1',
  // ... mock data
}

export function createMock(overrides = {}) {
  return { ...mock${feature.charAt(0).toUpperCase() + feature.slice(1)}, ...overrides }
}
\`\`\`

### **Step 1.4: Run Tests (5 min)**
\`\`\`bash
npm test features/${feature} -- --silent
\`\`\`

**Success Criteria:**
- ✅ Minimum 20+ tests
- ✅ All tests passing
- ✅ Good coverage

### **Step 1.5: Commit**
\`\`\`bash
git add features/${feature}/__tests__
git commit -m "test: add ${feature} feature tests (Phase 1)

- Domain tests created
- Mock fixtures ready
- X tests passing

Next: Component migration"
\`\`\`

---

## ✅ **PHASE 2: COMPONENT MIGRATION (${phase2Time} MIN)**

**Goal:** Move all UI components to \`features/${feature}/ui/\`.

### **Step 2.1: Create UI Structure (2 min)**
\`\`\`bash
cd features/${feature}
mkdir -p ui
${analysis.hasSubdirectories ? `# Organize into subdirectories based on component types
mkdir -p ui/modals ui/forms ui/sections ui/cards` : ''}
\`\`\`

### **Step 2.2: Move Components (${parseInt(phase2Time) - 10} min)**
\`\`\`bash
# Move all components (preserving git history)
git mv components/${feature}/*.tsx features/${feature}/ui/

${analysis.hasSubdirectories ? `# Organize into subdirectories
# Identify modal components
find features/${feature}/ui -name "*Modal.tsx" -exec git mv {} features/${feature}/ui/modals/ \\;

# Identify form components  
find features/${feature}/ui -name "*Form.tsx" -exec git mv {} features/${feature}/ui/forms/ \\;

# etc. (adjust based on your components)` : ''}
\`\`\`

### **Step 2.3: Move Domain Files (3 min)**
\`\`\`bash
# Move types and configuration
${analysis.totalFiles > 40 ? `git mv components/${feature}/types.ts features/${feature}/domain/
git mv components/${feature}/*-config.ts features/${feature}/domain/ 2>/dev/null || true` : `git mv components/${feature}/types.ts features/${feature}/domain/ 2>/dev/null || true`}

# Move hooks if they exist
${analysis.totalFiles > 40 ? `mkdir -p features/${feature}/hooks
git mv components/${feature}/hooks/*.ts features/${feature}/hooks/ 2>/dev/null || true` : `mkdir -p features/${feature}/hooks 2>/dev/null || true`}
\`\`\`

### **Step 2.4: Clean Up (1 min)**
\`\`\`bash
# Remove old directory
rm -rf components/${feature}/
\`\`\`

### **Step 2.5: Update Imports (${parseInt(phase2Time) - 6} min)**
\`\`\`bash
# Bulk update imports
find app/ features/ lib/ -name "*.ts" -o -name "*.tsx" | \\
  xargs sed -i '' "s|@/components/${feature}/|@/features/${feature}/ui/|g"

# Check for remaining old imports
grep -r "@/components/${feature}" app/ features/ lib/ --include="*.ts" --include="*.tsx"
\`\`\`

${analysis.hasInternalImports ? `### **Step 2.6: Fix Internal Imports (CRITICAL)**

**Warning:** This feature has internal imports. Fix these carefully:

1. **Find internal relative imports:**
   \`\`\`bash
   grep -r "from '\\." features/${feature}/ui --include="*.tsx"
   \`\`\`

2. **Convert to absolute imports:**
   \`\`\`typescript
   // Before
   import { Component } from './Component'
   
   // After  
   import { Component } from '@/features/${feature}/ui/Component'
   \`\`\`

3. **Create type exports if needed:**
   \`\`\`typescript
   // features/${feature}/ui/types.ts or domain/types.ts
   export interface FeatureType { /* ... */ }
   export function helper() { /* ... */ }
   \`\`\`
` : ''}

### **Step 2.7: Build & Validate (2 min)**
\`\`\`bash
npm run build
\`\`\`

**Success Criteria:**
- ✅ Build passing
- ✅ No "Module not found" errors
- ✅ All imports resolved

### **Step 2.8: Commit**
\`\`\`bash
git add -A
git commit -m "feat: migrate ${feature} components (Phase 2)

- ${analysis.componentCount} components migrated
- Organized into features/${feature}/ui/
- All imports updated
- Build passing

Next: Domain logic migration"
\`\`\`

---

## ✅ **PHASE 3: DOMAIN LOGIC MIGRATION (${phase3Time} MIN)**

**Goal:** Move business logic to \`features/${feature}/domain/\`.

### **Step 3.1: Identify Domain Code (5 min)**
\`\`\`bash
# Search for ${feature}-related code in lib/
grep -r "${feature}" lib/ --include="*.ts" | grep -v node_modules
\`\`\`

### **Step 3.2: Move Domain Files (${parseInt(phase3Time) - 10} min)**

If found, move to domain/:
\`\`\`bash
# Example moves (adjust based on what you find)
git mv lib/domain/${feature}-*.ts features/${feature}/domain/ 2>/dev/null || true
git mv lib/utils/${feature}-*.ts features/${feature}/domain/ 2>/dev/null || true
\`\`\`

### **Step 3.3: Add Backward Compatibility (3 min)**

If you moved shared types, add re-exports:
\`\`\`typescript
// lib/domain/types.ts (if types were moved)
export { type FeatureType } from '@/features/${feature}/domain/types'
\`\`\`

### **Step 3.4: Update Domain Imports (2 min)**
\`\`\`bash
# Update imports to new domain location
find app/ features/ -name "*.ts" -o -name "*.tsx" | \\
  xargs sed -i '' "s|@/lib/domain/${feature}|@/features/${feature}/domain|g"
\`\`\`

### **Step 3.5: Validate (${parseInt(phase3Time) - 10} min)**
\`\`\`bash
npm test
npm run build
\`\`\`

**Success Criteria:**
- ✅ All tests passing
- ✅ Build successful  
- ✅ No regressions

### **Step 3.6: Commit**
\`\`\`bash
git add -A
git commit -m "feat: migrate ${feature} domain logic (Phase 3)

- Domain logic isolated
- Backward compatibility maintained
- All tests passing

Next: Final validation"
\`\`\`

---

## ✅ **PHASE 4: VALIDATION & DEPLOY (10 MIN)**

### **Step 4.1: Run Full Test Suite (3 min)**
\`\`\`bash
npm test features/${feature}
npm test  # Full suite
\`\`\`

### **Step 4.2: Build Verification (2 min)**
\`\`\`bash
npm run build
\`\`\`

### **Step 4.3: Architecture Validation (2 min)**
\`\`\`bash
npm run arch:validate
\`\`\`

### **Step 4.4: Final Commit & Push (3 min)**
\`\`\`bash
git add -A
git commit -m "feat: complete ${feature} feature migration

${feature.toUpperCase()} feature successfully migrated following proven pattern.

PHASE 1: TESTS ✅
- X tests created (all passing)
- Domain validation comprehensive
- Mock fixtures reusable

PHASE 2: COMPONENTS ✅
- ${analysis.componentCount} components migrated
- Organized into features/${feature}/ui/
- All imports updated
- Build passing

PHASE 3: DOMAIN ✅
- Domain logic isolated
- Types organized
- Backward compatibility maintained

RESULTS:
✅ X tests passing
✅ Build successful
✅ Architecture improved
✅ 0 breaking changes

Time: ${totalTime}
Complexity: ${complexity}
Pattern: Validated

Progress: X/12 features complete"

git push origin main
\`\`\`

---

## 📊 **SUCCESS CRITERIA**

### **Migration is successful if:**
- ✅ All tests passing (100%)
- ✅ Build successful
- ✅ No breaking changes
- ✅ Time <= ${totalTime}
- ✅ Architecture violations reduced

### **Quality metrics:**
- ✅ Test coverage maintained
- ✅ Import paths clean
- ✅ Component organization logical
- ✅ Domain logic isolated

---

## 🚨 **TROUBLESHOOTING**

### **Problem: Module not found**
**Solution:** Check for relative imports, convert to absolute

### **Problem: Type errors**
**Solution:** Export types from domain/, expand interfaces

### **Problem: Tests fail**
**Solution:** Update test imports, verify mocks accessible

### **Problem: Build slow**
**Solution:** Check for circular dependencies

---

## ⏱️ **TIME TRACKING**

| Phase | Planned | Actual | Notes |
|-------|---------|--------|-------|
| Tests | ${phase1Time} min | ___ | |
| Components | ${phase2Time} min | ___ | ${analysis.hasInternalImports ? 'Watch for internal imports' : ''} |
| Domain | ${phase3Time} min | ___ | |
| Validation | 10 min | ___ | |
| **Total** | **${totalTime}** | **___** | |

---

## 🎯 **READY TO START?**

1. Review warnings and recommendations above
2. Adjust time estimates if needed
3. Start Phase 1: Test Infrastructure
4. Follow checklist step-by-step
5. Commit after each phase
6. Celebrate success! 🎉

**Based on ${analysis.similarTo} migration pattern.**  
**Complexity: ${complexity}**  
**Let's ship it! 🚀**
`
}

// CLI
const featureName = process.argv[2]

if (!featureName) {
  console.error('❌ Usage: npm run generate:checklist <feature-name>')
  console.error('   Example: npm run generate:checklist events')
  process.exit(1)
}

try {
  // Load analysis if it exists
  const analysisPath = path.join(process.cwd(), `.migration-analysis-${featureName}.json`)
  
  let analysis: FeatureComplexity
  
  if (fs.existsSync(analysisPath)) {
    console.log(`📂 Loading analysis from ${analysisPath}...`)
    analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'))
  } else {
    console.log('⚠️  No analysis found. Run analyzer first:')
    console.log(`   npm run analyze:feature ${featureName}`)
    process.exit(1)
  }

  // Generate checklist
  const checklist = generateChecklist(analysis)
  
  // Save to file
  const outputPath = path.join(process.cwd(), 'docs', `${featureName.toUpperCase()}-MIGRATION-CHECKLIST.md`)
  fs.writeFileSync(outputPath, checklist)
  
  console.log()
  console.log('='.repeat(60))
  console.log('✅  CHECKLIST GENERATED!')
  console.log('='.repeat(60))
  console.log()
  console.log(`📋 File: ${outputPath}`)
  console.log(`📊 Complexity: ${analysis.complexityLevel.toUpperCase()}`)
  console.log(`⏱️  Estimated Time: ${analysis.estimatedTime}`)
  console.log()
  console.log('Next steps:')
  console.log(`  1. Review checklist: cat ${outputPath}`)
  console.log(`  2. Adjust time estimates if needed`)
  console.log(`  3. Start Phase 1: Test Infrastructure`)
  console.log()
  console.log('='.repeat(60))
  console.log()
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : error)
  process.exit(1)
}
