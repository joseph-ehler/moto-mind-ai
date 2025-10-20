/**
 * Shared Wizard Types
 * 
 * Core types for multi-flow onboarding wizard engine.
 * Used by vehicle, user, and future flows (shop, fleet, claims).
 */

export type StepType = 
  | 'informational'
  | 'input'
  | 'text+chips'
  | 'numeric'
  | 'single-choice'
  | 'multi-choice'
  | 'chip-grid'
  | 'processing'
  | 'confirmation'
  | 'results'

export type ValidationRule = {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  integer?: boolean
  minSelections?: number
  maxSelections?: number
}

export type StepConfig = {
  id: string
  type: StepType
  title: string
  question: string
  
  // Interaction
  interaction?: {
    textArea?: boolean
    quickOptions?: (string | number)[]
    aiExtract?: {
      entities: string[]
      chips: boolean
    }
  }
  
  // Options for choice-based steps
  options?: string[]
  
  // Response
  response?: {
    key: string
  }
  
  // Validation
  validation?: ValidationRule
  
  // Branching
  branchOnComplete?: string[]
  
  // Display
  display?: string
  content?: any
  microInsight?: string
  help?: {
    title: string
    locations?: string[]
  }
  
  // Behavior
  estimatedSeconds?: number
  skippable?: boolean
  autoAdvance?: boolean
  
  // Processing steps
  process?: {
    endpoint: string
    timeoutMs?: number
    slowHintMs?: number
    slowHintCopy?: string
    onError?: Record<string, string>
  }
  
  // Mini step flag
  mini?: boolean
  
  // Branch predicate (for templates)
  shouldExistWhen?: string
}

export type FlowRegistry = {
  metadata: {
    name: string
    version: string
    totalSteps: string | number
    estimatedTime: string
    url: string
  }
  
  shell: {
    header: {
      left: string
      center: {
        progress: string
        format: string
      }
      right: string[]
    }
    footer: {
      left: string
      right: string
      keyboard: {
        enter: string
        esc: string
      }
    }
  }
  
  baseFlow: StepConfig[]
  branchTemplates?: StepConfig[]
  
  microInsights?: {
    templates: Record<string, string>
  }
  
  navigation?: Record<string, string>
  validation?: Record<string, any>
  persistence?: {
    method: string
    autoSave: string
    resume: {
      enabled: boolean
      modalOnReturn: boolean
      options: string[]
    }
  }
}

export type BranchPredicate = (state: any) => boolean

export type PredicateRegistry = Record<string, BranchPredicate>

export type StepItinerary = Array<{
  config: StepConfig
  weight: number
  parent?: string
}>

export type WizardState = {
  currentIndex: number
  itinerary: StepItinerary
  history: string[]
  data: Record<string, any>
  valid: boolean
  dirty: boolean
}

export type WizardConfig = {
  steps: FlowRegistry
  store: any // Zustand store slice
  predicates: PredicateRegistry
  weights?: {
    parent?: number
    mini?: number
  }
  persistenceKey: string
}

export type WizardController = {
  // Navigation
  next: () => void
  back: () => void
  skip: () => void
  jumpTo: (stepId: string) => void
  exit: () => void
  
  // State
  currentStep: StepConfig | null
  currentIndex: number
  totalSteps: number
  progress: number
  canGoBack: boolean
  canGoNext: boolean
  canSkip: boolean
  
  // Validation
  isValid: boolean
  setValid: (valid: boolean) => void
  
  // Data
  data: Record<string, any>
  setData: (key: string, value: any) => void
  
  // Persistence
  resume: () => void
  reset: () => void
  
  // Internal
  itinerary: StepItinerary
  appendBranches: (parentId: string, state: Record<string, any>) => void
  pruneBranches: (fromIndex: number) => void
}
