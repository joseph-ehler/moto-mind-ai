/**
 * Ultra God-Tier Wizard: Template Resolver
 * 
 * Resolves template placeholders like {{ctx.field}} and {{fields.vin.value}}
 * with safe, read-only access to context.
 * 
 * Phase B-3: Data Source Registry
 */

import type { EvalContext } from './types'

// ============================================================================
// TEMPLATE RESOLUTION
// ============================================================================

/**
 * Resolve template string with context
 * 
 * Supports:
 * - {{ctx.vehicle.vin}}
 * - {{fields.vin.value}}
 * - {{data.make}} (for response mapping)
 * 
 * Fails closed: returns empty string if path not found
 */
export function resolveTemplate(
  template: string,
  context: EvalContext,
  data?: any
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = resolvePath(path.trim(), context, data)
    
    if (value === undefined || value === null) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[DataSource] Template path not found: ${path}`)
      }
      return '' // Fail closed
    }
    
    return String(value)
  })
}

/**
 * Resolve all templates in an object
 */
export function resolveTemplateObject(
  obj: Record<string, string>,
  context: EvalContext,
  data?: any
): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes('{{')) {
      result[key] = resolveTemplate(value, context, data)
    } else {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Check if template has any unresolved placeholders
 */
export function hasUnresolvedPlaceholders(str: string): boolean {
  return /\{\{[^}]+\}\}/.test(str)
}

// ============================================================================
// PATH RESOLUTION
// ============================================================================

/**
 * Resolve dot-notation path in context
 * 
 * Examples:
 * - "ctx.vehicle.vin" -> context.ctx.vehicle.vin
 * - "fields.vin.value" -> context.fields.vin.value
 * - "data.make" -> data.make
 */
function resolvePath(
  path: string,
  context: EvalContext,
  data?: any
): any {
  const parts = path.split('.')
  const root = parts[0]
  
  let current: any
  
  // Determine root object
  if (root === 'ctx') {
    current = context.ctx
    parts.shift() // Remove 'ctx'
  } else if (root === 'fields') {
    current = context.fields
    parts.shift() // Remove 'fields'
  } else if (root === 'flags') {
    current = context.flags || {}
    parts.shift() // Remove 'flags'
  } else if (root === 'data') {
    current = data || {}
    parts.shift() // Remove 'data'
  } else {
    // Try ctx as default
    current = context.ctx
  }
  
  // Walk the path
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined
    }
    current = current[part]
  }
  
  return current
}

// ============================================================================
// DEEP ASSIGN (for mapResponse)
// ============================================================================

/**
 * Deep assign value to nested path in object
 * 
 * Example:
 * deepAssign(ctx, "vehicle.make", "Toyota")
 * -> ctx.vehicle.make = "Toyota"
 */
export function deepAssign(
  obj: Record<string, any>,
  path: string,
  value: any
): void {
  const parts = path.split('.')
  let current = obj
  
  // Create nested objects if they don't exist
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part]
  }
  
  // Set the final value
  const lastPart = parts[parts.length - 1]
  current[lastPart] = value
}

/**
 * Apply mapResponse to context
 * 
 * Example:
 * mapResponse = { "vehicle.make": "{{data.make}}", "vehicle.model": "{{data.model}}" }
 * data = { make: "Toyota", model: "Camry" }
 * -> ctx.vehicle.make = "Toyota", ctx.vehicle.model = "Camry"
 */
export function applyMapResponse(
  mapResponse: Record<string, string>,
  context: EvalContext,
  data: any
): void {
  for (const [targetPath, template] of Object.entries(mapResponse)) {
    const value = resolveTemplate(template, context, data)
    
    // Determine target object (ctx, fields, flags)
    if (targetPath.startsWith('ctx.')) {
      deepAssign(context.ctx, targetPath.substring(4), value)
    } else if (targetPath.startsWith('fields.')) {
      deepAssign(context.fields, targetPath.substring(7), value)
    } else if (targetPath.startsWith('flags.')) {
      if (!context.flags) context.flags = {}
      deepAssign(context.flags, targetPath.substring(6), value)
    } else {
      // Default to ctx
      deepAssign(context.ctx, targetPath, value)
    }
  }
}
