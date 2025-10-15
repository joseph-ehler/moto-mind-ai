#!/usr/bin/env tsx
/**
 * Adaptive Checklist Generator
 * 
 * Generates migration checklists that adapt to:
 * 1. AI-detected complexity and issues
 * 2. Predicted problems from historical data
 * 3. Feature-specific patterns
 * 
 * Not just templates - customized for YOUR specific code.
 */

import * as fs from 'fs'
import * as path from 'path'

interface EnhancedAnalysis {
  featureName: string
  componentCount: number
  complexityLevel: string
  estimatedTime: string
  similarTo: string
  aiInsights: {
    actualComplexity: string
    hiddenIssues: string[]
    recommendations: string[]
    estimatedTime: string
    internalImports?: {
      count: number
      files: string[]
    }
  }
  confidenceLevel: number
}

interface IssuePrediction {
  feature: string
  predictedIssues: Array<{
    issue: string
    probability: number
    phase: string
    mitigation: string
  }>
}

interface ChecklistCustomization {
  phase: number
  position: 'before' | 'after'
  anchor: string
  content: string
  reason: string
}

function loadEnhancedAnalysis(feature: string): EnhancedAnalysis {
  const aiPath = path.join(process.cwd(), `.migration-analysis-ai-${feature}.json`)
  
  if (fs.existsSync(aiPath)) {
    return JSON.parse(fs.readFileSync(aiPath, 'utf-8'))
  }
  
  // Fallback to basic
  const basicPath = path.join(process.cwd(), `.migration-analysis-${feature}.json`)
  if (!fs.existsSync(basicPath)) {
    throw new Error(`No analysis found for ${feature}`)
  }
  
  const basic = JSON.parse(fs.readFileSync(basicPath, 'utf-8'))
  return {
    ...basic,
    aiInsights: {
      actualComplexity: basic.complexityLevel,
      hiddenIssues: [],
      recommendations: [],
      estimatedTime: basic.estimatedTime
    },
    confidenceLevel: 0.5
  }
}

function loadPredictions(feature: string): IssuePrediction | null {
  const predPath = path.join(process.cwd(), `.migration-predictions-${feature}.json`)
  
  if (!fs.existsSync(predPath)) {
    return null
  }
  
  return JSON.parse(fs.readFileSync(predPath, 'utf-8'))
}

function generateCustomizations(
  analysis: EnhancedAnalysis,
  predictions: IssuePrediction | null
): ChecklistCustomization[] {
  const customizations: ChecklistCustomization[] = []
  
  // Customization 1: Internal imports warning
  if (analysis.aiInsights.internalImports && analysis.aiInsights.internalImports.count > 0) {
    const files = analysis.aiInsights.internalImports.files
    customizations.push({
      phase: 2,
      position: 'after',
      anchor: 'Move Components',
      reason: `Feature has ${files.length} files with internal imports`,
      content: `
### ⚠️  CRITICAL: Fix Internal Imports (${files.length} files)

**This feature has internal relative imports that WILL break during migration.**

**Affected files:**
${files.slice(0, 10).map(f => `- \`${f}\``).join('\n')}
${files.length > 10 ? `- ... and ${files.length - 10} more` : ''}

**Strategy (choose one):**

**Option A: Barrel Exports (Recommended)**
\`\`\`bash
# Create index.ts for internal exports
cat > features/${analysis.featureName}/ui/index.ts << 'EOF'
// Re-export all components
export * from './ComponentA'
export * from './ComponentB'
// Add all components here
EOF

# Then update imports to use the barrel
# Before: import { X } from './ComponentA'
# After: import { X } from '@/features/${analysis.featureName}/ui'
\`\`\`

**Option B: Convert to Absolute Imports**
\`\`\`bash
# Find and replace relative imports
find features/${analysis.featureName}/ui -name "*.tsx" -exec sed -i '' \\
  "s|from '\\./|from '@/features/${analysis.featureName}/ui/|g" {} \\;
\`\`\`

**VALIDATION:**
\`\`\`bash
# After fixing, verify no relative imports remain
grep -r "from '\\./" features/${analysis.featureName}/ui
# Should return nothing
\`\`\`
`
    })
  }
  
  // Customization 2: AI-detected hidden issues
  if (analysis.aiInsights.hiddenIssues.length > 0) {
    customizations.push({
      phase: 1,
      position: 'before',
      anchor: 'Create Test Directories',
      reason: 'AI detected hidden complexity',
      content: `
### 🤖 AI-DETECTED ISSUES

**AI analysis found hidden complexity not obvious from file counts:**

${analysis.aiInsights.hiddenIssues.map(issue => `- ⚠️  ${issue}`).join('\n')}

**AI Recommendations:**
${analysis.aiInsights.recommendations.map(rec => `- 💡 ${rec}`).join('\n')}

**Adjusted Time Estimate:** ${analysis.aiInsights.estimatedTime}  
**Confidence:** ${(analysis.confidenceLevel * 100).toFixed(0)}%

**Action:** Review these issues before starting migration. They may require extra time.
`
    })
  }
  
  // Customization 3: High-probability predicted issues
  if (predictions) {
    const highProbIssues = predictions.predictedIssues.filter(i => i.probability > 0.6)
    
    if (highProbIssues.length > 0) {
      // Group by phase
      const byPhase = highProbIssues.reduce((acc, issue) => {
        const phase = issue.phase === 'tests' ? 1 : 
                     issue.phase === 'components' ? 2 :
                     issue.phase === 'domain' ? 3 : 4
        if (!acc[phase]) acc[phase] = []
        acc[phase].push(issue)
        return acc
      }, {} as Record<number, typeof highProbIssues>)
      
      // Add customization for each phase with predicted issues
      Object.entries(byPhase).forEach(([phase, issues]) => {
        const phaseNum = parseInt(phase)
        const phaseName = ['', 'Tests', 'Components', 'Domain', 'Validation'][phaseNum]
        
        customizations.push({
          phase: phaseNum,
          position: 'before',
          anchor: `Step ${phaseNum}.1`,
          reason: `${issues.length} high-probability issues predicted for this phase`,
          content: `
### 🔮 PREDICTED ISSUES FOR PHASE ${phaseNum} (${phaseName})

**Based on historical data and AI analysis, these issues are likely:**

${issues.map((issue, idx) => `
**${idx + 1}. ${issue.issue}**  
Probability: ${(issue.probability * 100).toFixed(0)}%  
Mitigation: ${issue.mitigation}
`).join('\n')}

**💡 Pro Tip:** Address these proactively to avoid debugging later.
`
        })
      })
    }
  }
  
  // Customization 4: Complexity-specific guidance
  if (analysis.aiInsights.actualComplexity === 'high' && analysis.complexityLevel !== 'high') {
    customizations.push({
      phase: 2,
      position: 'before',
      anchor: 'Create UI Structure',
      reason: 'AI detected higher complexity than template analysis',
      content: `
### 🚨 COMPLEXITY UPGRADE DETECTED

**Template Analysis:** ${analysis.complexityLevel.toUpperCase()}  
**AI Analysis:** ${analysis.aiInsights.actualComplexity.toUpperCase()}

**AI found hidden complexity. Expect this migration to take longer than template estimate.**

**Recommended adjustments:**
- Allocate extra 20-30 minutes for unexpected issues
- Take breaks between phases
- Commit more frequently for easier rollback
- Test after each major change

**Revised Estimate:** ${analysis.aiInsights.estimatedTime} (was: ${analysis.estimatedTime})
`
    })
  }
  
  return customizations
}

function generateAdaptiveChecklist(
  analysis: EnhancedAnalysis,
  customizations: ChecklistCustomization[]
): string {
  const feature = analysis.featureName
  const complexity = analysis.aiInsights.actualComplexity.toUpperCase()
  const aiEnhanced = customizations.length > 0 ? '🤖 AI-ENHANCED' : ''
  
  // Adjust phase times based on AI insights
  const useAIEstimate = analysis.confidenceLevel > 0.6
  const estimateSource = useAIEstimate ? 'AI' : 'Template'
  
  // Calculate phase times
  const totalMinutes = parseEstimate(
    useAIEstimate ? analysis.aiInsights.estimatedTime : analysis.estimatedTime
  )
  const phase1Time = analysis.aiInsights.actualComplexity === 'high' ? 40 : 30
  const phase2Time = analysis.aiInsights.actualComplexity === 'high' ? 35 : 25
  const phase3Time = 15
  const phase4Time = 10
  
  let checklist = `# 🎯 ${feature.toUpperCase()} FEATURE MIGRATION ${aiEnhanced}

**Complexity:** ${complexity}  
**Estimated Time:** ${useAIEstimate ? analysis.aiInsights.estimatedTime : analysis.estimatedTime} (${estimateSource})  
**AI Confidence:** ${(analysis.confidenceLevel * 100).toFixed(0)}%  
**Components:** ${analysis.componentCount}  
**Customizations:** ${customizations.length} AI-generated sections

${customizations.length > 0 ? '**🤖 This checklist has been customized based on AI analysis of your specific code.**' : ''}

---
`

  // Add pre-migration customizations (phase 0)
  const phase0Customs = customizations.filter(c => c.phase === 1 && c.position === 'before')
  if (phase0Customs.length > 0) {
    checklist += '\n## ⚠️  PRE-MIGRATION WARNINGS\n\n'
    phase0Customs.forEach(c => {
      checklist += c.content + '\n'
    })
    checklist += '---\n'
  }

  // Phase 1: Tests
  checklist += `
## ✅ PHASE 1: TEST INFRASTRUCTURE (${phase1Time} MIN)

**Goal:** Create comprehensive tests before moving any code.

### Step 1.1: Create Test Directories (5 min)
\`\`\`bash
cd features/${feature}
mkdir -p __tests__/domain __tests__/mocks
\`\`\`
`

  // Add phase 1 customizations
  const phase1Customs = customizations.filter(c => c.phase === 1 && c.position === 'after')
  phase1Customs.forEach(c => {
    checklist += '\n' + c.content + '\n'
  })

  checklist += `
### Step 1.2: Generate Domain Tests (${phase1Time - 15} min)

Create test files:

- [ ] \`__tests__/domain/${feature}-validation.test.ts\` - Input validation
- [ ] \`__tests__/domain/${feature}-types.test.ts\` - Type checking

### Step 1.3: Create Mock Fixtures (5 min)
\`\`\`bash
touch __tests__/mocks/${feature}-fixtures.ts
\`\`\`

### Step 1.4: Run Tests (5 min)
\`\`\`bash
npm test features/${feature} -- --silent
\`\`\`

**Success Criteria:**
- ✅ Minimum 10+ tests
- ✅ All tests passing

### Step 1.5: Commit
\`\`\`bash
git add features/${feature}/__tests__
git commit -m "test: add ${feature} feature tests (Phase 1)"
\`\`\`

---

## ✅ PHASE 2: COMPONENT MIGRATION (${phase2Time} MIN)

**Goal:** Move all UI components to \`features/${feature}/ui/\`.
`

  // Add phase 2 before customizations
  const phase2BeforeCustoms = customizations.filter(c => c.phase === 2 && c.position === 'before')
  phase2BeforeCustoms.forEach(c => {
    checklist += '\n' + c.content + '\n'
  })

  checklist += `
### Step 2.1: Create UI Structure (2 min)
\`\`\`bash
cd features/${feature}
mkdir -p ui
\`\`\`

### Step 2.2: Move Components (${phase2Time - 12} min)
\`\`\`bash
# Move all components (preserving git history)
git mv components/${feature}/*.tsx features/${feature}/ui/
\`\`\`
`

  // Add phase 2 after customizations (like internal imports fix)
  const phase2AfterCustoms = customizations.filter(c => c.phase === 2 && c.position === 'after')
  phase2AfterCustoms.forEach(c => {
    checklist += '\n' + c.content + '\n'
  })

  checklist += `
### Step 2.3: Update Imports (${Math.floor(phase2Time / 3)} min)
\`\`\`bash
# Bulk update imports
find app/ features/ lib/ -name "*.ts" -o -name "*.tsx" | \\
  xargs sed -i '' "s|@/components/${feature}/|@/features/${feature}/ui/|g"
\`\`\`

### Step 2.4: Build & Validate (2 min)
\`\`\`bash
npm run build
\`\`\`

**Success Criteria:**
- ✅ Build passing
- ✅ No "Module not found" errors

### Step 2.5: Commit
\`\`\`bash
git add -A
git commit -m "feat: migrate ${feature} components (Phase 2)"
\`\`\`

---

## ✅ PHASE 3: DOMAIN LOGIC MIGRATION (${phase3Time} MIN)

**Goal:** Move business logic to \`features/${feature}/domain/\`.
`

  // Add phase 3 customizations
  const phase3Customs = customizations.filter(c => c.phase === 3)
  phase3Customs.forEach(c => {
    checklist += '\n' + c.content + '\n'
  })

  checklist += `
### Step 3.1: Identify Domain Code (5 min)
\`\`\`bash
grep -r "${feature}" lib/ --include="*.ts" | grep -v node_modules
\`\`\`

### Step 3.2: Move Domain Files (${phase3Time - 10} min)
\`\`\`bash
git mv lib/domain/${feature}-*.ts features/${feature}/domain/ 2>/dev/null || true
\`\`\`

### Step 3.3: Validate (${phase3Time - 10} min)
\`\`\`bash
npm test
npm run build
\`\`\`

### Step 3.4: Commit
\`\`\`bash
git add -A
git commit -m "feat: migrate ${feature} domain logic (Phase 3)"
\`\`\`

---

## ✅ PHASE 4: VALIDATION & DEPLOY (${phase4Time} MIN)
`

  // Add phase 4 customizations
  const phase4Customs = customizations.filter(c => c.phase === 4)
  phase4Customs.forEach(c => {
    checklist += '\n' + c.content + '\n'
  })

  checklist += `
### Step 4.1: Run Full Test Suite (3 min)
\`\`\`bash
npm test features/${feature}
npm test
\`\`\`

### Step 4.2: Architecture Validation (2 min)
\`\`\`bash
npm run arch:validate
\`\`\`

### Step 4.3: Complete Migration (2 min)
\`\`\`bash
npm run migrate:complete
\`\`\`

This will:
- Analyze results vs baseline
- Calculate actual vs estimated time
- Save to migration history
- Close migration session

### Step 4.4: Final Commit & Push (3 min)
\`\`\`bash
git add -A
git commit -m "feat: complete ${feature} feature migration

${feature.toUpperCase()} migration complete

RESULTS:
✅ Tests passing
✅ Build successful
✅ Architecture improved

Time: [actual time]
Complexity: ${complexity}
${customizations.length > 0 ? 'AI-Enhanced: Yes' : ''}"

git push origin main
\`\`\`

---

## 📊 SUCCESS CRITERIA

- ✅ All tests passing (100%)
- ✅ Build successful
- ✅ No breaking changes
- ✅ Architecture violations reduced

${customizations.length > 0 ? `
---

## 🤖 AI ENHANCEMENTS

This checklist includes **${customizations.length} AI-generated customizations**:

${customizations.map((c, idx) => 
  `${idx + 1}. Phase ${c.phase} - ${c.reason}`
).join('\n')}

These sections were added based on analysis of YOUR specific code.
` : ''}

---

**Generated by:** Adaptive Checklist Generator  
**AI-Enhanced:** ${customizations.length > 0 ? 'Yes' : 'No'}  
**Confidence:** ${(analysis.confidenceLevel * 100).toFixed(0)}%  
**Ready to ship!** 🚀
`

  return checklist
}

function parseEstimate(estimatedTime: string): number {
  const match = estimatedTime.match(/([\d.]+)-([\d.]+)/)
  if (!match) return 60
  
  const low = parseFloat(match[1])
  const high = parseFloat(match[2])
  return ((low + high) / 2) * 60
}

async function generate(feature: string) {
  console.log('\n📋 ADAPTIVE CHECKLIST GENERATOR\n')
  
  // Load analysis
  console.log('📊 Loading analysis...')
  const analysis = loadEnhancedAnalysis(feature)
  
  // Load predictions
  console.log('🔮 Loading predictions...')
  const predictions = loadPredictions(feature)
  
  // Generate customizations
  console.log('🤖 Generating AI customizations...')
  const customizations = generateCustomizations(analysis, predictions)
  console.log(`   Created ${customizations.length} custom sections`)
  
  // Generate checklist
  console.log('📝 Building adaptive checklist...')
  const checklist = generateAdaptiveChecklist(analysis, customizations)
  
  // Save
  const outputPath = path.join(
    process.cwd(),
    'docs',
    `${feature.toUpperCase()}-MIGRATION-CHECKLIST-AI.md`
  )
  fs.writeFileSync(outputPath, checklist)
  
  console.log()
  console.log('='.repeat(60))
  console.log('✅ ADAPTIVE CHECKLIST GENERATED!')
  console.log('='.repeat(60))
  console.log()
  console.log(`📋 File: ${outputPath}`)
  console.log(`🤖 AI Customizations: ${customizations.length}`)
  console.log(`🎯 Confidence: ${(analysis.confidenceLevel * 100).toFixed(0)}%`)
  console.log()
  
  if (customizations.length > 0) {
    console.log('Custom sections added:')
    customizations.forEach((c, idx) => {
      console.log(`  ${idx + 1}. Phase ${c.phase}: ${c.reason}`)
    })
    console.log()
  }
  
  console.log('Next steps:')
  console.log(`  1. Review checklist: code ${outputPath}`)
  console.log(`  2. Note AI warnings and recommendations`)
  console.log(`  3. Start migration: (follow checklist step-by-step)`)
  console.log()
  console.log('='.repeat(60))
  console.log()
}

// CLI
const feature = process.argv[2]

if (!feature) {
  console.error('❌ Usage: npm run migrate:checklist:ai <feature-name>')
  console.error('   Example: npm run migrate:checklist:ai vision')
  process.exit(1)
}

generate(feature).catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
