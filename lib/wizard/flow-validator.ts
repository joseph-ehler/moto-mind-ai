/**
 * Ultra God-Tier Wizard: Flow Validator
 * 
 * Validates flow JSON against strict schema.
 * Provides beautiful, actionable error messages.
 * 
 * Phase A: Contracts & Validator
 */

import { FlowSchema, type FlowConfig } from './flow-schema'
import { validateExpression } from './expression-engine'
import { ZodError } from 'zod'

export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  flow?: FlowConfig
}

export interface ValidationError {
  path: string
  message: string
  code: string
  line?: number
  suggestion?: string
}

export interface ValidationWarning {
  path: string
  message: string
  suggestion?: string
}

/**
 * Validate flow JSON with beautiful error reporting
 */
export function validateFlow(json: any, strictMode = true): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  
  // 1. Schema validation
  try {
    const flow = FlowSchema.parse(json)
    
    // 2. Strict mode checks
    if (strictMode || flow.privacy.strictMode) {
      const strictErrors = runStrictModeChecks(flow)
      errors.push(...strictErrors)
    }
    
    // 3. Best practice warnings
    const bestPracticeWarnings = runBestPracticeChecks(flow)
    warnings.push(...bestPracticeWarnings)
    
    // 4. Return result
    if (errors.length > 0) {
      return { valid: false, errors, warnings }
    }
    
    return {
      valid: true,
      flow,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
    
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert Zod errors to our format
      const formattedErrors = formatZodErrors(error)
      return { valid: false, errors: formattedErrors }
    }
    
    throw error
  }
}

/**
 * Strict mode checks (enforces platform contracts)
 */
function runStrictModeChecks(flow: FlowConfig): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Check 1: All fields must have privacy tags
  for (const chapter of flow.chapters) {
    for (const step of chapter.steps) {
      if (step.type.startsWith('form.') && 'fields' in step) {
        for (const field of step.fields) {
          if (!field.privacy) {
            errors.push({
              path: `chapters.${chapter.id}.steps.${step.id}.fields.${field.id}`,
              message: `Field "${field.id}" missing required privacy configuration`,
              code: 'MISSING_PRIVACY',
              suggestion: 'Add privacy: { classification, purpose, retention, allowInAI }',
            })
          }
        }
      }
    }
  }
  
  // Check 2: All steps must have navigation rules
  for (const chapter of flow.chapters) {
    for (const step of chapter.steps) {
      if (step.type !== 'processing.scene' && !step.navigation) {
        errors.push({
          path: `chapters.${chapter.id}.steps.${step.id}`,
          message: `Step "${step.id}" missing navigation configuration`,
          code: 'MISSING_NAVIGATION',
          suggestion: 'Add navigation: { continueLabel, showFooterBack }',
        })
      }
    }
  }
  
  // Check 3: i18n keys should be used (not raw strings) in strict mode
  for (const chapter of flow.chapters) {
    for (const step of chapter.steps) {
      if (step.title && !step.titleKey) {
        errors.push({
          path: `chapters.${chapter.id}.steps.${step.id}`,
          message: `Step "${step.id}" uses raw title instead of titleKey`,
          code: 'MISSING_I18N_KEY',
          suggestion: 'Replace "title" with "titleKey" for i18n support',
        })
      }
    }
  }
  
  // Check 4: Validate all expressions
  for (const chapter of flow.chapters) {
    for (const step of chapter.steps) {
      // Validate shouldExistWhen
      if (step.shouldExistWhen) {
        const result = validateExpression(step.shouldExistWhen)
        if (!result.valid) {
          errors.push({
            path: `chapters.${chapter.id}.steps.${step.id}.shouldExistWhen`,
            message: `Invalid expression: ${result.error}`,
            code: 'INVALID_EXPRESSION',
            suggestion: 'Check expression syntax and use only allowed operations',
          })
        }
      }
      
      // Validate continueEnabledWhen (for form steps)
      if (step.type.startsWith('form.') && 'validationLogic' in step && step.validationLogic?.continueEnabledWhen) {
        const result = validateExpression(step.validationLogic.continueEnabledWhen)
        if (!result.valid) {
          errors.push({
            path: `chapters.${chapter.id}.steps.${step.id}.validationLogic.continueEnabledWhen`,
            message: `Invalid expression: ${result.error}`,
            code: 'INVALID_EXPRESSION',
            suggestion: 'Check expression syntax and use only allowed operations',
          })
        }
      }
    }
  }
  
  return errors
}

/**
 * Best practice checks (non-blocking warnings)
 */
function runBestPracticeChecks(flow: FlowConfig): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  
  // Warning 1: Long forms without helpers
  for (const chapter of flow.chapters) {
    for (const step of chapter.steps) {
      if (step.type.startsWith('form.') && 'fields' in step) {
        if (step.fields.length > 3 && !step.helpers) {
          warnings.push({
            path: `chapters.${chapter.id}.steps.${step.id}`,
            message: `Form has ${step.fields.length} fields but no helpers`,
            suggestion: 'Consider adding helpers to guide users through longer forms',
          })
        }
      }
    }
  }
  
  // Warning 2: Missing analytics namespace
  if (!flow.analytics || !flow.analytics.namespace) {
    warnings.push({
      path: 'analytics',
      message: 'Missing analytics namespace',
      suggestion: 'Add analytics.namespace for proper event tracking',
    })
  }
  
  // Warning 3: Sensitive data in AI-allowed fields
  for (const chapter of flow.chapters) {
    for (const step of chapter.steps) {
      if (step.type.startsWith('form.') && 'fields' in step) {
        for (const field of step.fields) {
          if (
            field.privacy?.classification === 'SENSITIVE' &&
            field.privacy?.allowInAI === true
          ) {
            warnings.push({
              path: `chapters.${chapter.id}.steps.${step.id}.fields.${field.id}`,
              message: `Sensitive field "${field.id}" is marked as allowInAI: true`,
              suggestion: 'Consider setting allowInAI: false for sensitive data',
            })
          }
        }
      }
    }
  }
  
  return warnings
}

/**
 * Format Zod errors into readable format
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
    suggestion: getSuggestionForZodError(err),
  }))
}

/**
 * Get helpful suggestions for common Zod errors
 */
function getSuggestionForZodError(err: any): string | undefined {
  if (err.code === 'invalid_type') {
    return `Expected ${err.expected}, received ${err.received}`
  }
  
  if (err.code === 'invalid_enum_value') {
    return `Valid options: ${err.options.join(', ')}`
  }
  
  if (err.code === 'too_small') {
    return `Minimum ${err.minimum} items required`
  }
  
  return undefined
}

/**
 * Pretty print validation results (plain text, no colors)
 */
export function printValidationResults(result: ValidationResult, flowPath: string) {
  console.log('\nFlow Validation Results')
  console.log('─'.repeat(60))
  console.log(`File: ${flowPath}\n`)
  
  if (result.valid) {
    console.log('✓ Flow is valid!\n')
    
    if (result.warnings && result.warnings.length > 0) {
      console.log(`⚠ ${result.warnings.length} warnings:\n`)
      
      for (const warning of result.warnings) {
        console.log('  ⚠ ' + warning.message)
        console.log('    at: ' + warning.path)
        if (warning.suggestion) {
          console.log('    💡 ' + warning.suggestion)
        }
        console.log()
      }
    }
    
    // Print summary
    if (result.flow) {
      console.log('Flow Summary:')
      console.log('─'.repeat(60))
      console.log(`  ID: ${result.flow.id}`)
      console.log(`  Version: ${result.flow.version}`)
      console.log(`  Chapters: ${result.flow.chapters.length}`)
      
      const totalSteps = result.flow.chapters.reduce(
        (sum, chapter) => sum + chapter.steps.length,
        0
      )
      console.log(`  Total Steps: ${totalSteps}`)
      console.log()
    }
    
  } else {
    console.log(`✗ Flow validation failed with ${result.errors!.length} errors:\n`)
    
    for (const error of result.errors!) {
      console.log('  ✗ ' + error.message)
      console.log('    at: ' + error.path)
      console.log('    code: ' + error.code)
      if (error.suggestion) {
        console.log('    💡 ' + error.suggestion)
      }
      console.log()
    }
  }
  
  console.log('─'.repeat(60))
}

/**
 * Validate flow file (reads from disk)
 */
export async function validateFlowFile(
  filePath: string,
  strictMode = true
): Promise<ValidationResult> {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  // Read file
  const content = await fs.readFile(filePath, 'utf-8')
  const json = JSON.parse(content)
  
  // Validate
  const result = validateFlow(json, strictMode)
  
  // Pretty print
  printValidationResults(result, filePath)
  
  return result
}
