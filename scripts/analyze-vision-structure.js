#!/usr/bin/env node
// Vision File Structure Analyzer
// Analyzes large vision files to plan optimal splitting strategy

const fs = require('fs').promises
const path = require('path')

class VisionStructureAnalyzer {
  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    
    const analysis = {
      file: path.basename(filePath),
      totalLines: lines.length,
      totalSize: content.length,
      functions: [],
      imports: [],
      exports: [],
      interfaces: [],
      constants: [],
      dependencies: new Set()
    }
    
    // Analyze each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1
      
      // Imports
      if (line.startsWith('import ')) {
        analysis.imports.push({ line: lineNum, content: line })
        this.extractDependencies(line, analysis.dependencies)
      }
      
      // Functions
      if (line.startsWith('function ') || line.match(/^(export\s+)?function\s+/)) {
        const func = this.analyzeFunctionBlock(lines, i)
        analysis.functions.push({
          name: this.extractFunctionName(line),
          startLine: lineNum,
          endLine: func.endLine,
          size: func.size,
          complexity: func.complexity,
          dependencies: func.dependencies
        })
      }
      
      // Arrow functions and constants
      if (line.match(/^(const|let|var)\s+\w+\s*=/) && (line.includes('=>') || line.includes('function'))) {
        const func = this.analyzeFunctionBlock(lines, i)
        analysis.functions.push({
          name: this.extractVariableName(line),
          startLine: lineNum,
          endLine: func.endLine,
          size: func.size,
          complexity: func.complexity,
          type: 'arrow_function'
        })
      }
      
      // Constants
      if (line.startsWith('const ') && !line.includes('=>') && !line.includes('function')) {
        analysis.constants.push({
          name: this.extractVariableName(line),
          line: lineNum,
          content: line
        })
      }
      
      // Interfaces and types
      if (line.startsWith('interface ') || line.startsWith('type ')) {
        analysis.interfaces.push({
          name: this.extractTypeName(line),
          line: lineNum,
          content: line
        })
      }
      
      // Exports
      if (line.startsWith('export ')) {
        analysis.exports.push({ line: lineNum, content: line })
      }
    }
    
    return analysis
  }
  
  analyzeFunctionBlock(lines, startIndex) {
    let braceCount = 0
    let inFunction = false
    let complexity = 0
    let dependencies = new Set()
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Count braces to find function end
      for (const char of line) {
        if (char === '{') {
          braceCount++
          inFunction = true
        } else if (char === '}') {
          braceCount--
          if (inFunction && braceCount === 0) {
            return {
              endLine: i + 1,
              size: i - startIndex + 1,
              complexity,
              dependencies: Array.from(dependencies)
            }
          }
        }
      }
      
      // Analyze complexity
      if (line.includes('if ') || line.includes('else ') || line.includes('switch ')) complexity++
      if (line.includes('for ') || line.includes('while ') || line.includes('forEach')) complexity++
      if (line.includes('try ') || line.includes('catch ')) complexity++
      
      // Find dependencies (function calls)
      const functionCalls = line.match(/\b\w+\(/g)
      if (functionCalls) {
        functionCalls.forEach(call => {
          const funcName = call.slice(0, -1)
          if (!['if', 'for', 'while', 'switch', 'console', 'JSON'].includes(funcName)) {
            dependencies.add(funcName)
          }
        })
      }
    }
    
    return { endLine: lines.length, size: lines.length - startIndex, complexity, dependencies: [] }
  }
  
  extractFunctionName(line) {
    const match = line.match(/function\s+(\w+)/)
    return match ? match[1] : 'anonymous'
  }
  
  extractVariableName(line) {
    const match = line.match(/^(const|let|var)\s+(\w+)/)
    return match ? match[2] : 'unknown'
  }
  
  extractTypeName(line) {
    const match = line.match(/^(interface|type)\s+(\w+)/)
    return match ? match[2] : 'unknown'
  }
  
  extractDependencies(importLine, dependencies) {
    if (importLine.includes('from ')) {
      const match = importLine.match(/from\s+['"]([^'"]+)['"]/)
      if (match) {
        dependencies.add(match[1])
      }
    }
  }
  
  generateSplittingPlan(analysis) {
    const plan = {
      file: analysis.file,
      currentSize: analysis.totalSize,
      recommendedSplits: [],
      reasoning: []
    }
    
    // Group functions by purpose/domain
    const functionGroups = this.groupFunctionsByPurpose(analysis.functions)
    
    // Create splitting recommendations
    Object.entries(functionGroups).forEach(([category, functions]) => {
      const totalSize = functions.reduce((sum, f) => sum + f.size, 0)
      
      if (totalSize > 50 || functions.length > 3) {
        plan.recommendedSplits.push({
          category,
          fileName: this.generateFileName(analysis.file, category),
          functions: functions.map(f => f.name),
          estimatedSize: totalSize,
          complexity: functions.reduce((sum, f) => sum + f.complexity, 0)
        })
      }
    })
    
    // Add reasoning
    plan.reasoning.push(`Original file has ${analysis.totalLines} lines (${Math.round(analysis.totalSize/1024)}KB)`)
    plan.reasoning.push(`Contains ${analysis.functions.length} functions with varying complexity`)
    plan.reasoning.push(`Recommended ${plan.recommendedSplits.length} module splits for better maintainability`)
    
    return plan
  }
  
  groupFunctionsByPurpose(functions) {
    const groups = {
      'service-processing': [],
      'data-extraction': [],
      'validation': [],
      'formatting': [],
      'api-handlers': [],
      'utilities': []
    }
    
    functions.forEach(func => {
      const name = func.name.toLowerCase()
      
      if (name.includes('service') || name.includes('extract') && name.includes('service')) {
        groups['service-processing'].push(func)
      } else if (name.includes('extract') || name.includes('parse') || name.includes('normalize')) {
        groups['data-extraction'].push(func)
      } else if (name.includes('validate') || name.includes('sanitize') || name.includes('rollup')) {
        groups['validation'].push(func)
      } else if (name.includes('format') || name.includes('summary') || name.includes('human')) {
        groups['formatting'].push(func)
      } else if (name.includes('handler') || name.includes('process') && func.size > 100) {
        groups['api-handlers'].push(func)
      } else {
        groups['utilities'].push(func)
      }
    })
    
    return groups
  }
  
  generateFileName(originalFile, category) {
    const base = originalFile.replace('.ts', '')
    const categoryMap = {
      'service-processing': 'service-processor',
      'data-extraction': 'data-extractor', 
      'validation': 'validator',
      'formatting': 'formatter',
      'api-handlers': 'handler',
      'utilities': 'utils'
    }
    
    return `${base}-${categoryMap[category] || category}.ts`
  }
  
  async generateReport(filePaths) {
    let report = '# 🔍 VISION FILES STRUCTURE ANALYSIS\n\n'
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    for (const filePath of filePaths) {
      try {
        console.log(`🔍 Analyzing ${filePath}...`)
        const analysis = await this.analyzeFile(filePath)
        const plan = this.generateSplittingPlan(analysis)
        
        report += `## 📁 ${analysis.file}\n\n`
        report += `**Size:** ${Math.round(analysis.totalSize/1024)}KB (${analysis.totalLines} lines)\n`
        report += `**Functions:** ${analysis.functions.length}\n`
        report += `**Complexity:** ${analysis.functions.reduce((sum, f) => sum + f.complexity, 0)} total\n\n`
        
        // Largest functions
        const largestFunctions = analysis.functions
          .sort((a, b) => b.size - a.size)
          .slice(0, 5)
        
        if (largestFunctions.length > 0) {
          report += `**Largest Functions:**\n`
          largestFunctions.forEach(func => {
            report += `- \`${func.name}\` (${func.size} lines, complexity: ${func.complexity})\n`
          })
          report += '\n'
        }
        
        // Splitting recommendations
        if (plan.recommendedSplits.length > 0) {
          report += `**🎯 Recommended Splits:**\n\n`
          plan.recommendedSplits.forEach(split => {
            report += `### ${split.fileName}\n`
            report += `- **Purpose:** ${split.category}\n`
            report += `- **Functions:** ${split.functions.join(', ')}\n`
            report += `- **Size:** ~${split.estimatedSize} lines\n`
            report += `- **Complexity:** ${split.complexity}\n\n`
          })
        }
        
        report += `**Reasoning:**\n`
        plan.reasoning.forEach(reason => {
          report += `- ${reason}\n`
        })
        report += '\n---\n\n'
        
      } catch (error) {
        console.error(`❌ Error analyzing ${filePath}:`, error.message)
        report += `## ❌ Error analyzing ${path.basename(filePath)}\n`
        report += `${error.message}\n\n---\n\n`
      }
    }
    
    return report
  }
}

// Main execution
async function main() {
  const analyzer = new VisionStructureAnalyzer()
  
  const filesToAnalyze = [
    'pages/api/vision/process.ts',
    'pages/api/vision/processImage.ts'
  ]
  
  console.log('🔍 Starting vision files structure analysis...')
  
  try {
    const report = await analyzer.generateReport(filesToAnalyze)
    
    // Write report
    const reportPath = 'VISION_FILES_ANALYSIS.md'
    await fs.writeFile(reportPath, report)
    
    console.log(`✅ Analysis complete! Report saved to: ${reportPath}`)
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { VisionStructureAnalyzer }
