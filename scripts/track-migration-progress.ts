#!/usr/bin/env tsx
/**
 * Migration Progress Tracker
 * 
 * Monitors git commits to track migration progress in real-time.
 * Called by pre-commit hook to update progress automatically.
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface MigrationSession {
  feature: string
  startTime: Date
  baseline: any
  analysis: any
  checklistPath: string
  sessionId: string
  progress?: MigrationProgress
}

interface MigrationProgress {
  phases: {
    tests?: PhaseProgress
    components?: PhaseProgress
    domain?: PhaseProgress
    validation?: PhaseProgress
  }
  currentPhase: string | null
  totalElapsed: number
  commits: number
  lastUpdate: Date
}

interface PhaseProgress {
  status: 'not_started' | 'in_progress' | 'complete'
  startTime?: Date
  endTime?: Date
  duration?: number
  commits: number
}

function loadSession(): MigrationSession | null {
  const sessionPath = path.join(process.cwd(), '.migration-session.json')
  
  if (!fs.existsSync(sessionPath)) {
    return null
  }
  
  try {
    const session = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'))
    // Convert date strings back to Date objects
    session.startTime = new Date(session.startTime)
    if (session.progress?.lastUpdate) {
      session.progress.lastUpdate = new Date(session.progress.lastUpdate)
    }
    return session
  } catch {
    return null
  }
}

function saveSession(session: MigrationSession) {
  const sessionPath = path.join(process.cwd(), '.migration-session.json')
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2))
}

function detectPhase(commitMessage: string): string | null {
  const lowerMsg = commitMessage.toLowerCase()
  
  if (lowerMsg.includes('test') && lowerMsg.includes('phase 1')) {
    return 'tests'
  }
  if (lowerMsg.includes('component') || lowerMsg.includes('phase 2')) {
    return 'components'
  }
  if (lowerMsg.includes('domain') || lowerMsg.includes('phase 3')) {
    return 'domain'
  }
  if (lowerMsg.includes('validation') || lowerMsg.includes('complete') || lowerMsg.includes('phase 4')) {
    return 'validation'
  }
  
  return null
}

function getElapsedMinutes(startTime: Date): number {
  return (Date.now() - new Date(startTime).getTime()) / 1000 / 60
}

function updateProgress(
  session: MigrationSession,
  commitMessage: string
): MigrationSession {
  // Initialize progress if needed
  if (!session.progress) {
    session.progress = {
      phases: {},
      currentPhase: null,
      totalElapsed: 0,
      commits: 0,
      lastUpdate: new Date()
    }
  }
  
  const phase = detectPhase(commitMessage)
  
  if (!phase) {
    // Generic migration commit, just increment counter
    session.progress.commits++
    session.progress.totalElapsed = getElapsedMinutes(session.startTime)
    session.progress.lastUpdate = new Date()
    return session
  }
  
  // Update phase progress
  const phaseKey = phase as keyof typeof session.progress.phases
  const currentPhase = session.progress.phases[phaseKey]
  
  if (!currentPhase) {
    // Starting new phase
    session.progress.phases[phaseKey] = {
      status: 'in_progress',
      startTime: new Date(),
      commits: 1
    }
    session.progress.currentPhase = phase
  } else if (currentPhase.status === 'in_progress') {
    // Completing current phase
    currentPhase.status = 'complete'
    currentPhase.endTime = new Date()
    currentPhase.duration = getElapsedMinutes(currentPhase.startTime!)
    currentPhase.commits++
    session.progress.currentPhase = null
  } else {
    // Phase already complete, just increment
    currentPhase.commits++
  }
  
  session.progress.commits++
  session.progress.totalElapsed = getElapsedMinutes(session.startTime)
  session.progress.lastUpdate = new Date()
  
  return session
}

function printProgress(session: MigrationSession) {
  if (!session.progress) {
    return
  }
  
  const { feature, analysis, progress } = session
  const estimatedMinutes = parseEstimate(analysis.estimatedTime)
  
  console.log()
  console.log('='.repeat(50))
  console.log(`📊 MIGRATION PROGRESS: ${feature.toUpperCase()}`)
  console.log('='.repeat(50))
  console.log()
  console.log(`⏱️   Time: ${progress.totalElapsed.toFixed(1)} min / ${estimatedMinutes} min`)
  console.log(`📝  Commits: ${progress.commits}`)
  console.log()
  console.log('Phases:')
  
  const phases = ['tests', 'components', 'domain', 'validation']
  phases.forEach(phase => {
    const phaseData = progress.phases[phase as keyof typeof progress.phases]
    const status = phaseData?.status || 'not_started'
    const icon = status === 'complete' ? '✅' : status === 'in_progress' ? '🔄' : '⏸️'
    const time = phaseData?.duration ? ` (${phaseData.duration.toFixed(1)} min)` : ''
    
    console.log(`  ${icon} ${phase}${time}`)
  })
  
  console.log()
  
  // Check if ahead/behind schedule
  const percentComplete = Object.values(progress.phases).filter(p => p?.status === 'complete').length / 4
  const expectedTime = estimatedMinutes * percentComplete
  const variance = progress.totalElapsed - expectedTime
  
  if (Math.abs(variance) > 5 && percentComplete > 0) {
    if (variance > 0) {
      console.log(`⚠️   Running ${variance.toFixed(1)} min behind estimate`)
    } else {
      console.log(`✨  Running ${Math.abs(variance).toFixed(1)} min ahead of estimate`)
    }
    console.log()
  }
  
  console.log('='.repeat(50))
  console.log()
}

function parseEstimate(estimatedTime: string): number {
  // Parse "0.5-1 hour" or "1-1.5 hours" to average minutes
  const match = estimatedTime.match(/([\d.]+)-([\d.]+)/)
  if (!match) return 60
  
  const low = parseFloat(match[1])
  const high = parseFloat(match[2])
  return ((low + high) / 2) * 60
}

function track(commitMessage: string) {
  const session = loadSession()
  
  if (!session) {
    // No active session
    return
  }
  
  // Check if this commit is for the active migration
  if (!commitMessage.toLowerCase().includes(session.feature.toLowerCase())) {
    // Not related to active migration
    return
  }
  
  // Update progress
  const updatedSession = updateProgress(session, commitMessage)
  saveSession(updatedSession)
  
  // Print progress
  printProgress(updatedSession)
}

// CLI
const commitMessage = process.argv[2]

if (!commitMessage) {
  console.error('❌ Usage: npx tsx scripts/track-migration-progress.ts "<commit-message>"')
  process.exit(1)
}

track(commitMessage)
