#!/usr/bin/env tsx
/**
 * Context Checkpoint System
 * 
 * Saves and recalls project decisions, architecture choices, and context
 * across sessions. Solves the "context amnesia" problem.
 */

import * as fs from 'fs'
import * as path from 'path'

const CONTEXT_DIR = '.windsurf/context'
const ACTIVE_CONTEXT_PATH = `${CONTEXT_DIR}/active.json`
const CHECKPOINTS_DIR = `${CONTEXT_DIR}/checkpoints`

// ============================================================================
// TYPES
// ============================================================================

interface ProjectContext {
  version: string
  project: ProjectInfo
  architecture: ArchitectureInfo
  decisions: Decision[]
  active_work: ActiveWork
  important_files: ImportantFile[]
  known_patterns: string[]
  last_updated: string
}

interface ProjectInfo {
  name: string
  description: string
  tech_stack: string[]
  patterns: string[]
}

interface ArchitectureInfo {
  style: string
  structure: string
  key_directories: string[]
  conventions: string[]
}

interface Decision {
  id: string
  timestamp: string
  decision: string
  rationale: string
  affected_files: string[]
  category: 'architecture' | 'security' | 'performance' | 'ux' | 'technical' | 'business'
  impact: 'high' | 'medium' | 'low'
}

interface ActiveWork {
  current_feature?: string
  phase?: string
  next_steps: string[]
  blockers: string[]
  files_changed: string[]
  context_summary: string
}

interface ImportantFile {
  path: string
  purpose: string
  last_modified: string
  key_exports?: string[]
}

// ============================================================================
// CONTEXT MANAGEMENT
// ============================================================================

function loadContext(): ProjectContext {
  if (!fs.existsSync(ACTIVE_CONTEXT_PATH)) {
    return initializeContext()
  }
  
  try {
    return JSON.parse(fs.readFileSync(ACTIVE_CONTEXT_PATH, 'utf-8'))
  } catch (error) {
    console.warn('⚠️  Failed to load context, initializing fresh')
    return initializeContext()
  }
}

function saveContext(context: ProjectContext): void {
  if (!fs.existsSync(CONTEXT_DIR)) {
    fs.mkdirSync(CONTEXT_DIR, { recursive: true })
  }
  
  context.last_updated = new Date().toISOString()
  fs.writeFileSync(ACTIVE_CONTEXT_PATH, JSON.stringify(context, null, 2), 'utf-8')
}

function initializeContext(): ProjectContext {
  return {
    version: '1.0',
    project: {
      name: 'motomind-ai',
      description: 'Fleet intelligence you can explain, audit, and trust',
      tech_stack: ['Next.js', 'TypeScript', 'Supabase', 'NextAuth'],
      patterns: ['Feature-based architecture', 'NextAuth + Supabase', 'RLS tenant isolation']
    },
    architecture: {
      style: 'feature-based',
      structure: 'features/{name}/{domain,data,ui,hooks}',
      key_directories: ['features/', 'components/', 'lib/', 'pages/'],
      conventions: [
        'Features are self-contained',
        'Public API via index.ts',
        'Path aliases (@/) for imports',
        'RLS for tenant isolation'
      ]
    },
    decisions: [],
    active_work: {
      next_steps: [],
      blockers: [],
      files_changed: [],
      context_summary: ''
    },
    important_files: [],
    known_patterns: [],
    last_updated: new Date().toISOString()
  }
}

// ============================================================================
// DECISION TRACKING
// ============================================================================

export function recordDecision(
  decision: string,
  rationale: string,
  category: Decision['category'],
  impact: Decision['impact'],
  affected_files: string[] = []
): string {
  const context = loadContext()
  
  const decisionRecord: Decision = {
    id: `decision_${Date.now()}`,
    timestamp: new Date().toISOString(),
    decision,
    rationale,
    affected_files,
    category,
    impact
  }
  
  context.decisions.unshift(decisionRecord)
  
  // Keep only last 50 decisions
  if (context.decisions.length > 50) {
    context.decisions = context.decisions.slice(0, 50)
  }
  
  saveContext(context)
  
  return decisionRecord.id
}

export function getRecentDecisions(limit: number = 10): Decision[] {
  const context = loadContext()
  return context.decisions.slice(0, limit)
}

export function searchDecisions(query: string): Decision[] {
  const context = loadContext()
  const lowerQuery = query.toLowerCase()
  
  return context.decisions.filter(d =>
    d.decision.toLowerCase().includes(lowerQuery) ||
    d.rationale.toLowerCase().includes(lowerQuery) ||
    d.category.toLowerCase().includes(lowerQuery)
  )
}

// ============================================================================
// CHECKPOINT SYSTEM
// ============================================================================

export function createCheckpoint(name: string, description?: string): string {
  if (!fs.existsSync(CHECKPOINTS_DIR)) {
    fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true })
  }
  
  const context = loadContext()
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
  const filename = `${timestamp}_${name.replace(/[^a-z0-9]+/gi, '_')}.json`
  const filepath = path.join(CHECKPOINTS_DIR, filename)
  
  const checkpoint = {
    ...context,
    checkpoint_name: name,
    checkpoint_description: description,
    checkpoint_timestamp: new Date().toISOString()
  }
  
  fs.writeFileSync(filepath, JSON.stringify(checkpoint, null, 2), 'utf-8')
  
  return filepath
}

export function listCheckpoints(): Array<{ name: string; timestamp: string; path: string }> {
  if (!fs.existsSync(CHECKPOINTS_DIR)) {
    return []
  }
  
  const files = fs.readdirSync(CHECKPOINTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const filepath = path.join(CHECKPOINTS_DIR, f)
      const content = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      return {
        name: content.checkpoint_name || f.replace('.json', ''),
        timestamp: content.checkpoint_timestamp || '',
        path: filepath
      }
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  
  return files
}

export function restoreCheckpoint(checkpointPath: string): void {
  if (!fs.existsSync(checkpointPath)) {
    throw new Error(`Checkpoint not found: ${checkpointPath}`)
  }
  
  const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'))
  delete checkpoint.checkpoint_name
  delete checkpoint.checkpoint_description
  delete checkpoint.checkpoint_timestamp
  
  saveContext(checkpoint)
}

// ============================================================================
// ACTIVE WORK TRACKING
// ============================================================================

export function updateActiveWork(updates: Partial<ActiveWork>): void {
  const context = loadContext()
  context.active_work = {
    ...context.active_work,
    ...updates
  }
  saveContext(context)
}

export function getActiveWork(): ActiveWork {
  const context = loadContext()
  return context.active_work
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2]

switch (command) {
  case 'show': {
    const context = loadContext()
    
    console.log('\n📋 Project Context\n')
    console.log(`Project: ${context.project.name}`)
    console.log(`Description: ${context.project.description}`)
    console.log(`Architecture: ${context.architecture.style}`)
    console.log(`Last Updated: ${new Date(context.last_updated).toLocaleString()}`)
    console.log()
    
    if (context.active_work.current_feature) {
      console.log(`🎯 Active Work:`)
      console.log(`   Feature: ${context.active_work.current_feature}`)
      console.log(`   Phase: ${context.active_work.phase || 'N/A'}`)
      if (context.active_work.context_summary) {
        console.log(`   Context: ${context.active_work.context_summary}`)
      }
      console.log()
    }
    
    if (context.decisions.length > 0) {
      console.log(`📚 Recent Decisions (${context.decisions.length} total):`)
      context.decisions.slice(0, 5).forEach((d, i) => {
        const impact = d.impact === 'high' ? '🔴' : d.impact === 'medium' ? '🟡' : '🟢'
        console.log(`${i + 1}. ${impact} ${d.decision}`)
        console.log(`   ${d.rationale}`)
        console.log(`   Category: ${d.category} | ${new Date(d.timestamp).toLocaleDateString()}`)
        console.log()
      })
    }
    break
  }
  
  case 'checkpoint': {
    const name = process.argv[3]
    const description = process.argv.slice(4).join(' ')
    
    if (!name) {
      console.error('Usage: windsurf:context checkpoint <name> [description]')
      process.exit(1)
    }
    
    const filepath = createCheckpoint(name, description)
    console.log(`\n✅ Checkpoint created: ${path.basename(filepath)}`)
    console.log(`   Location: ${filepath}\n`)
    break
  }
  
  case 'checkpoints': {
    const checkpoints = listCheckpoints()
    
    console.log('\n📦 Saved Checkpoints\n')
    
    if (checkpoints.length === 0) {
      console.log('   No checkpoints saved yet\n')
      break
    }
    
    checkpoints.forEach((cp, i) => {
      console.log(`${i + 1}. ${cp.name}`)
      console.log(`   Saved: ${new Date(cp.timestamp).toLocaleString()}`)
      console.log(`   Path: ${cp.path}`)
      console.log()
    })
    break
  }
  
  case 'restore': {
    const checkpointPath = process.argv[3]
    
    if (!checkpointPath) {
      console.error('Usage: windsurf:context restore <checkpoint-path>')
      process.exit(1)
    }
    
    try {
      restoreCheckpoint(checkpointPath)
      console.log(`\n✅ Context restored from checkpoint\n`)
    } catch (error) {
      console.error(`❌ Failed to restore: ${error}`)
      process.exit(1)
    }
    break
  }
  
  case 'decision': {
    const decision = process.argv[3]
    const rationale = process.argv[4]
    const category = (process.argv[5] || 'technical') as Decision['category']
    const impact = (process.argv[6] || 'medium') as Decision['impact']
    
    if (!decision || !rationale) {
      console.error('Usage: windsurf:context decision <decision> <rationale> [category] [impact]')
      console.error('Categories: architecture, security, performance, ux, technical, business')
      console.error('Impact: high, medium, low')
      process.exit(1)
    }
    
    const id = recordDecision(decision, rationale, category, impact)
    console.log(`\n✅ Decision recorded: ${id}\n`)
    break
  }
  
  case 'decisions': {
    const limit = parseInt(process.argv[3] || '10')
    const decisions = getRecentDecisions(limit)
    
    console.log(`\n📚 Recent Decisions (showing ${Math.min(limit, decisions.length)})\n`)
    
    if (decisions.length === 0) {
      console.log('   No decisions recorded yet\n')
      break
    }
    
    decisions.forEach((d, i) => {
      const impact = d.impact === 'high' ? '🔴' : d.impact === 'medium' ? '🟡' : '🟢'
      console.log(`${i + 1}. ${impact} ${d.decision}`)
      console.log(`   ${d.rationale}`)
      console.log(`   Category: ${d.category} | ${new Date(d.timestamp).toLocaleDateString()}`)
      if (d.affected_files.length > 0) {
        console.log(`   Files: ${d.affected_files.slice(0, 3).join(', ')}${d.affected_files.length > 3 ? '...' : ''}`)
      }
      console.log()
    })
    break
  }
  
  case 'search': {
    const query = process.argv.slice(3).join(' ')
    
    if (!query) {
      console.error('Usage: windsurf:context search <query>')
      process.exit(1)
    }
    
    const results = searchDecisions(query)
    
    console.log(`\n🔍 Search results for "${query}"\n`)
    
    if (results.length === 0) {
      console.log('   No matching decisions found\n')
      break
    }
    
    console.log(`Found ${results.length} decisions:\n`)
    results.forEach((d, i) => {
      const impact = d.impact === 'high' ? '🔴' : d.impact === 'medium' ? '🟡' : '🟢'
      console.log(`${i + 1}. ${impact} ${d.decision}`)
      console.log(`   ${d.rationale}`)
      console.log(`   ${new Date(d.timestamp).toLocaleDateString()}`)
      console.log()
    })
    break
  }
  
  case 'init': {
    const context = initializeContext()
    saveContext(context)
    console.log('\n✅ Context initialized with project defaults\n')
    break
  }
  
  default:
    console.log(`
💾 Context Checkpoint System

Usage:
  npm run windsurf:context <command> [args]

Commands:
  show                    - Show current project context
  init                    - Initialize context with defaults
  
  decision <decision> <rationale> [category] [impact]
                         - Record a decision
  decisions [limit]      - List recent decisions
  search <query>         - Search decisions
  
  checkpoint <name> [description]
                         - Create a checkpoint
  checkpoints            - List all checkpoints
  restore <path>         - Restore from checkpoint

Examples:
  npm run windsurf:context show
  npm run windsurf:context decision "Use NextAuth" "Better OAuth support" architecture high
  npm run windsurf:context decisions 20
  npm run windsurf:context search "auth"
  npm run windsurf:context checkpoint "before-migration" "Before auth migration"
  npm run windsurf:context checkpoints

Categories: architecture, security, performance, ux, technical, business
Impact Levels: high, medium, low
`)
    break
}
