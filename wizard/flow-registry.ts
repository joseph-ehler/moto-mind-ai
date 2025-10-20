/**
 * Flow Registry Loader
 * 
 * Loads and normalizes flow registries.
 * Compiles shouldExistWhen strings to predicate functions.
 */

import type { FlowRegistry, PredicateRegistry, BranchPredicate } from './types'

/**
 * Parse simple expression to predicate function
 * 
 * Supports:
 * - "mileage > 100000"
 * - "state.level == 'active'"
 * - "ownership.original == false"
 * - "state.warningLightsDetected == true"
 * 
 * Does NOT support complex boolean logic (&&, ||) in v1
 */
function parseExpression(expr: string): BranchPredicate {
  const trimmed = expr.trim()
  
  // Match: property operator value
  const match = trimmed.match(/^([a-zA-Z0-9_.]+)\s*(==|!=|>|<|>=|<=|contains)\s*(.+)$/)
  
  if (!match) {
    console.warn(`[FlowRegistry] Invalid expression: "${expr}" - defaulting to false`)
    return () => false
  }
  
  const [, path, operator, rawValue] = match
  const value = rawValue.trim().replace(/^['"]|['"]$/g, '') // Remove quotes
  
  return (state: any) => {
    // Navigate nested path (e.g., "state.level")
    const parts = path.split('.')
    let current = state
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return false
      }
      current = current[part]
    }
    
    // Coerce value for comparison
    let compareValue: any = value
    if (value === 'true') compareValue = true
    else if (value === 'false') compareValue = false
    else if (!isNaN(Number(value))) compareValue = Number(value)
    
    // Evaluate operator
    switch (operator) {
      case '==':
        return current == compareValue
      case '!=':
        return current != compareValue
      case '>':
        return Number(current) > Number(compareValue)
      case '<':
        return Number(current) < Number(compareValue)
      case '>=':
        return Number(current) >= Number(compareValue)
      case '<=':
        return Number(current) <= Number(compareValue)
      case 'contains':
        return String(current).toLowerCase().includes(String(compareValue).toLowerCase())
      default:
        return false
    }
  }
}

/**
 * Build predicate registry from branch templates
 */
export function buildPredicateRegistry(registry: FlowRegistry): PredicateRegistry {
  const predicates: PredicateRegistry = {}
  
  if (!registry.branchTemplates) {
    return predicates
  }
  
  for (const template of registry.branchTemplates) {
    if (template.shouldExistWhen) {
      predicates[template.id] = parseExpression(template.shouldExistWhen)
    }
  }
  
  return predicates
}

/**
 * Normalize registry (future: add validation, defaults, etc.)
 */
export function normalizeRegistry(registry: FlowRegistry): FlowRegistry {
  // Future: add JSON schema validation
  // Future: add default values
  // Future: validate step IDs are unique
  
  return registry
}

/**
 * Load flow registry from JSON
 */
export async function loadFlowRegistry(path: string): Promise<FlowRegistry> {
  try {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to load registry: ${response.statusText}`)
    }
    
    const json = await response.json()
    return normalizeRegistry(json)
  } catch (error) {
    console.error('[FlowRegistry] Load error:', error)
    throw error
  }
}

/**
 * Get step by ID from registry
 */
export function getStepById(
  registry: FlowRegistry,
  stepId: string
): StepConfig | null {
  // Check base flow
  const baseStep = registry.baseFlow.find(s => s.id === stepId)
  if (baseStep) return baseStep
  
  // Check branch templates
  if (registry.branchTemplates) {
    const branchStep = registry.branchTemplates.find(s => s.id === stepId)
    if (branchStep) return branchStep
  }
  
  return null
}

/**
 * Get all branch templates triggered by a parent step
 */
export function getBranchTemplatesFor(
  registry: FlowRegistry,
  parentId: string
): StepConfig[] {
  if (!registry.branchTemplates) {
    return []
  }
  
  const parent = getStepById(registry, parentId)
  if (!parent || !parent.branchOnComplete) {
    return []
  }
  
  return registry.branchTemplates.filter(t => 
    parent.branchOnComplete?.includes(t.id)
  )
}
