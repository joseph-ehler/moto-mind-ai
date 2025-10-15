/**
 * AI Context Bridge
 * 
 * Enables Windsurf (Cascade) and Codex CLI to share context and collaborate.
 * 
 * Windsurf writes what it's working on → Codex reads and validates
 * Codex writes results → Windsurf reads and adjusts
 * 
 * Creates a feedback loop between IDE AI and Terminal AI.
 */

import * as fs from 'fs'
import * as path from 'path'

export interface CodexFeedback {
  command: string
  result: string
  success: boolean
  timestamp: Date
  suggestions?: string[]
}

export interface SharedContext {
  // What Windsurf is working on
  currentTask: string
  feature?: string
  phase?: string // 'tests' | 'components' | 'domain' | 'validation'
  files?: string[]
  
  // What Codex should do
  nextAction?: 'validate' | 'test' | 'build' | 'analyze' | null
  expectedOutput?: string
  
  // Bidirectional feedback
  windsurfStatus?: string
  windsurfUpdated?: Date
  codexFeedback?: CodexFeedback
  codexUpdated?: Date
  
  // Session tracking
  sessionId?: string
  startedAt?: Date
}

export class ContextBridge {
  private contextPath: string
  private sessionId: string
  
  constructor() {
    this.contextPath = path.join(process.cwd(), '.ai-context.json')
    this.sessionId = `session-${Date.now()}`
  }
  
  /**
   * Initialize a new session
   */
  async initialize(task: string): Promise<void> {
    const context: SharedContext = {
      currentTask: task,
      sessionId: this.sessionId,
      startedAt: new Date(),
      nextAction: null
    }
    
    await this.write(context)
    console.log(`✅ Context bridge initialized for: ${task}`)
  }
  
  /**
   * Read current context
   */
  async read(): Promise<SharedContext> {
    try {
      const data = await fs.promises.readFile(this.contextPath, 'utf-8')
      const context = JSON.parse(data)
      
      // Convert date strings back to Date objects
      if (context.windsurfUpdated) context.windsurfUpdated = new Date(context.windsurfUpdated)
      if (context.codexUpdated) context.codexUpdated = new Date(context.codexUpdated)
      if (context.startedAt) context.startedAt = new Date(context.startedAt)
      if (context.codexFeedback?.timestamp) {
        context.codexFeedback.timestamp = new Date(context.codexFeedback.timestamp)
      }
      
      return context
    } catch {
      // No context yet
      return {
        currentTask: 'unknown',
        sessionId: this.sessionId,
        nextAction: null
      }
    }
  }
  
  /**
   * Write context
   */
  private async write(context: SharedContext): Promise<void> {
    await fs.promises.writeFile(
      this.contextPath,
      JSON.stringify(context, null, 2)
    )
  }
  
  /**
   * Windsurf updates context
   */
  async updateFromWindsurf(updates: {
    task?: string
    feature?: string
    phase?: string
    files?: string[]
    status?: string
    nextAction?: SharedContext['nextAction']
  }): Promise<void> {
    const current = await this.read()
    
    const updated: SharedContext = {
      ...current,
      ...(updates.task && { currentTask: updates.task }),
      ...(updates.feature && { feature: updates.feature }),
      ...(updates.phase && { phase: updates.phase }),
      ...(updates.files && { files: updates.files }),
      ...(updates.status && { windsurfStatus: updates.status }),
      ...(updates.nextAction !== undefined && { nextAction: updates.nextAction }),
      windsurfUpdated: new Date()
    }
    
    await this.write(updated)
    
    if (updates.nextAction) {
      console.log(`💬 Windsurf → Codex: Please ${updates.nextAction}`)
    }
  }
  
  /**
   * Codex reads context (for scripts/CLI)
   */
  async getForCodex(): Promise<SharedContext> {
    return await this.read()
  }
  
  /**
   * Codex updates with feedback
   */
  async updateFromCodex(feedback: {
    command: string
    result: string
    success: boolean
    suggestions?: string[]
  }): Promise<void> {
    const current = await this.read()
    
    const updated: SharedContext = {
      ...current,
      codexFeedback: {
        ...feedback,
        timestamp: new Date()
      },
      codexUpdated: new Date(),
      nextAction: null // Clear action after Codex responds
    }
    
    await this.write(updated)
    
    const status = feedback.success ? '✅' : '❌'
    console.log(`${status} Codex → Windsurf: ${feedback.command}`)
    if (!feedback.success && feedback.suggestions) {
      console.log(`💡 Suggestions:`)
      feedback.suggestions.forEach(s => console.log(`   - ${s}`))
    }
  }
  
  /**
   * Windsurf reads Codex feedback
   */
  async getCodexFeedback(): Promise<CodexFeedback | undefined> {
    const context = await this.read()
    return context.codexFeedback
  }
  
  /**
   * Check if Codex has pending action
   */
  async hasPendingAction(): Promise<boolean> {
    const context = await this.read()
    return context.nextAction !== null && context.nextAction !== undefined
  }
  
  /**
   * Get current session info
   */
  async getSession(): Promise<Pick<SharedContext, 'sessionId' | 'currentTask' | 'startedAt'>> {
    const context = await this.read()
    return {
      sessionId: context.sessionId,
      currentTask: context.currentTask,
      startedAt: context.startedAt
    }
  }
  
  /**
   * Clear context (end session)
   */
  async clear(): Promise<void> {
    if (fs.existsSync(this.contextPath)) {
      await fs.promises.unlink(this.contextPath)
      console.log('✅ Context cleared')
    }
  }
  
  /**
   * Get context file path (for Codex CLI)
   */
  getContextPath(): string {
    return this.contextPath
  }
}

// Singleton instance
let instance: ContextBridge | null = null

export function getContextBridge(): ContextBridge {
  if (!instance) {
    instance = new ContextBridge()
  }
  return instance
}

/**
 * CLI helper to read context (for bash scripts)
 */
export async function readContextForCLI(): Promise<void> {
  const bridge = getContextBridge()
  const context = await bridge.read()
  
  console.log(JSON.stringify(context, null, 2))
}

/**
 * CLI helper to check for pending actions (for Codex watcher)
 */
export async function checkPendingAction(): Promise<void> {
  const bridge = getContextBridge()
  const hasPending = await bridge.hasPendingAction()
  
  if (hasPending) {
    const context = await bridge.read()
    console.log(`Pending action: ${context.nextAction}`)
    process.exit(0) // Has action
  } else {
    process.exit(1) // No action
  }
}
